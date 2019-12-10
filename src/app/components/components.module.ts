import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { TimeagoModule } from "ngx-timeago";

import { PlayerChipComponent } from "./player-chip/player-chip.component";
import { GameRecordComponent } from "./game-record/game-record.component";
import { PlayerSelectDialogComponent } from "./player-select-dialog/player-select-dialog.component";
import { EventMessageComponent } from "./event-message/event-message.component";

@NgModule({
  declarations: [
    PlayerChipComponent,
    GameRecordComponent,
    PlayerSelectDialogComponent,
    EventMessageComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatDialogModule,
    MatButtonModule,
    TimeagoModule
  ],
  exports: [
    PlayerChipComponent,
    GameRecordComponent,
    PlayerSelectDialogComponent,
    EventMessageComponent
  ]
})
export class ComponentsModule {}
