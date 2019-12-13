import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { faFingerprint, faUsers } from "@fortawesome/pro-duotone-svg-icons";
import { Observable, ReplaySubject, Subject, combineLatest } from "rxjs";
import { flatMap, map, take } from "rxjs/operators";

import { Player, PlayerStats, RivalStats } from "common/types";
import { Path } from "common/path";
import { MatDialog } from "@angular/material/dialog";
import {
  PlayerSelectDialogComponent,
  PlayerDialogData
} from "src/app/components/player-select-dialog/player-select-dialog.component";
import { PlayersService } from "src/app/services/players.service";
import { PlayerStatsService } from "src/app/services/player-stats.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {
  faFingerprint = faFingerprint;
  faUsers = faUsers;

  ldap: Subject<string>;
  player: Observable<Player>;
  playerStats: Observable<PlayerStats>;
  playerRivalStats: Observable<(RivalStats & { rival: string })[]>;

  colorScheme = {
    domain: ["#4285f4"]
  };
  chartDataCache = {};

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public dialog: MatDialog,
    public ps: PlayersService,
    playerStats: PlayerStatsService
  ) {
    this.ldap = new ReplaySubject<string>(1);
    this.player = this.ldap.pipe(
      flatMap(ldap => afs.doc<Player>(Path.player(ldap)).valueChanges())
    );
    this.playerStats = combineLatest(this.ldap, playerStats.byLdap).pipe(
      map(([ldap, playerStatsByLdap]) => playerStatsByLdap[ldap])
    );
    this.playerRivalStats = this.ldap.pipe(
      flatMap(ldap =>
        afs
          .collection<RivalStats>(Path.rivalStatsCollection(ldap))
          .snapshotChanges()
      ),
      map(snapshots =>
        snapshots
          .map(snapshot => {
            const rival = snapshot.payload.doc.id;
            const rivalStats = snapshot.payload.doc.data();
            return Object.assign(rivalStats, { rival });
          })
          .sort((s1, s2) => s2.totalWins - s1.totalWins)
      )
    );
  }

  get myLdap() {
    if (this.afAuth.auth.currentUser) {
      return this.afAuth.auth.currentUser.email.split("@")[0];
    }
  }

  isFitcDeveloper(ldap: string) {
    return ["jjong", "shinjiwon", "hyeonjilee"].includes(ldap);
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

  winRate({ totalWins, totalLoses }: PlayerStats | RivalStats) {
    return Math.floor((totalWins / (totalWins + totalLoses)) * 1000) / 10;
  }

  ngOnInit() {
    this.goMyPage();
  }

  goMyPage() {
    this.ldap.next(this.myLdap);
  }

  openDialog() {
    const friendLdaps = combineLatest(this.ps.all, this.ldap).pipe(
      map(([players, except]) =>
        players.filter(player => player.ldap !== except)
      )
    );

    const dialogRef = this.dialog.open(PlayerSelectDialogComponent, {
      data: {
        header: "Choose Player",
        players: friendLdaps,
        multiselect: false
      } as PlayerDialogData
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(ldap => {
        if (ldap) {
          this.ldap.next(ldap);
        }
      });
  }
}
