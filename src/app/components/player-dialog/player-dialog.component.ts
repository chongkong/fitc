import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { Player } from "common/types";

export interface PlayerDialogData {
  players: Observable<Player[]>;
  multiselect: boolean;
  header: string;
}

@Component({
  selector: "app-player-dialog",
  templateUrl: "./player-dialog.component.html",
  styleUrls: ["./player-dialog.component.scss"]
})
export class PlayerDialogComponent implements OnInit {
  ldaps: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<PlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlayerDialogData
  ) {}

  ngOnInit() {
    // Occupy full width
    this.dialogRef.updateSize("100%");
  }

  isSelected(ldap: string) {
    return this.ldaps.includes(ldap);
  }

  select(ldap: string) {
    if (this.data.multiselect) {
      this.ldaps = this.ldaps.includes(ldap)
        ? this.ldaps.filter(l => l !== ldap)
        : this.ldaps.concat(ldap);
    } else {
      this.ldaps = [ldap];
    }
  }
}
