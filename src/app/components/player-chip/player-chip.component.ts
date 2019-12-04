import { Component, Input } from "@angular/core";
import { Player } from "common/types";

@Component({
  selector: "app-player-chip",
  templateUrl: "./player-chip.component.html",
  styleUrls: ["./player-chip.component.scss"]
})
export class PlayerChipComponent {
  @Input()
  public player: Player;

  @Input()
  public reverse: boolean;

  classNames() {
    return [`level-${this.player.level}`];
  }

  constructor() {}
}
