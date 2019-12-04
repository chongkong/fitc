import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DialogData } from "../../pages/record/record.component";

@Component({
  selector: "app-player-dialog",
  templateUrl: "./player-dialog.component.html",
  styleUrls: ["./player-dialog.component.scss"]
})
export class PlayerDialogComponent {
  selectedPlayerLdaps: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<PlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  // getSelectedPlayers(): Player[] {
  //   const selectedPlayers: Player[] = [];
  //   this.selectedPlayerLdaps.forEach(ldap => {
  //     selectedPlayers.push(this.playersByLdap[ldap]);
  //   });
  //   return selectedPlayers;
  // }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateSelectedPlayers(toggledPlayerLdap: string) {
    const index = this.selectedPlayerLdaps.findIndex(
      selectedPlayer => selectedPlayer === toggledPlayerLdap
    );
    index === -1
      ? this.selectedPlayerLdaps.push(toggledPlayerLdap)
      : this.selectedPlayerLdaps.splice(index, 1);
  }
}
