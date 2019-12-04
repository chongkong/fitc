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
  public selected?: boolean;

  @Input()
  public selectable: boolean;

  @Output()
  onToggle = new EventEmitter<string>();

  levelClassNames() {
    return [`level-${this.player.level}`];
  }

  rootClassNames() {
    return {
      selected: this.selected !== undefined && this.selected,
      "not-selected": this.selected !== undefined && !this.selected
    };
  }

  toggle() {
    this.selected = !this.selected;
    this.onToggle.emit(this.player.ldap);
  }

  constructor() {}
}
