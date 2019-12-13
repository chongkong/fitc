import { Injectable, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { ReplaySubject, Subscription, Observable, combineLatest } from "rxjs";

import { PlayerStats, PlayerState } from "common/types";
import { Path } from "common/path";
import { groupByLdap } from "common/utils";
import { map } from "rxjs/operators";
import {
  requiredWinsForPromo,
  requiredLossesForDemo
} from "common/level-update-policy";
import { PlayersService } from "./players.service";

export interface PromoCandidate {
  name: string;
  moreWins: number;
}

export interface DemoCandidate {
  name: string;
  moreLosses: number;
}

export type Candidate = PromoCandidate | DemoCandidate;

@Injectable({
  providedIn: "root"
})
export class PlayerStatsService implements OnDestroy {
  public readonly candidates: Observable<Candidate[]>;

  private playerStatsByLdap: ReplaySubject<{
    [ldap: string]: PlayerStats;
  }> = new ReplaySubject(1);
  private statesByLdap: ReplaySubject<{
    [ldap: string]: PlayerState;
  }> = new ReplaySubject(1);
  private subscriptions: Subscription[];

  constructor(afs: AngularFirestore, players: PlayersService) {
    this.subscriptions = [
      afs
        .collection<PlayerStats>(Path.playerStatsCollection)
        .snapshotChanges()
        .subscribe(snapshots => {
          const statsWithLdap = snapshots
            .map(snapshot => snapshot.payload.doc)
            .map(doc => Object.assign(doc.data(), { ldap: doc.id }));
          this.playerStatsByLdap.next(groupByLdap(statsWithLdap));
        }),
      afs
        .collection<PlayerState>(Path.playerStatesCollection)
        .snapshotChanges()
        .subscribe(snapshots => {
          const statesWithLdap = snapshots
            .map(snapshot => snapshot.payload.doc)
            .map(doc => Object.assign(doc.data(), { ldap: doc.id }));
          this.statesByLdap.next(groupByLdap(statesWithLdap));
        })
    ];

    this.candidates = combineLatest(players.byLdap(), this.statesByLdap).pipe(
      map(([playersByLdap, statesByLdap]) =>
        Object.keys(statesByLdap).reduce((candidates, ldap) => {
          const { level, name } = playersByLdap[ldap];
          const { recentGames } = statesByLdap[ldap];
          const moreWins = requiredWinsForPromo(recentGames, level);
          if (moreWins) candidates.push({ name, moreWins });
          const moreLosses = requiredLossesForDemo(recentGames, level);
          if (moreLosses) candidates.push({ name, moreLosses });
          return candidates;
        }, [])
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  get byLdap(): Observable<{ [ldap: string]: PlayerStats }> {
    return this.playerStatsByLdap;
  }
}
