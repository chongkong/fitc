import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, combineLatest } from "rxjs";

import { GameRecord, Event, Player } from "common/types";
import { Path } from "common/path";
import { map } from "rxjs/operators";
import { GameRecordView } from "../../components/game-record/game-record.component";
import { EventsService } from "src/app/services/events.service";
import { RecordsService } from "src/app/services/records.service";

interface EventView {
  type: "promotion" | "demotion";
  ldap: string;
  name: string;
  levelFrom: number;
  levelTo: number;
  createdAt: Date;
}

const HISTORY_SIZE = 100;

const swapColor = (color: "red" | "blue") => (color === "red" ? "blue" : "red");

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"]
})
export class HistoryComponent {
  items: Observable<(GameRecordView | EventView)[]>;

  constructor(
    public afs: AngularFirestore,
    events: EventsService,
    records: RecordsService
  ) {
    const players = afs
      .collection<Player>(Path.playersCollection)
      .valueChanges()
      .pipe(
        map(players =>
          players.reduce(
            (dict, player) => Object.assign(dict, { [player.ldap]: player }),
            {} as { [ldap: string]: Player }
          )
        )
      );

    const recordViews = combineLatest(players, records.recents).pipe(
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

    const eventViews = combineLatest(players, events.recents).pipe(
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

    this.items = combineLatest(recordViews, eventViews).pipe(
      map(([recordViews, eventViews]) => {
        const sorted = []
          .concat(recordViews)
          .concat(eventViews)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, HISTORY_SIZE);
        const levelPatch = {};
        const patch = player =>
          levelPatch[player.ldap]
            ? { ...player, level: levelPatch[player.ldap] }
            : player;
        for (let item of sorted) {
          if (this.isEvent(item)) {
            levelPatch[item.ldap] = item.levelFrom;
          } else {
            const record = item as GameRecordView;
            record.blue = record.blue.map(patch);
            record.red = record.red.map(patch);
          }
        }
        return sorted;
      })
    );
  }

  getEventMessage({ type, name, levelFrom, levelTo }: EventView) {
    if (type === "promotion") {
      return `${name} got promoted: ${levelFrom} → ${levelTo}`;
    } else {
      return `${name} got demoted: ${levelFrom} → ${levelTo}`;
    }
  }

  isEvent(item: GameRecordView | EventView): boolean {
    return (item as EventView).levelFrom !== undefined;
  }

  isRecord(item: GameRecordView | EventView): boolean {
    return (item as GameRecordView).blue !== undefined;
  }
}
