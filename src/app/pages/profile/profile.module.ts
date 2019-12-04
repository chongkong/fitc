import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { MatListModule } from "@angular/material/list";
import { TimeagoModule } from "ngx-timeago";
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { ProfileComponent } from "./profile.component";
import { ComponentsModule } from "src/app/components/components.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogModule } from "@angular/material/dialog";

@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    MatListModule,
    MatDialogModule,
    TimeagoModule,
    NgxChartsModule,
    ComponentsModule,
    FontAwesomeModule
  ],
  providers: []
})
export class ProfileModule {}
