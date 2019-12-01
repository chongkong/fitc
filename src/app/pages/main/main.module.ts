import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatListModule } from "@angular/material/list";

import { MainComponent } from "./main.component";

@NgModule({
  declarations: [MainComponent],
  imports: [
    AngularFirestoreModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatListModule
  ]
})
export class MainModule {}
