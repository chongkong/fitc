import { Component, Input, Output, EventEmitter } from "@angular/core";
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

  @Input()
  public selectable: boolean;

  @Output()
  onToggle = new EventEmitter<string>();

  private selected: boolean = false;

  classNames() {
    return [`level-${this.player.level}`];
  }

  toggle() {
    this.selected = !this.selected;
    this.onToggle.emit(this.player.ldap);
  }

  constructor() {}
}
