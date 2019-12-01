import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { auth } from "firebase/app";

import { PreviousRoutesService } from "../../services/previous-routes.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  constructor(
    public fireauth: AngularFireAuth,
    public router: Router,
    public previousRoutes: PreviousRoutesService
  ) {}

  ngOnInit() {
    const googleAuthProvider = new auth.GoogleAuthProvider();

    this.fireauth.user.subscribe(user => {
      if (!user) {
        this.fireauth.auth.signInWithPopup(googleAuthProvider);
      } else if (user && !user.email.endsWith("@google.com")) {
        alert("Please login with Corp (@google.com) account.");
        this.fireauth.auth
          .signOut()
          .then(() => this.fireauth.auth.signInWithPopup(googleAuthProvider));
      } else {
        let redirectUrl = this.previousRoutes.previousUrl;
        if (!redirectUrl || redirectUrl === "login") redirectUrl = "";
        this.router.navigate([redirectUrl]);
      }
    });
  }
}
