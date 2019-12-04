import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlayerChipComponent } from "./player-chip/player-chip.component";
import { GameRecordComponent } from "./game-record/game-record.component";
import { PlayerDialogComponent } from "./player-dialog/player-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [
    PlayerChipComponent,
    GameRecordComponent,
    PlayerDialogComponent
  ],
  imports: [CommonModule, FontAwesomeModule, MatDialogModule, MatButtonModule],
  exports: [PlayerChipComponent, GameRecordComponent, PlayerDialogComponent]
})
export class ComponentsModule {}