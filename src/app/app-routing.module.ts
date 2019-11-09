import { NgModule } from '@angular/core';
import { canActivate } from '@angular/fire/auth-guard';
import { Routes, RouterModule } from '@angular/router';
import { User } from 'firebase';
import { map } from 'rxjs/operators';

import { MainComponent } from 'src/app/pages/main/main.component';
import { LoginComponent } from 'src/app/pages/login/login.component';

const loggedInWithCorpAccount = map((user: User | null) => {
  if (!user || !user.email || !user.email.endsWith('@google.com'))
    return ['login'];
  else
    return true;
});

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'main',
    component: MainComponent,
    ...canActivate(loggedInWithCorpAccount),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
