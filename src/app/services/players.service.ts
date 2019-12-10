import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { ReplaySubject, Subscription, Observable } from "rxjs";
import { Player } from "common/types";
import { Path } from "common/path";
import { map, take } from "rxjs/operators";

function groupByLdap(players: Player[]) {
  return players.reduce((dict, player) => {
    dict[player.ldap] = player;
    return dict;
  }, {});
}

@Injectable({
  providedIn: "root"
})
export class PlayersService implements OnDestroy {
  private players: ReplaySubject<Player[]> = new ReplaySubject(1);

  private subscription: Subscription;

  constructor(public afs: AngularFirestore) {
    this.subscription = afs
      .collection<Player>(Path.playersCollection)
      .valueChanges()
      .subscribe(values => {
        this.players.next(values);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get all(): Observable<Player[]> {
    return this.players;
  }

  once(): Observable<Player[]> {
    return this.players.pipe(take(1));
  }

  getOnce(ldap: string): Observable<Player | undefined> {
    return this.players.pipe(
      take(1),
      map(players => players.find(player => player.ldap === ldap))
    );
  }

  byLdap(): Observable<{ [ldap: string]: Player }> {
    return this.players.pipe(
      map(players =>
        players.reduce(
          (dict, player) => Object.assign(dict, { [player.ldap]: player }),
          {}
        )
      )
    );
  }
}
