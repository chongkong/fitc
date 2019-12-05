import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { Player } from "common/types";
import { map } from "rxjs/operators";

export interface PlayerDialogData {
  players: Observable<Player[]>;
  multiselect: boolean;
  header: string;
}

@Component({
  selector: "app-player-select-dialog",
  templateUrl: "./player-select-dialog.component.html",
  styleUrls: ["./player-select-dialog.component.scss"]
})
export class PlayerSelectDialogComponent implements OnInit {
  ldaps: string[] = [];

  sortedPlayers: Observable<Player[]>;

  constructor(
    public dialogRef: MatDialogRef<PlayerSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlayerDialogData
  ) {
    this.sortedPlayers = this.data.players.pipe(
      map(players => players.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }

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
      this.dialogRef.close(ldap);
    }
  }
}
