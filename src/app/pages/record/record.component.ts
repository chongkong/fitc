import { Component, OnInit, Inject } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, combineLatest } from "rxjs";
import { map, flatMap, first, last } from "rxjs/operators";
import { firestore } from "firebase";

import { Player, GameRecord, FoosballTable } from "common/types";

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
};

function groupByLdap(players: Player[]) {
  return players.reduce((dict, player) => {
    dict[player.ldap] = player;
    return dict;
  }, {});
}

@Component({
  selector: "app-record",
  templateUrl: "./record.component.html",
  styleUrls: ["./record.component.scss"]
})
export class RecordComponent implements OnInit {
  // Observables from firestore.

  me: Observable<Player>;
  records: Observable<GameRecord[]>;
  lastRecord: Observable<GameRecord | undefined>;
  recentPlayers: Player[];

  // Document & collection reference from firestore.

  tableDoc: AngularFirestoreDocument<FoosballTable>;
  playerCollection: AngularFirestoreCollection<Player>;
  recordCollection: AngularFirestoreCollection<GameRecord>;

  // Component bindings.

  myLdap: string = "";
  ldapInput: string = "";
  winners: string[] = [];
  losers: string[] = [];
  isDraw: boolean = false;

  constructor(public afAuth: AngularFireAuth, public afs: AngularFirestore) {
    // Setup me
    this.me = afAuth.user.pipe(
      flatMap((user: firebase.User) => {
        const ldap = user.email.split("@")[0];
        this.myLdap = ldap;
        return afs.doc<Player>(`players/${ldap}`).valueChanges();
      })
    );

    // Setup recentPlayers
    this.tableDoc = afs.doc<FoosballTable>("tables/default");
    const recentPlayersLdap = this.tableDoc
      .valueChanges()
      .pipe(map(table => (table ? table.recentPlayers : [])));
    const playersByLdap = afs
      .collection<Player>("players")
      .valueChanges()
      .pipe(map(groupByLdap));
    combineLatest(recentPlayersLdap, playersByLdap)
      .pipe(map(([ldaps, players]) => ldaps.map(ldap => players[ldap])))
      .subscribe(recentPlayers => (this.recentPlayers = recentPlayers));

    // Setup records
    this.records = this.tableDoc
      .collection<GameRecord>("records", ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();

    // Setup lastRecord
    this.lastRecord = this.records.pipe(
      map(records => (records ? records[0] : undefined))
    );

    // Setup remaining collections.
    this.playerCollection = afs.collection<Player>("players");
    this.recordCollection = this.tableDoc.collection<GameRecord>("records");
  }

  addToRecentPlayers(ldap: string) {
    combineLatest(this.tableDoc.get(), this.playerCollection.get())
      .pipe(first())
      .subscribe(([tableSnapshot, playersSnapshot]) => {
        const validLdaps = playersSnapshot.docs.map(
          player => player.data().ldap
        );
        if (!validLdaps.includes(ldap)) {
          return;
        }
        this.tableDoc.update({
          recentPlayers: [...tableSnapshot.data().recentPlayers, ldap]
        });
        this.ldapInput = "";
      });
  }

  removeFromRecentPlayers(ldap: string) {
    if (this.winners.includes(ldap))
      this.winners.splice(this.winners.indexOf(ldap), 1);
    else if (this.losers.includes(ldap))
      this.losers.splice(this.losers.indexOf(ldap), 1);

    this.tableDoc.get().subscribe(snapshot => {
      this.tableDoc.update({
        recentPlayers: snapshot.data().recentPlayers.filter(v => v !== ldap)
      });
    });
  }

  private toggle(xs: string[], ys: string[], value: string) {
    const addTo = (arr: string[], val: string) => {
      if (!arr.includes(val)) {
        arr.push(val);
        if (arr.length > 2) arr.shift();
      }
    };

    const removeFrom = (arr: string[], val: string) => {
      if (arr.includes(val)) {
        arr.splice(arr.indexOf(val), 1);
      }
    };

    if (xs.includes(value)) {
      removeFrom(xs, value);
    } else {
      addTo(xs, value);
      removeFrom(ys, value);
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

  recordGame() {
    // You must have chosen proper winners and losers before recording.
    if (this.winners.length !== 2 || this.losers.length !== 2) {
      return;
    }

    const now = firestore.Timestamp.now();
    const record: GameRecord = {
      winners: this.winners,
      losers: this.losers,
      isDraw: this.isDraw,
      winStreaks: 0, // Placeholder value that will be resolved from firebase trigger.
      createdAt: now,
      recordedBy: this.myLdap
    };
    this.recordCollection
      .doc<GameRecord>(now.toMillis().toString())
      .set(record);

    // Remove losers for next challengers.
    this.losers = [];
  }

  ngOnInit() {}
}
