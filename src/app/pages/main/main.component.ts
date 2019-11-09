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

  // Document & collection reference from firestore.
  
  tableDoc: AngularFirestoreDocument<FoosballTable>;
  recordCollection: AngularFirestoreCollection<GameRecord>;

  // Component bindings.

  ldapInput: string = '';

  constructor(
      public afAuth: AngularFireAuth,
      public afs: AngularFirestore) {

    // Setup me
    this.me = afAuth.user
        .pipe(flatMap((user: firebase.User) => {
          const ldap = user.email.split('@')[0];
          const playerDoc = afs.doc<Player>(`players/${ldap}`);
          playerDoc.get().subscribe((snapshot) => {
            if (!snapshot.exists)
              this.registerPlayer(ldap, user);
          });
          return playerDoc.valueChanges();
        }));

    // Setup recentPlayers
    this.tableDoc = afs.doc<FoosballTable>('tables/default');
    const recentPlayersLdap = this.tableDoc.valueChanges()
        .pipe(map(table => table.recentPlayers));
    const playersByLdap = afs.collection<Player>('players').valueChanges()
        .pipe(map(groupByLdap));
    this.recentPlayers = combineLatest(recentPlayersLdap, playersByLdap)
        .pipe(map(([ldaps, players]) => ldaps.map(ldap => players[ldap])));

    // Setup records
    this.records = this.tableDoc.collection<GameRecord>('records', ref => 
        ref.orderBy('createdAt', 'desc').limit(50)
    ).valueChanges();
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
    this.tableDoc.get()
        .subscribe((snapshot) => {
          this.tableDoc.update({
            recentPlayers: [...snapshot.data().recentPlayers, ldap]
          });
        });
  }

  removeFromRecentPlayers(ldap: string) {
    this.tableDoc.get()
        .subscribe((snapshot) => {
          this.tableDoc.update({
            recentPlayers: snapshot.data().recentPlayers.filter(v => v !== ldap)
          });
        });
  }

  ngOnInit() {
  }

}
