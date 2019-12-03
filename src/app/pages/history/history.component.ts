import { Component } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, combineLatest } from "rxjs";

import { GameRecord, Event } from "common/types";
import { Path } from "common/path";
import { map } from "rxjs/operators";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"]
})
export class HistoryComponent {
  // Observables from firestore.

  historyItems: Observable<(GameRecord | Event)[]>;
  asEvent = (event: Event): Event => event;

  constructor(public afs: AngularFirestore) {
    // Get records observable
    const records = afs
      .collection<GameRecord>(Path.gameRecordCollection("default"), ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();

    // Get events observable
    const events = afs
      .collection<Event>(Path.eventsCollection, ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();

    this.historyItems = combineLatest(records, events).pipe(
      map(([records, events]) =>
        []
          .concat(records)
          .concat(events)
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      )
    );
  }

  isEvent(historyItem: GameRecord | Event): boolean {
    return (historyItem as Event).ldap !== undefined;
  }
}
