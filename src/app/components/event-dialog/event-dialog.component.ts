import { Component, Inject } from "@angular/core";
import { EventView } from "../event-message/event-message.component";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-event-dialog",
  templateUrl: "./event-dialog.component.html",
  styleUrls: ["./event-dialog.component.scss"]
})
export class EventDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public event: EventView
  ) {}

  getTitle() {
    if (this.event.type === "promotion") {
      return "🎉 Congratulation!";
    } else if (this.event.type === "demotion") {
      return "😱 I'm so sorry";
    }
  }

  getBody() {
    if (this.event.type === "promotion") {
      const { name, levelFrom, levelTo } = this.event;
      return `${name} is promoted from L${levelFrom} to L${levelTo}!`;
    } else if (this.event.type === "demotion") {
      const { name, levelFrom, levelTo } = this.event;
      return `${name} is demoted from L${levelFrom} to L${levelTo}`;
    }
  }
}
