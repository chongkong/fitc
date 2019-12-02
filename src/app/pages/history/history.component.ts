import { Component } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable } from "rxjs";

import { Player, GameRecord, FoosballTable } from "common/types";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"]
})
export class HistoryComponent {
  // Observables from firestore.

  records: Observable<GameRecord[]>;

  // Document & collection reference from firestore.

  tableDoc: AngularFirestoreDocument<FoosballTable>;

  constructor(public afs: AngularFirestore) {
    // Setup recentPlayers
    this.tableDoc = afs.doc<FoosballTable>("tables/default");

    // Setup records
    this.records = this.tableDoc
      .collection<GameRecord>("records", ref =>
        ref.orderBy("createdAt", "desc").limit(50)
      )
      .valueChanges();
  }
}
