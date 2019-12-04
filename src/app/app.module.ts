import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AngularFireModule } from "@angular/fire";
import { FirestoreSettingsToken } from "@angular/fire/firestore";
import { AngularFireAuthGuardModule } from "@angular/fire/auth-guard";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { TimeagoModule } from "ngx-timeago";

import { AppRoutingModule } from "src/app/app-routing.module";
import { AppComponent } from "src/app/app.component";
import { environment } from "src/environments/environment";

import { LoginModule } from "./pages/login/login.module";
import { RecordModule } from "./pages/record/record.module";
import { HistoryModule } from "./pages/history/history.module";
import { ProfileModule } from "./pages/profile/profile.module";
import { PlayerSelectDialogComponent } from "./components/player-select-dialog/player-select-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ServiceWorkerModule } from "@angular/service-worker";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthGuardModule,
    LoginModule,
    RecordModule,
    MatIconModule,
    BrowserAnimationsModule,
    TimeagoModule.forRoot(),
    HistoryModule,
    ProfileModule,
    FontAwesomeModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production
    })
  ],
  providers: [
    {
      provide: FirestoreSettingsToken,
      useValue: environment.production
        ? undefined
        : {
            host: "localhost:8080",
            ssl: false
          }
    }
  ],
  entryComponents: [PlayerSelectDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
