import { NgModule } from "@angular/core";
import { canActivate } from "@angular/fire/auth-guard";
import { Routes, RouterModule } from "@angular/router";
import { User } from "firebase";
import { map } from "rxjs/operators";

import {
  LOGIN_URL_SEGMENT,
  HISTORY_URL_SEGMENT,
  RECORD_URL_SEGMENT,
  PROFILE_URL_SEGMENT
} from "./services/url-constants";
import { HistoryComponent } from "src/app/pages/history/history.component";
import { LoginComponent } from "src/app/pages/login/login.component";
import { RecordComponent } from "src/app/pages/record/record.component";
import { ProfileComponent } from "./profile/profile.component";

const loggedInWithCorpAccount = map((user: User | null) => {
  if (!user || !user.email || !user.email.endsWith("@google.com"))
    return ["login"];
  else return true;
});

const routes: Routes = [
  { path: "", redirectTo: `/${RECORD_URL_SEGMENT}`, pathMatch: "full" },
  {
    path: `${LOGIN_URL_SEGMENT}`,
    component: LoginComponent
  },
  {
    path: `${RECORD_URL_SEGMENT}`,
    component: RecordComponent,
    ...canActivate(loggedInWithCorpAccount)
  },
  {
    path: `${HISTORY_URL_SEGMENT}`,
    component: HistoryComponent,
    ...canActivate(loggedInWithCorpAccount)
  },
  {
    path: `${PROFILE_URL_SEGMENT}`,
    component: ProfileComponent,
    ...canActivate(loggedInWithCorpAccount)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
