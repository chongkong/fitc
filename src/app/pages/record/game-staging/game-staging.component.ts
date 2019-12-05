import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import {
  faCrown,
  faTombstone,
  faQuestion
} from "@fortawesome/pro-duotone-svg-icons";
import { Player } from "common/types";

export type PlayerName = "alpha" | "bravo" | "charlie" | "delta";
export type TeamColor = "blue" | "red";

@Component({
  selector: "app-game-staging",
  templateUrl: "./game-staging.component.html",
  styleUrls: ["./game-staging.component.scss"]
})
export class GameStagingComponent implements OnInit {
  faCrown = faCrown;
  faTombstone = faTombstone;
  faQuestion = faQuestion;

  @Input()
  alpha?: Player;

  @Input()
  bravo?: Player;

  @Input()
  charlie?: Player;

  @Input()
  delta?: Player;

  @Input()
  nextEmpty?: PlayerName;

  @Input()
  winningTeam?: TeamColor;

  @Output()
  remove: EventEmitter<PlayerName> = new EventEmitter();

  @Output()
  teamClick: EventEmitter<TeamColor> = new EventEmitter();

  public readonly teams = ["blue", "red"];
  public readonly displayNames = {
    alpha: "Blue Player 1",
    bravo: "Blue Player 2",
    charlie: "Red Player 1",
    delta: "Red Player 2"
  };

  displayName(name: PlayerName) {
    return this.displayNames[name];
  }

  players(team: TeamColor) {
    if (team === "blue") {
      return ["alpha", "bravo"];
    } else if (team === "red") {
      return ["charlie", "delta"];
    }
  }

  hasPlayer(name: PlayerName) {
    return Boolean(this[name]);
  }

  getPlayer(name: PlayerName): Player {
    return this[name];
  }

  playersReady() {
    return this.alpha && this.bravo && this.charlie && this.delta;
  }

  removePlayer(name: PlayerName, $event) {
    this.remove.emit(name);
    // Disable winning/losing at all
    if (this.winningTeam) {
      this.teamClick.emit(this.winningTeam);
    }
    $event.stopPropagation();
  }

  clickTeam(team: TeamColor) {
    if (this.playersReady()) {
      this.teamClick.emit(team);
    }
  }

  getTooltip() {
    if (!this.playersReady()) {
      return "Please select a player";
    } else if (!this.winningTeam) {
      return "Please select a winner";
    } else {
      return "Press Record!";
    }
  }

  constructor() {}

  ngOnInit() {}
}
