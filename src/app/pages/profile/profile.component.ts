import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, ReplaySubject, Subject } from "rxjs";
import { flatMap } from "rxjs/operators";

import { Player, PlayerStats } from "common/types";
import { Path } from "common/path";
import { Arrays } from "common/utils";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {
  // Observables from firestore.

  ldap: Subject<string>;
  player: Observable<Player>;
  playerStats: Observable<PlayerStats>;

  colorScheme = {
    domain: ["#2C83C9"]
  };
  chartDataCache = {};

  constructor(public afAuth: AngularFireAuth, public afs: AngularFirestore) {
    this.ldap = new ReplaySubject<string>(1);
    this.player = this.ldap.pipe(
      flatMap(ldap => afs.doc<Player>(Path.player(ldap)).valueChanges())
    );
    this.playerStats = this.ldap.pipe(
      flatMap(ldap =>
        afs.doc<PlayerStats>(Path.playerStats(ldap)).valueChanges()
      )
    );
  }

  buildChartData({ totalWins, totalLoses, recentGames }: PlayerStats) {
    if (this.chartDataCache[recentGames]) {
      return this.chartDataCache[recentGames];
    }
    const totalGames = totalWins + totalLoses;
    const lastDelta = totalWins - totalLoses;
    const results = recentGames.split("");
    const recentWins = results.filter(result => result === "W").length;
    const recentLoses = results.filter(result => result === "L").length;
    const initDelta = lastDelta - (recentWins - recentLoses);
    let min = initDelta;
    let max = initDelta;
    const series = results.reverse().reduce((data, result) => {
      const prevData =
        data.length > 0
          ? data[data.length - 1]
          : { name: totalGames - results.length, value: initDelta };
      const delta = result === "W" ? 1 : result === "L" ? -1 : 0;
      data.push({
        name: prevData.name + 1,
        value: prevData.value + delta
      });
      min = Math.min(min, data[data.length - 1].value);
      max = Math.max(max, data[data.length - 1].value);
      return data;
    }, []);
    this.chartDataCache[recentGames] = [
      {
        name: "",
        series: series.map(({ name, value }) => ({
          name: name.toString(),
          value: value.toString()
        }))
      }
    ];
    return this.chartDataCache[recentGames];
  }

  ngOnInit() {
    this.ldap.next(this.afAuth.auth.currentUser.email.split("@")[0]);
  }
}
