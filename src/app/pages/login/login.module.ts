import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFireAuthModule } from "@angular/fire/auth";

import { LoginComponent } from "./login.component";

@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, AngularFireAuthModule]
})
export class LoginModule {}
