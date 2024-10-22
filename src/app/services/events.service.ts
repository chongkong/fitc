import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { ReplaySubject, Subscription, Observable } from "rxjs";
import { Path } from "common/path";
import { Event } from "common/types";
import { map } from "rxjs/operators";

const HISTORY_SIZE = 100;

@Injectable({
  providedIn: "root"
})
export class EventsService implements OnDestroy {
  private events: ReplaySubject<Event[]> = new ReplaySubject(1);
  private subscription: Subscription;

  constructor(afs: AngularFirestore) {
    this.subscription = afs
      .collection<Event>(Path.eventsCollection, ref =>
        ref.orderBy("createdAt", "desc").limit(HISTORY_SIZE)
      )
      .valueChanges()
      .subscribe(values => {
        this.events.next(values);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get recents(): Observable<Event[]> {
    return this.events;
  }

  last24h(): Observable<Event[]> {
    const threshold = new Date().getTime() - 86400 * 1000;
    return this.events.pipe(
      map(events =>
        events.filter(event => event.createdAt.toMillis() > threshold)
      )
    );
  }
}
