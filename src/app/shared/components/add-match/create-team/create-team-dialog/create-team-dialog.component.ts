import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersService } from 'src/app/shared/services/users.service';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-create-team-dialog',
  templateUrl: './create-team-dialog.component.html',
  styleUrls: ['./create-team-dialog.component.scss'],
})
export class CreateTeamDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<CreateTeamDialogComponent>,
    private userService: UsersService
  ) {}

  players;

  ngOnInit(): void {
    this.userService.users$.subscribe((data) => {
      this.players = data;
    });
    console.log('loaded');
  }

  selectPlayer(team: any, event: any) {
    console.log(team, event);
  }
}
