import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { MatListModule } from "@angular/material/list";
import { TimeagoModule } from "ngx-timeago";

import { ProfileComponent } from "./profile.component";

@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    MatListModule,
    TimeagoModule
  ],
  providers: []
})
export class ProfileModule {}
