import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { ReplaySubject, Subscription, Observable } from "rxjs";
import { Path } from "common/path";
import { GameRecord } from "common/types";

const HISTORY_SIZE = 100;

@Injectable({
  providedIn: "root"
})
export class RecordsService implements OnDestroy {
  private records: ReplaySubject<GameRecord[]> = new ReplaySubject(1);
  private subscription: Subscription;

  constructor(afs: AngularFirestore) {
    this.subscription = afs
      .collection<GameRecord>(Path.gameRecordCollection("default"), ref =>
        ref.orderBy("createdAt", "desc").limit(HISTORY_SIZE)
      )
      .valueChanges()
      .subscribe(values => {
        this.records.next(values);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get recents(): Observable<GameRecord[]> {
    return this.records;
  }
}
