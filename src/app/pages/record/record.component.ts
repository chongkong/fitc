import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { combineLatest, BehaviorSubject, Subscription, Observable } from "rxjs";
import { map, take, skip } from "rxjs/operators";
import { firestore } from "firebase/app";

import { Player, GameRecord, FoosballTable, Event } from "common/types";
import {
  PlayerSelectDialogComponent,
  PlayerDialogData
} from "src/app/components/player-select-dialog/player-select-dialog.component";
import { PlayersService } from "src/app/services/players.service";
import { Path } from "common/path";
import { EventsService } from "src/app/services/events.service";
import { EventView } from "src/app/components/event-message/event-message.component";
import { EventDialogComponent } from "src/app/components/event-dialog/event-dialog.component";
import { PlayerStatsService } from "src/app/services/player-stats.service";
import { FoosballTableService } from "src/app/services/foosball-table.service";

const distinct = <T>(value: T, index: number, arr: T[]) =>
  arr.indexOf(value) === index;

@Component({
  selector: "app-record",
  templateUrl: "./record.component.html",
  styleUrls: ["./record.component.scss"]
})
export class RecordComponent implements OnInit, OnDestroy {
  recentEvents: Observable<EventView[]>;
  subscriptions: Subscription[] = [];

  // Component bindings. (local state)

  myLdap: string = "";

  constructor(
    public playerStats: PlayerStatsService,
    public table: FoosballTableService,
    private afs: AngularFirestore,
    private dialog: MatDialog,
    private players: PlayersService,
    afAuth: AngularFireAuth,
    events: EventsService
  ) {
    if (afAuth.auth.currentUser) {
      this.myLdap = afAuth.auth.currentUser.email.split("@")[0];
    } else {
      this.myLdap = "";
    }

    this.recentEvents = combineLatest(
      players.namesByLdap,
      events.last24h()
    ).pipe(
      map(([namesByLdap, events]) =>
        events.map(
          event =>
            ({
              type: event.type,
              ldap: event.ldap,
              name: namesByLdap[event.ldap],
              levelFrom: event.levelFrom,
              levelTo: event.levelTo,
              createdAt: event.createdAt.toDate()
            } as EventView)
        )
      )
    );
  }

  ngOnInit() {
    this.subscriptions.push(
      // Open dialogs on Event creation
      combineLatest(
        this.players.namesByLdap,
        this.afs
          .collection<Event>(Path.eventsCollection)
          .stateChanges(["added"])
          .pipe(skip(1))
      ).subscribe(([namesByLdap, changeAction]) => {
        changeAction.forEach(action => {
          const event = action.payload.doc.data();
          const eventView = {
            type: event.type,
            ldap: event.ldap,
            name: namesByLdap[event.ldap],
            levelFrom: event.levelFrom,
            levelTo: event.levelTo,
            createdAt: event.createdAt.toDate()
          } as EventView;
          this.dialog.open(EventDialogComponent, { data: eventView });
        });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  inBench(ldap: string) {
    return this.table.benchPlayers.pipe(
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
    return [
      this.table.alpha,
      this.table.bravo,
      this.table.charlie,
      this.table.delta
    ];
  }

  get stagingPlayerLdaps() {
    return this.stagingPlayers
      .filter(player => Boolean(player))
      .map(player => player.ldap)
      .filter(distinct);
  }

  nextStagingSlot() {
    if (!this.table.alpha) return "alpha";
    if (!this.table.bravo) return "bravo";
    if (!this.table.charlie) return "charlie";
    if (!this.table.delta) return "delta";
  }

  inStaging(ldap: string) {
    return this.stagingPlayers.some(player => player && player.ldap === ldap);
  }

  selectForStaging(ldap: string) {
    const next = this.nextStagingSlot();
    if (next && !this.inStaging(ldap)) {
      this.players.getOnce(ldap).subscribe(player => {
        this.table[next] = player;
      });
    }
  }

  removeFromStaging(slot: "alpha" | "bravo" | "charlie" | "delta") {
    this.table[slot] = undefined;
    this.table.winningTeam = undefined; // Should disable team option as well.
  }

  slotForIndex(index: number) {
    return ["alpha", "bravo", "charlie", "delta"][index];
  }

  toggleStaging(ldap: string) {
    const index = this.stagingPlayers.findIndex(
      player => player && player.ldap === ldap
    );
    if (index >= 0) {
      this.table[this.slotForIndex(index)] = undefined;
    } else {
      this.selectForStaging(ldap);
    }
  }

  resetStaging() {
    if (this.table.winningTeam !== "blue") {
      this.table.alpha = undefined;
      this.table.bravo = undefined;
    }
    if (this.table.winningTeam !== "red") {
      this.table.charlie = undefined;
      this.table.delta = undefined;
    }
    this.table.winningTeam = undefined;
  }

  onSelectTeam(team: "blue" | "red") {
    if (this.table.winningTeam === team) {
      this.table.winningTeam = undefined;
    } else {
      this.table.winningTeam = team;
    }
  }

  openDialog() {
    const unselected = combineLatest(
      this.players.all,
      this.table.benchPlayers
    ).pipe(
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
      this.table.alpha &&
      this.table.bravo &&
      this.table.charlie &&
      this.table.delta &&
      this.table.winningTeam &&
      this.stagingPlayerLdaps.length === 4
    );
  }

  onSubmit() {
    if (this.readyToSubmit()) {
      const blueTeam = [this.table.alpha, this.table.bravo].map(
        player => player.ldap
      );
      const redTeam = [this.table.charlie, this.table.delta].map(
        player => player.ldap
      );
      this.recordGame(
        this.table.winningTeam === "blue" ? blueTeam : redTeam,
        this.table.winningTeam === "red" ? blueTeam : redTeam
      );
    }
  }
}
