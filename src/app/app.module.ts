import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AngularFireModule } from "@angular/fire";
import { FirestoreSettingsToken } from "@angular/fire/firestore";
import { AngularFireAuthGuardModule } from "@angular/fire/auth-guard";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

import { AppRoutingModule } from "src/app/app-routing.module";
import { AppComponent } from "src/app/app.component";
import { environment } from "src/environments/environment";

import { LoginModule } from "./pages/login/login.module";
import { MainModule } from "./pages/main/main.module";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthGuardModule,
    LoginModule,
    MainModule,
    NoopAnimationsModule
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
