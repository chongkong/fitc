import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { BehaviorSubject, Subscription, Subject } from "rxjs";
import { Player, FoosballTable } from "common/types";
import { Path } from "common/path";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";

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
  private _allPlayers: BehaviorSubject<Player[]> = new BehaviorSubject([]);

  private subscriptions: Subscription[] = [];

  constructor(public afs: AngularFirestore) {
    // Set allPlayers
    this.subscriptions.push(
      afs
        .collection<Player>(Path.playersCollection)
        .valueChanges()
        .subscribe(values => {
          this._allPlayers.next(values);
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get allPlayers() {
    return this._allPlayers;
  }

  get allPlayersByLdap() {
    return this._allPlayers.pipe(
      map(players =>
        players.reduce(
          (dict, player) => Object.assign(dict, { [player.ldap]: player }),
          {}
        )
      )
    );
  }
}
