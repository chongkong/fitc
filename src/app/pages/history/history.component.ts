import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, combineLatest } from "rxjs";

import { GameRecord, Event, Player } from "common/types";
import { Path } from "common/path";
import { map } from "rxjs/operators";
import { GameRecordView } from "../../components/game-record/game-record.component";

interface EventView {
  type: "promotion" | "demotion";
  name: string;
  levelFrom: number;
  levelTo: number;
}

const swapColor = (color: "red" | "blue") => (color === "red" ? "blue" : "red");

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"]
})
export class HistoryComponent {
  // Observables from firestore.

  historyItems: Observable<(GameRecord | Event)[]>;
  items: Observable<(GameRecordView | EventView)[]>;

  recordViews: Observable<GameRecordView[]>;

  constructor(public afs: AngularFirestore) {
    const players = afs
      .collection<Player>(Path.playersCollection)
      .valueChanges()
      .pipe(
        map(players =>
          players.reduce(
            (dict, player) => Object.assign(dict, { [player.ldap]: player }),
            {}
          )
        )
      );

    const records = afs
      .collection<GameRecord>(Path.gameRecordCollection("default"), ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();

    const recordViews = combineLatest(players, records).pipe(
      map(([players, records]) => {
        let winner: "blue" | "red" = "blue";
        return records
          .reverse()
          .reduce((views: GameRecordView[], record) => {
            if (record.winColor) {
              winner = record.winColor;
            } else {
              winner = record.winStreaks > 1 ? winner : swapColor(winner);
            }
            const winners = record.winners.map(ldap => players[ldap]);
            const losers = record.losers.map(ldap => players[ldap]);
            views.push({
              blue: winner === "blue" ? winners : losers,
              red: winner === "red" ? winners : losers,
              winner,
              winStreaks: record.winStreaks,
              createdAt: record.createdAt.toDate()
            });
            return views;
          }, [])
          .reverse();
      })
    );
    this.recordViews = recordViews;

    const events = afs
      .collection<Event>(Path.eventsCollection, ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();

    const eventViews = combineLatest(players, events).pipe(
      map(([players, events]) =>
        events.map(
          event =>
            ({
              type: event.type,
              name: players[event.ldap],
              levelFrom: event.levelFrom,
              levelTo: event.levelTo
            } as EventView)
        )
      )
    );

    this.historyItems = combineLatest(records, events).pipe(
      map(([records, events]) =>
        []
          .concat(records)
          .concat(events)
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      )
    );

    this.items = combineLatest(recordViews, eventViews).pipe(
      map(([recordViews, eventViews]) =>
        []
          .concat(recordViews)
          .concat(eventViews)
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      )
    );
  }

  isEvent(historyItem: GameRecord | Event): boolean {
    return (historyItem as Event).levelFrom !== undefined;
  }
}
