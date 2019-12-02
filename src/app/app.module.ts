import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AngularFireModule } from "@angular/fire";
import { FirestoreSettingsToken } from "@angular/fire/firestore";
import { AngularFireAuthGuardModule } from "@angular/fire/auth-guard";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";

import { AppRoutingModule } from "src/app/app-routing.module";
import { AppComponent } from "src/app/app.component";
import { environment } from "src/environments/environment";

import { LoginModule } from "./pages/login/login.module";
import { RecordModule } from "./pages/record/record.module";
import { HistoryModule } from "./pages/history/history.module";
import { ProfileModule } from "./profile/profile.module";

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
    MatToolbarModule,
    BrowserAnimationsModule,
    HistoryModule,
    ProfileModule
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
  bootstrap: [AppComponent]
})
export class AppModule {}
