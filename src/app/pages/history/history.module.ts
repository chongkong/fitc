import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { HistoryComponent } from "./history.component";
import { ComponentsModule } from "src/app/components/components.module";

@NgModule({
  declarations: [HistoryComponent],
  imports: [CommonModule, MatListModule, FontAwesomeModule, ComponentsModule]
})
export class HistoryModule {}
