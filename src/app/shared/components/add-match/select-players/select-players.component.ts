import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import { Observable, Subscription } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateTeamDialogComponent } from '../create-team-dialog/create-team-dialog.component';

@Component({
  selector: 'app-select-players',
  templateUrl: './select-players.component.html',
  styleUrls: ['./select-players.component.scss'],
})
export class SelectPlayersComponent implements OnInit, OnDestroy {
  @Input()
  players: Observable<IUser[]> | Observable<ITeam[]>;

  @Input()
  showingTeams = false;

  @Input()
  matchForm: FormGroup;

  teams: number[] = [0, 1];

  allPlayers: (IUser | ITeam)[] = [];

  playerLists: (IUser | ITeam)[][] = [[], [], [], []];

  selectedPlayers: string[] = ['', '', '', ''];

  touched: boolean[] = [false, false, false, false];

  actualSub: Subscription;

  usersSub: Subscription;

  resetFormSub: Subscription;

  actualOb: Observable<any>;

  allUserIds: string[] = [];

  dialogResult = [undefined, undefined];

  constructor(
    private usersService: UsersService,
    private matchesService: MatchesService,
    private teamsService: TeamsService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.showingTeams) {
      this.touched = [false, false];
      this.selectedPlayers = ['', ''];
      this.playerLists = [[], []];
      this.usersSub = this.usersService.users$.subscribe((users: IUser[]) => {
        this.allUserIds.length = 0;
        users.forEach((user) => {
          this.allUserIds.push(user.id);
        });
      });
      this.actualOb = this.teamsService.teams$;
    } else {
      this.actualOb = this.usersService.users$;
    }

    this.actualSub = this.actualOb.subscribe((data: (ITeam | IUser)[]) => {
      this.allPlayers = data;

      const allIds = this.matchesService.initProcess(
        this.showingTeams,
        this.matchForm,
        this.selectedPlayers,
        this.playerLists,
        this.allPlayers,
        this.touched,
        false
      );

      if (this.showingTeams) {
        const dialogResult = this.teamsService.getDialogResult();

        dialogResult.forEach((res, index) => {
          if (res) {
            if (allIds.includes(res.id)) {
              this.matchesService
                .getControl(index, this.showingTeams, this.matchForm, false)
                .setValue(res);
              this.updatePlayers(index);
              this.teamsService.setDialogResult(undefined, index);
            }
          }
        });
      }
    });

    this.resetFormSub = this.matchesService.resetForm$.subscribe(
      (teamsWasShowing) => {
        if (this.showingTeams && teamsWasShowing) {
          this.selectedPlayers = ['', ''];
          this.touched = [false, false];
          this.matchesService.selectedUsers = [[], []];
        } else if (!this.showingTeams && !teamsWasShowing) {
          this.selectedPlayers = ['', '', '', ''];
          this.touched = [false, false, false, false];
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.actualSub.unsubscribe();
    this.resetFormSub.unsubscribe();
    if (this.showingTeams) {
      this.usersSub.unsubscribe();
    }
  }

  updatePlayers(selId: number) {
    this.matchesService.updatePlayers(
      selId,
      this.showingTeams,
      this.matchForm,
      false,
      this.selectedPlayers,
      this.playerLists,
      this.allPlayers,
      this.allUserIds
    );
    if (this.showingTeams) {
      this.matchesService
        .getControl(0, this.showingTeams, this.matchForm, false)
        .updateValueAndValidity();
      this.matchesService
        .getControl(1, this.showingTeams, this.matchForm, false)
        .updateValueAndValidity();
    }
  }

  checkForError(id: number) {
    const actualControl =
      id === 0
        ? this.matchForm.get('players.team1.three')
        : this.matchForm.get('players.team2.three');
    return actualControl.hasError('overlapping');
  }

  getPlayersList(selId: number) {
    this.matchesService.addTouched(
      selId,
      this.showingTeams,
      this.matchForm,
      false,
      this.touched
    );
    return this.playerLists[selId];
  }

  openDialog(selId: number): void {
    this.dialog.open(CreateTeamDialogComponent, {
      data: selId,
    });
  }
}
