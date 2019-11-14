import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';

import { Player, GameRecord, FoosballTable } from 'common/types';
import { map, flatMap } from 'rxjs/operators';

/**
 * Sort by level DESC, name ASC.
 * We preform client-side sorting since composite-key sorting is
 * difficult in Firestore.
 */
const playerCompareFn = (p1: Player, p2: Player) => {
  if (p1.level < p2.level) return 1;
  if (p1.level > p2.level) return -1;
  if (p1.name < p2.name) return -1;
  if (p1.name > p2.name) return 1;
  return 0;
}

function groupByLdap(players: Player[]) {
  return players.reduce((dict, player) => {
    dict[player.ldap] = player;
    return dict;
  }, {});
}

function membershipEquals<T>(arr1: T[], arr2: T[]) {
  for (let item of arr1) {
    if (!arr2.includes(item))
      return false;
  }
  for (let item of arr2) {
    if (!arr1.includes(item))
      return false;
  }
  return true;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  // Observables from firestore.

  me: Observable<Player>;
  recentPlayers: Observable<Player[]>;
  records: Observable<GameRecord[]>;
  lastRecord: Observable<GameRecord | undefined>;

  // Document & collection reference from firestore.
  
  tableDoc: AngularFirestoreDocument<FoosballTable>;
  playerCollection: AngularFirestoreCollection<Player>;
  recordCollection: AngularFirestoreCollection<GameRecord>;

  // Component bindings.

  myLdap: string = '';
  ldapInput: string = '';
  winners: string[] = [];
  losers: string[] = [];
  isTie: boolean = false;

  constructor(
      public afAuth: AngularFireAuth,
      public afs: AngularFirestore) {

    // Setup me
    this.me = afAuth.user
        .pipe(flatMap((user: firebase.User) => {
          const ldap = user.email.split('@')[0];
          this.myLdap = ldap;
          return afs.doc<Player>(`players/${ldap}`).valueChanges();
        }));

    // Setup recentPlayers
    this.tableDoc = afs.doc<FoosballTable>('tables/default');
    const recentPlayersLdap = this.tableDoc.valueChanges()
        .pipe(map(table => table ? table.recentPlayers : []));
    const playersByLdap = afs.collection<Player>('players').valueChanges()
        .pipe(map(groupByLdap));
    this.recentPlayers = combineLatest(recentPlayersLdap, playersByLdap)
        .pipe(map(([ldaps, players]) => ldaps.map(ldap => players[ldap])));

    // Setup records
    this.records = this.tableDoc.collection<GameRecord>('records', ref => 
        ref.orderBy('createdAt', 'desc').limit(50)
    ).valueChanges();

    // Setup lastRecord
    this.lastRecord = this.records
        .pipe(map(records => records ? records[0] : undefined));

    // Setup remaining collections.
    this.playerCollection = afs.collection<Player>('players');
    this.recordCollection = this.tableDoc.collection<GameRecord>('records');
  }

  registerPlayer(ldap: string, user: firebase.User) {
    return this.afs.doc<Player>(`players/${ldap}`).set({
      name: user.displayName,
      ldap,
      level: 1,
      isNewbie: true,
    });
  }

  addToRecentPlayers(ldap: string) {
    combineLatest(this.tableDoc.get(), this.playerCollection.get())
        .subscribe(([tableSnapshot, playersSnapshot]) => {
          const validLdaps = playersSnapshot.docs.map(player => player.data().ldap);
          if (!validLdaps.includes(ldap)) {
            return;
          }
          this.tableDoc.update({
            recentPlayers: [...tableSnapshot.data().recentPlayers, ldap]
          });
        });
  }

  removeFromRecentPlayers(ldap: string) {
    if (this.winners.includes(ldap))
      this.winners.splice(this.winners.indexOf(ldap), 1);
    else if (this.losers.includes(ldap))
      this.losers.splice(this.losers.indexOf(ldap), 1);

    this.tableDoc.get()
        .subscribe((snapshot) => {
          this.tableDoc.update({
            recentPlayers: snapshot.data().recentPlayers.filter(v => v !== ldap)
          });
        });
  }

  private toggle(alpha: string[], beta: string[], value: string) {
    const addTo = (arr: string[], val: string) => {
      if (!arr.includes(val)) {
        arr.push(val);
        if (arr.length > 2)
          arr.shift();
      }
    }

    const removeFrom = (arr: string[], val: string) => {
      if (arr.includes(val)) {
        arr.splice(arr.indexOf(val), 1);
      }
    }

    if (alpha.includes(value)) {
      removeFrom(alpha, value);
    } else {
      addTo(alpha, value);
      removeFrom(beta, value);
    }
  }

  toggleWinner(ldap: string) {
    this.toggle(this.winners, this.losers, ldap);
  }

  toggleLoser(ldap: string) {
    this.toggle(this.losers, this.winners, ldap);
  }

  isWinner(ldap: string) {
    return this.winners.includes(ldap);
  }

  isLoser(ldap: string) {
    return this.losers.includes(ldap);
  }

  recordGame(players: Player[], lastRecord: GameRecord | undefined) {
    // You must have chosen proper winners and losers before recording.
    if (this.winners.length !== 2 || this.losers.length !== 2) {
      return;
    }

    const playersByLdap = groupByLdap(players);
    const makeSnapshot = (ldap: string) => ({
      ldap, 
      level: playersByLdap[ldap].level
    });

    // Check winStreaks from lastRecord.
    let winStreaks = this.isTie ? 0 : 1;
    if (!this.isTie && lastRecord && !lastRecord.isTie) {
      let prevWinners = lastRecord.winners.map(snapshot => snapshot.ldap);
      if (membershipEquals(prevWinners, this.winners)) {
        winStreaks = lastRecord.winStreaks + 1;
      }
    }

    const now = new Date();
    const record: GameRecord = {
      winners: this.winners.map(makeSnapshot),
      losers: this.losers.map(makeSnapshot),
      isTie: this.isTie,
      winStreaks,
      createdAt: now,
      recordedBy: this.myLdap
    };
    this.recordCollection.doc(now.getTime().toString()).set(record);

    // Remove losers for next challengers.
    this.losers = [];
  }

  ngOnInit() {
  }

}
