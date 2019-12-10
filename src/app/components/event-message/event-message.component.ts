import { Component, Input } from "@angular/core";

export interface EventView {
  type: "promotion" | "demotion";
  ldap: string;
  name: string;
  levelFrom: number;
  levelTo: number;
  createdAt: Date;
}

@Component({
  selector: "app-event-message",
  templateUrl: "./event-message.component.html",
  styleUrls: ["./event-message.component.scss"]
})
export class EventMessageComponent {
  @Input()
  data: EventView;

  @Input()
  shape: "fill" | "round" = "fill";

  @Input()
  showDate: boolean = false;

  getEventMessage({ type, name, levelFrom, levelTo }: EventView) {
    if (type === "promotion") {
      return `${name} got promoted: ${levelFrom} → ${levelTo}`;
    } else if (type === "demotion") {
      return `${name} got demoted: ${levelFrom} → ${levelTo}`;
    } else {
      return "Unknown GameEvent";
    }
  }
}
