import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { auth } from "firebase/app";

import { PreviousRoutesService } from "../../services/previous-routes.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit, OnDestroy {
  constructor(
    public fireauth: AngularFireAuth,
    public router: Router,
    public previousRoutes: PreviousRoutesService
  ) {}

  subscription: Subscription;

  ngOnInit() {
    const googleAuthProvider = new auth.GoogleAuthProvider();

    this.subscription = this.fireauth.user.subscribe(user => {
      if (!user) {
        this.fireauth.auth.signInWithRedirect(googleAuthProvider);
      } else if (user && !user.email.endsWith("@google.com")) {
        alert("Please login with Corp (@google.com) account.");
        this.fireauth.auth
          .signOut()
          .then(() =>
            this.fireauth.auth.signInWithRedirect(googleAuthProvider)
          );
      } else {
        this.router.navigate(["record"]);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
