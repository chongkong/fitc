import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { FormsModule } from "@angular/forms";

import { MainComponent } from "./main.component";

@NgModule({
  declarations: [MainComponent],
  imports: [CommonModule, AngularFirestoreModule, FormsModule]
})
export class MainModule {}
