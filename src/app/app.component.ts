import { Component, HostListener } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs";
import { map, filter } from "rxjs/operators";
import {
  RECORD_URL_SEGMENT,
  HISTORY_URL_SEGMENT,
  PROFILE_URL_SEGMENT
} from "./services/url-constants";
import {
  faHistory,
  faJoystick,
  faChartArea
} from "@fortawesome/pro-duotone-svg-icons";

interface TabItem {
  icon: any;
  urlSegment: string;
}

export const URL_SEGMENT_TO_TITLE: ReadonlyMap<string, string> = new Map<
  string,
  string
>([
  [RECORD_URL_SEGMENT, "New Game"],
  [HISTORY_URL_SEGMENT, "Recent Games"],
  [PROFILE_URL_SEGMENT, "Statistics"]
]);

// Long title might get overflowed on bottom nav
export const BOTTOM_NAV_TITLES: ReadonlyMap<string, string> = new Map([
  [RECORD_URL_SEGMENT, "New Game"],
  [HISTORY_URL_SEGMENT, "Recent"],
  [PROFILE_URL_SEGMENT, "Stats"]
]);

const TAB_ITEMS: TabItem[] = [
  { icon: faHistory, urlSegment: HISTORY_URL_SEGMENT },
  { icon: faJoystick, urlSegment: RECORD_URL_SEGMENT },
  { icon: faChartArea, urlSegment: PROFILE_URL_SEGMENT }
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

  showToolbar = false;

  constructor(router: Router) {
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

  @HostListener("scroll", ["$event"])
  onPageScroll(event) {
    this.showToolbar = event.target.scrollTop > 64;
  }

  getTitle(urlSegement: string): string {
    return URL_SEGMENT_TO_TITLE.get(urlSegement);
  }

  getBottomNavTitle(urlSegment: string) {
    return BOTTOM_NAV_TITLES.get(urlSegment);
  }

  isActive(title: string, urlSegment: string): boolean {
    return title === URL_SEGMENT_TO_TITLE.get(urlSegment);
  }
}
