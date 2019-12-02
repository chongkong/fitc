import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";

import { HistoryComponent } from "./history.component";

@NgModule({
  declarations: [HistoryComponent],
  imports: [CommonModule, MatListModule]
})
export class HistoryModule {}
