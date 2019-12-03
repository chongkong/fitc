import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, ReplaySubject, Subject } from "rxjs";
import { flatMap } from "rxjs/operators";

import { Player, PlayerStats } from "common/types";
import { Path } from "common/path";

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

  // Services

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

  ngOnInit() {
    this.ldap.next(this.afAuth.auth.currentUser.email.split("@")[0]);
  }
}
