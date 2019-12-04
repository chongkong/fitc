import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DialogData } from "../../pages/record/record.component";

@Component({
  selector: "app-player-dialog",
  templateUrl: "./player-dialog.component.html",
  styleUrls: ["./player-dialog.component.scss"]
})
export class PlayerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
