import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { ReplaySubject, Subscription, Observable } from "rxjs";
import { Player } from "common/types";
import { Path } from "common/path";
import { map, take, skip } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class PlayersService implements OnDestroy {
  private players: ReplaySubject<Player[]> = new ReplaySubject(1);
  private names: ReplaySubject<{
    [ldap: string]: string;
  }> = new ReplaySubject(1);
  private subscriptions: Subscription[];

  constructor(afs: AngularFirestore) {
    const namesByLdap = {};
    this.subscriptions = [
      afs
        .collection<Player>(Path.playersCollection)
        .valueChanges()
        .subscribe(values => {
          this.players.next(values);
        }),
      afs
        .collection<Player>(Path.playersCollection)
        .stateChanges(["added", "removed"])
        .subscribe(actions => {
          const players = actions.map(action => {
            const { ldap, name } = action.payload.doc.data();
            if (action.type === "added") {
              namesByLdap[ldap] = name;
            } else {
              delete namesByLdap[ldap];
            }
          });
          this.names.next(Object.assign({}, namesByLdap));
        })
    ];
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get all(): Observable<Player[]> {
    return this.players;
  }

  get namesByLdap(): Observable<{ [ldap: string]: string }> {
    return this.names;
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
