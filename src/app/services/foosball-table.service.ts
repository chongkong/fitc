import { Injectable, OnDestroy } from "@angular/core";
import { Player, FoosballTable } from "common/types";
import { AngularFirestore } from "@angular/fire/firestore";
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  ReplaySubject
} from "rxjs";
import { Path } from "common/path";
import { PlayersService } from "./players.service";

@Injectable({
  providedIn: "root"
})
export class FoosballTableService implements OnDestroy {
  // Local only states
  public alpha?: Player;
  public bravo?: Player;
  public charlie?: Player;
  public delta?: Player;
  public winningTeam?: "blue" | "red";

  public readonly benchPlayers: ReplaySubject<Player[]> = new ReplaySubject(1);

  private subscriptions: Subscription[];

  constructor(afs: AngularFirestore, players: PlayersService) {
    this.subscriptions = [
      combineLatest(
        afs.doc<FoosballTable>(Path.table("default")).valueChanges(),
        players.byLdap()
      ).subscribe(([table, playersByLdap]) => {
        this.benchPlayers.next(
          table.bench
            .map(ldap => playersByLdap[ldap])
            .filter(player => Boolean(player))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
    ];
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
