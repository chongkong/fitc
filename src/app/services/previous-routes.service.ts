import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PreviousRoutesService {
  private _previousUrl?: string;
  
  constructor(public router: Router) { 
    this.router.events
        .pipe(filter(event => event instanceof RoutesRecognized))
        .pipe(pairwise())
        .subscribe(([r1, r2]: [RoutesRecognized, RoutesRecognized]) => {
          this._previousUrl = r1.urlAfterRedirects;
        });
  }

  get previousUrl() {
    return this._previousUrl;
  }
}
