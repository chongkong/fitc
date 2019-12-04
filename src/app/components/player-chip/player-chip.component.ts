import { Component, Input, Output, EventEmitter } from "@angular/core";
import { faTimesCircle } from "@fortawesome/pro-duotone-svg-icons";
import { Player } from "common/types";

@Component({
  selector: "app-player-chip",
  templateUrl: "./player-chip.component.html",
  styleUrls: ["./player-chip.component.scss"]
})
export class PlayerChipComponent {
  faTimesCircle = faTimesCircle;

  @Input()
  public player: Player;

  @Input()
  public selected?: boolean;

  @Input()
  public removable: boolean;

  @Output()
  remove: EventEmitter<void> = new EventEmitter();

  levelClassNames() {
    return [`level-${this.player.level}`];
  }

  rootClassNames() {
    return {
      selected: this.selected !== undefined && this.selected,
      "not-selected": this.selected !== undefined && !this.selected
    };
  }

  onRemove($event) {
    $event.stopPropagation();
    this.remove.emit();
  }

  constructor() {}
}
