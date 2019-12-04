import { Component, OnInit, Input } from "@angular/core";
import { Player } from "common/types";
import { faCrown, faTombstone } from "@fortawesome/pro-duotone-svg-icons";
import { Arrays } from "common/utils";

export interface GameRecordView {
  blue: Player[];
  red: Player[];
  winner: "blue" | "red";
  winStreaks: number;
  createdAt: Date;
}

@Component({
  selector: "app-game-record",
  templateUrl: "./game-record.component.html",
  styleUrls: ["./game-record.component.scss"]
})
export class GameRecordComponent implements OnInit {
  @Input()
  public data: GameRecordView;

  faCrown = faCrown;
  faTombstone = faTombstone;

  constructor() {}

  ngOnInit() {}

  range = (n: number) => Arrays.range(n);
}
