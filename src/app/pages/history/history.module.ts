import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { HistoryComponent } from "./history.component";
import { PlayerChipComponent } from "../../components/player-chip/player-chip.component";
import { GameRecordComponent } from "../../components/game-record/game-record.component";

@NgModule({
  declarations: [HistoryComponent, PlayerChipComponent, GameRecordComponent],
  imports: [CommonModule, MatListModule, FontAwesomeModule]
})
export class HistoryModule {}
