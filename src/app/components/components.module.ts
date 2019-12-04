import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlayerChipComponent } from "./player-chip/player-chip.component";
import { GameRecordComponent } from "./game-record/game-record.component";
import { PlayerSelectDialogComponent } from "./player-select-dialog/player-select-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [
    PlayerChipComponent,
    GameRecordComponent,
    PlayerSelectDialogComponent
  ],
  imports: [CommonModule, FontAwesomeModule, MatDialogModule, MatButtonModule],
  exports: [
    PlayerChipComponent,
    GameRecordComponent,
    PlayerSelectDialogComponent
  ]
})
export class ComponentsModule {}
