import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs";
import { map, filter, last } from "rxjs/operators";
import {
  RECORD_URL_SEGMENT,
  HISTORY_URL_SEGMENT,
  PROFILE_URL_SEGMENT
} from "./services/url-constants";

interface TabItem {
  icon: string;
  urlSegment: string;
}

export const URL_SEGMENT_TO_TITLE: ReadonlyMap<string, string> = new Map<
  string,
  string
>([
  [RECORD_URL_SEGMENT, "Record"],
  [HISTORY_URL_SEGMENT, "Recents"],
  [PROFILE_URL_SEGMENT, "Profile"]
]);

const TAB_ITEMS: TabItem[] = [
  { icon: "history", urlSegment: HISTORY_URL_SEGMENT },
  { icon: "create", urlSegment: RECORD_URL_SEGMENT },
  { icon: "account_circle", urlSegment: PROFILE_URL_SEGMENT }
];

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  readonly RECORD_URL_SEGMENT = RECORD_URL_SEGMENT;
  readonly HISTORY_URL_SEGMENT = HISTORY_URL_SEGMENT;
  readonly PROFILE_URL_SEGMENT = PROFILE_URL_SEGMENT;
  readonly TAB_ITEMS = TAB_ITEMS;

  title: Observable<string>;

  constructor(private router: Router) {
    this.title = router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => {
        const lastUrlSegment = (event as NavigationEnd).urlAfterRedirects
          .split("/")
          .pop();
        return this.getTitle(lastUrlSegment);
      })
    );
  }

  getTitle(urlSegement: string): string {
    return URL_SEGMENT_TO_TITLE.get(urlSegement);
  }

  isActive(title: string, urlSegment: string): boolean {
    return title === URL_SEGMENT_TO_TITLE.get(urlSegment);
  }
}
