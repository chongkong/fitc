import { Component } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { flatMap } from "rxjs/operators";
import { Player } from "common/types";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent {
  // Observables from firestore.

  me: Observable<Player>;

  // Component bindings.

  myLdap: string = "";

  constructor(public afAuth: AngularFireAuth, public afs: AngularFirestore) {
    // Setup me
    this.me = afAuth.user.pipe(
      flatMap((user: firebase.User) => {
        const ldap = user.email.split("@")[0];
        this.myLdap = ldap;
        console.log(this.myLdap);
        return afs.doc<Player>(`players/${ldap}`).valueChanges();
      })
    );
  }
}
