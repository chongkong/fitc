import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { combineLatest, BehaviorSubject, Subscription, Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { firestore } from "firebase";

import { Player, GameRecord, FoosballTable } from "common/types";
import {
  PlayerSelectDialogComponent,
  PlayerDialogData
} from "src/app/components/player-select-dialog/player-select-dialog.component";
import { PlayersService } from "src/app/services/players.service";
import { Path } from "common/path";
import { EventsService } from "src/app/services/events.service";
import { EventView } from "src/app/components/event-message/event-message.component";

const distinct = <T>(value: T, index: number, arr: T[]) =>
  arr.indexOf(value) === index;

@Component({
  selector: "app-record",
  templateUrl: "./record.component.html",
  styleUrls: ["./record.component.scss"]
})
export class RecordComponent implements OnInit, OnDestroy {
  recentEvents: Observable<EventView[]>;
  benchPlayers: BehaviorSubject<Player[]>;
  subscriptions: Subscription[] = [];

  // Component bindings. (local state)

  myLdap: string = "";
  alpha?: Player;
  bravo?: Player;
  charlie?: Player;
  delta?: Player;
  winningTeam?: "blue" | "red";

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private players: PlayersService,
    private events: EventsService,
    private dialog: MatDialog
  ) {
    if (afAuth.auth.currentUser) {
      this.myLdap = afAuth.auth.currentUser.email.split("@")[0];
    } else {
      this.myLdap = "";
    }

    this.recentEvents = combineLatest(players.byLdap(), events.last24h()).pipe(
      map(([players, events]) =>
        events.map(
          event =>
            ({
              type: event.type,
              ldap: event.ldap,
              name: players[event.ldap].name,
              levelFrom: event.levelFrom,
              levelTo: event.levelTo,
              createdAt: event.createdAt.toDate()
            } as EventView)
        )
      )
    );

    this.benchPlayers = new BehaviorSubject<Player[]>([]);
  }

  ngOnInit() {
    this.subscriptions.push(
      combineLatest(
        this.players.byLdap(),
        this.afs.doc<FoosballTable>(Path.table("default")).valueChanges()
      ).subscribe(([playersByLdap, table]) => {
        if (table.bench) {
          this.benchPlayers.next(
            table.bench
              .map(ldap => playersByLdap[ldap])
              .filter(player => Boolean(player))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  inBench(ldap: string) {
    return this.benchPlayers.pipe(
      map(players => players.some(player => player.ldap === ldap))
    );
  }

  removeFromBench(ldap: string) {
    this.afs.doc(Path.table("default")).update({
      bench: firestore.FieldValue.arrayRemove(ldap)
    });
  }

  addToBench(ldap: string) {
    this.afs.doc(Path.table("default")).update({
      bench: firestore.FieldValue.arrayUnion(ldap)
    });
  }

  recordGame(winners: string[], losers: string[]) {
    // You must have chosen proper winners and losers before recording.
    if (winners.length !== 2 || losers.length !== 2) {
      return;
    }
    const now = firestore.Timestamp.now();
    const record: GameRecord = {
      winners: winners,
      losers: losers,
      isDraw: false, // Ignore draw game
      winStreaks: 0, // Placeholder value that will be resolved from backend
      createdAt: now,
      recordedBy: this.myLdap
    };
    this.afs
      .doc<GameRecord>(Path.gameRecord("default", now))
      .set(record)
      .then(() => this.resetStaging());
  }

  get stagingPlayers() {
    return [this.alpha, this.bravo, this.charlie, this.delta];
  }

  get stagingPlayerLdaps() {
    return this.stagingPlayers
      .filter(player => Boolean(player))
      .map(player => player.ldap)
      .filter(distinct);
  }

  nextStagingSlot() {
    if (!this.alpha) return "alpha";
    if (!this.bravo) return "bravo";
    if (!this.charlie) return "charlie";
    if (!this.delta) return "delta";
  }

  inStaging(ldap: string) {
    return this.stagingPlayers.some(player => player && player.ldap === ldap);
  }

  selectForStaging(ldap: string) {
    const next = this.nextStagingSlot();
    if (next && !this.inStaging(ldap)) {
      this.players.getOnce(ldap).subscribe(player => {
        this[next] = player;
      });
    }
  }

  removeFromStaging(slot: "alpha" | "bravo" | "charlie" | "delta") {
    this[slot] = undefined;
    this.winningTeam = undefined; // Should disable team option as well.
  }

  slotForIndex(index: number) {
    return ["alpha", "bravo", "charlie", "delta"][index];
  }

  toggleStaging(ldap: string) {
    const index = this.stagingPlayers.findIndex(
      player => player && player.ldap === ldap
    );
    if (index >= 0) {
      this[this.slotForIndex(index)] = undefined;
    } else {
      this.selectForStaging(ldap);
    }
  }

  resetStaging() {
    if (this.winningTeam !== "blue") {
      this.alpha = undefined;
      this.bravo = undefined;
    }
    if (this.winningTeam !== "red") {
      this.charlie = undefined;
      this.delta = undefined;
    }
    this.winningTeam = undefined;
  }

  onSelectTeam(team: "blue" | "red") {
    if (this.winningTeam === team) {
      this.winningTeam = undefined;
    } else {
      this.winningTeam = team;
    }
  }

  openDialog() {
    const unselected = combineLatest(this.players.all, this.benchPlayers).pipe(
      map(([allPlayers, benchPlayers]) => {
        const benchLdaps = new Set(benchPlayers.map(player => player.ldap));
        return allPlayers.filter(player => !benchLdaps.has(player.ldap));
      })
    );

    const dialogRef = this.dialog.open(PlayerSelectDialogComponent, {
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
            bench: firestore.FieldValue.arrayUnion(...selected)
          });
        }
      });
  }

  readyToSubmit() {
    return (
      this.alpha &&
      this.bravo &&
      this.charlie &&
      this.delta &&
      this.winningTeam &&
      this.stagingPlayerLdaps.length === 4
    );
  }

  onSubmit() {
    if (this.readyToSubmit()) {
      const blueTeam = [this.alpha, this.bravo].map(player => player.ldap);
      const redTeam = [this.charlie, this.delta].map(player => player.ldap);
      this.recordGame(
        this.winningTeam === "blue" ? blueTeam : redTeam,
        this.winningTeam === "red" ? blueTeam : redTeam
      );
    }
  }
}
