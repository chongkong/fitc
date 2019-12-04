import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, combineLatest } from "rxjs";
import { map, flatMap, take } from "rxjs/operators";
import { firestore } from "firebase";

import { Player, GameRecord, FoosballTable } from "common/types";
import {
  PlayerSelectDialogComponent,
  PlayerDialogData
} from "src/app/components/player-select-dialog/player-select-dialog.component";
import { PlayersService } from "src/app/services/players.service";
import { Path } from "common/path";

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
export class RecordComponent {
  // Observables from firestore.

  me: Observable<Player>;
  records: Observable<GameRecord[]>;
  lastRecord: Observable<GameRecord | undefined>;
  recentPlayers: Observable<Player[]>;

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
  currentRecentPlayers: Player[];

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    readonly ps: PlayersService,
    public dialog: MatDialog
  ) {
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
    const recentPlayersLdaps = this.tableDoc
      .valueChanges()
      .pipe(map(table => (table ? table.recentPlayers : [])));

    this.recentPlayers = combineLatest(
      recentPlayersLdaps,
      ps.allPlayersByLdap
    ).pipe(
      map(([ldaps, allPlayersByLdap]) => {
        this.currentRecentPlayers = ldaps.map(ldap => allPlayersByLdap[ldap]);
        return this.currentRecentPlayers;
      })
    );
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

  removeFromRecentPlayers(ldap: string) {
    if (this.winners.includes(ldap))
      this.winners.splice(this.winners.indexOf(ldap), 1);
    else if (this.losers.includes(ldap))
      this.losers.splice(this.losers.indexOf(ldap), 1);

    this.afs.doc(Path.table("default")).update({
      recentPlayers: firestore.FieldValue.arrayRemove(ldap)
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

  openDialog() {
    const unselected = this.ps.allPlayers.pipe(
      map(allPlayers => {
        return allPlayers.filter(
          player =>
            this.currentRecentPlayers.findIndex(
              recentPlayer => recentPlayer.ldap === player.ldap
            ) === -1
        );
      })
    );

    const dialogRef = this.dialog.open(PlayerSelectDialogComponent, {
      width: "250px",
      data: {
        header: "Select Players",
        players: unselected,
        multiselect: true
      } as PlayerDialogData
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(selected => {
        if (selected && selected.length > 0) {
          this.afs.doc(Path.table("default")).update({
            recentPlayers: firestore.FieldValue.arrayUnion(...selected)
          });
        }
      });
  }
}
