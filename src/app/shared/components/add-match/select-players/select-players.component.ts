import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import {
  forkJoin,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormControlStatus,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateTeamDialogComponent } from '../create-team-dialog/create-team-dialog.component';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { take } from 'rxjs/operators';

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

  allOptions: (IUser | ITeam)[] = [];

  allUserIds: string[] = [];

  team1player1Control = new FormControl();
  team1player2Control = new FormControl();
  team2player1Control = new FormControl();
  team2player2Control = new FormControl();

  team1Control = new FormControl();
  team2Control = new FormControl();

  createTeamPlayer1Control = new FormControl('', Validators.required);
  createTeamPlayer2Control = new FormControl('', Validators.required);

  team1HasError = false;
  team2HasError = false;
  team1ErrorText = 'info.chooseTeams';
  team2ErrorText = 'info.chooseTeams';

  placeholderText = 'common.placeholder';
  playerLabelText = 'common.player';
  teamLabelText = 'common.team';

  team1player1Options = [];
  team1player2Options = [];
  team2player1Options = [];
  team2player2Options = [];
  team1Options = [];
  team2Options = [];
  createTeamPlayer1Options: IUser[] = [];
  createTeamPlayer2Options: IUser[] = [];

  selectedOptions = [undefined, undefined, undefined, undefined];
  selectedTeamOptions = [undefined, undefined];
  selectedCreateTeamOptions = [undefined, undefined];

  subscriptionsList: Subscription[] = [];

  dialogDataSubject = new ReplaySubject(2);
  dialogResultSubject = new Subject();

  allUsers: IUser[] = [];

  constructor(
    private usersService: UsersService,
    private matchesService: MatchesService,
    private teamsService: TeamsService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.team1player1Control = this.matchForm.get(
      'players.team1.one'
    ) as FormControl;
    this.team1player2Control = this.matchForm.get(
      'players.team1.two'
    ) as FormControl;
    this.team2player1Control = this.matchForm.get(
      'players.team2.one'
    ) as FormControl;
    this.team2player2Control = this.matchForm.get(
      'players.team2.two'
    ) as FormControl;

    if (this.showingTeams) {
      this.team1Control = this.matchForm.get(
        'players.team1.three'
      ) as FormControl;
      this.team2Control = this.matchForm.get(
        'players.team2.three'
      ) as FormControl;
      forkJoin([
        this.usersService.users$.pipe(take(1)),
        this.teamsService.teams$.pipe(take(1)),
      ]).subscribe((data: [IUser[], ITeam[]]) => {
        this.allOptions = data[1];
        const users = data[0];
        this.allUsers = users;
        this.allUserIds.length = 0;
        users.forEach((user) => {
          this.allUserIds.push(user.id);
        });
        this.teamsProcess();
      });

      const dialogResultSub = this.dialogResultSubject.subscribe(
        (result: [{ id: string; name: string }, number]) => {
          const selId = result[1];
          const currentOptions =
            selId === 0 ? this.team1Options : this.team2Options;
          const currentControl =
            selId === 0 ? this.team1Control : this.team2Control;
          currentOptions.push(result[0]);
          this.sortOptions(currentOptions);
          currentControl.markAsTouched();
          currentControl.setValue(result[0]);
          this.setSelectedOptions(selId, result[0].id);
        }
      );
      this.subscriptionsList.push(dialogResultSub);
    } else {
      this.usersService.users$.subscribe((data: IUser[]) => {
        this.allOptions = data;
        this.playersProcess();
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptionsList.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  playersProcess() {
    this.team1player1Options = [...this.allOptions];
    this.sortOptions(this.team1player1Options);
    this.team1player2Options = [...this.allOptions];
    this.sortOptions(this.team1player2Options);
    this.team2player1Options = [...this.allOptions];
    this.sortOptions(this.team2player1Options);
    this.team2player2Options = [...this.allOptions];
    this.sortOptions(this.team2player2Options);

    this.team1player1Control.addValidators(this.autoSV(0));
    this.team1player2Control.addValidators(this.autoSV(1));
    this.team2player1Control.addValidators(this.autoSV(2));
    this.team2player2Control.addValidators(this.autoSV(3));

    const sub0 = this.team1player1Control.statusChanges.subscribe(
      (status: FormControlStatus) => {
        this.updateOptions(status, this.team1player1Control.value, 0);
      }
    );
    this.subscriptionsList.push(sub0);

    const sub1 = this.team1player2Control.statusChanges.subscribe((status) => {
      this.updateOptions(status, this.team1player2Control.value, 1);
    });
    this.subscriptionsList.push(sub1);

    const sub2 = this.team2player1Control.statusChanges.subscribe((status) => {
      this.updateOptions(status, this.team2player1Control.value, 2);
    });
    this.subscriptionsList.push(sub2);

    const sub3 = this.team2player2Control.statusChanges.subscribe((status) => {
      this.updateOptions(status, this.team2player2Control.value, 3);
    });
    this.subscriptionsList.push(sub3);
  }

  teamsProcess() {
    this.team1Options = [...this.allOptions];
    this.sortOptions(this.team1Options);
    this.team2Options = [...this.allOptions];
    this.sortOptions(this.team2Options);

    this.team1Control.addValidators([this.autoOverlapping(), this.autoSV(4)]);
    this.team2Control.addValidators([this.autoOverlapping(), this.autoSV(5)]);

    this.createTeamPlayer1Control.addValidators(this.autoSV(6));
    this.createTeamPlayer2Control.addValidators(this.autoSV(7));
    this.createTeamPlayer1Options = [...this.allUsers];
    this.sortOptions(this.createTeamPlayer1Options);
    this.createTeamPlayer2Options = [...this.allUsers];
    this.sortOptions(this.createTeamPlayer2Options);

    const sub4 = this.team1Control.statusChanges.subscribe((status) => {
      if (status === 'VALID') {
        this.team1player1Control.setValue({
          id: this.selectedOptions[0],
        });
        this.team1player2Control.setValue({
          id: this.selectedOptions[1],
        });
        this.matchForm
          .get('players.team1.teamId')
          .setValue(this.team1Control.value.id);
      }
    });
    this.subscriptionsList.push(sub4);

    const sub5 = this.team2Control.statusChanges.subscribe((status) => {
      if (status === 'VALID') {
        this.team2player1Control.setValue({
          id: this.selectedOptions[2],
        });
        this.team2player2Control.setValue({
          id: this.selectedOptions[3],
        });
        this.matchForm
          .get('players.team2.teamId')
          .setValue(this.team2Control.value.id);
      }
    });
    this.subscriptionsList.push(sub5);

    const sub6 = this.team1Control.valueChanges.subscribe(() => {
      this.updateTeamOptions(0, this.team1Control);
      this.team1HasError = this.team1Control.hasError('overlapping');
    });
    this.subscriptionsList.push(sub6);

    const sub7 = this.team2Control.valueChanges.subscribe(() => {
      this.updateTeamOptions(1, this.team2Control);
      this.team2HasError = this.team2Control.hasError('overlapping');
    });
    this.subscriptionsList.push(sub7);

    const sub8 = this.createTeamPlayer1Control.statusChanges.subscribe(
      (status: FormControlStatus) => {
        this.updateCreateTeamOptions(
          status,
          this.createTeamPlayer1Control.value,
          0
        );
        this.setDialogOptions(0, this.createTeamPlayer1Options);
        this.setDialogOptions(1, this.createTeamPlayer2Options);
      }
    );
    this.subscriptionsList.push(sub8);

    const sub9 = this.createTeamPlayer2Control.statusChanges.subscribe(
      (status: FormControlStatus) => {
        this.updateCreateTeamOptions(
          status,
          this.createTeamPlayer2Control.value,
          1
        );
        this.setDialogOptions(0, this.createTeamPlayer1Options);
        this.setDialogOptions(1, this.createTeamPlayer2Options);
      }
    );
    this.subscriptionsList.push(sub9);
  }

  displayWithFunction(option) {
    return option && option.name ? option.name : '';
  }

  setPlayersForTeams(selectedEvent: MatAutocompleteSelectedEvent, id: number) {
    const teamId: string = selectedEvent.option.value.id;
    this.setSelectedOptions(id, teamId);
  }

  setSelectedOptions(id: number, teamId: string) {
    const optionIndex1 = id === 0 ? 0 : 2;
    const optionIndex2 = id === 0 ? 1 : 3;
    this.selectedOptions[optionIndex1] = this.allUserIds.find((userId) =>
      teamId.startsWith(userId)
    );
    this.selectedOptions[optionIndex2] = this.allUserIds.find((userId) =>
      teamId.endsWith(userId)
    );
    this.updateTeamControls();
  }

  updateCreateTeamOptions(status: FormControlStatus, controlValue, id: number) {
    if (status === 'VALID') {
      this.selectedCreateTeamOptions[id] = controlValue;
      this.removeCreateTeamOption(this.selectedCreateTeamOptions[id], id);
    } else {
      if (this.selectedCreateTeamOptions[id]) {
        this.addCreateTeamOption(this.selectedCreateTeamOptions[id], id);
        this.selectedCreateTeamOptions[id] = undefined;
      }
    }
  }

  updateOptions(status: FormControlStatus, controlValue, id: number) {
    if (status === 'VALID') {
      this.selectedOptions[id] = controlValue;
      this.removeOption(this.selectedOptions[id], id);
    } else {
      if (this.selectedOptions[id]) {
        this.addOption(this.selectedOptions[id], id);
        this.selectedOptions[id] = undefined;
      }
    }
  }

  updateTeamOptions(id: number, control: FormControl) {
    if (!control.hasError('invalidAutocompleteString')) {
      this.selectedTeamOptions[id] = control.value;
      this.removeTeamOption(this.selectedTeamOptions[id], id);
    } else {
      if (this.selectedTeamOptions[id]) {
        this.addTeamOption(this.selectedTeamOptions[id], id);
        this.selectedTeamOptions[id] = undefined;
        const optionIndex1 = id === 0 ? 0 : 2;
        const optionIndex2 = id === 0 ? 1 : 3;
        this.selectedOptions[optionIndex1] = undefined;
        this.selectedOptions[optionIndex2] = undefined;
        this.updateTeamControls();
      }
    }
  }

  updateTeamControls() {
    this.team1Control.updateValueAndValidity();
    this.team2Control.updateValueAndValidity();
  }

  removeCreateTeamOption(optionToRemove, excluded: number) {
    if (excluded !== 0) {
      this.createTeamPlayer1Options = this.createTeamPlayer1Options.filter(
        (option) => option.id !== optionToRemove.id
      );
    } else {
      this.createTeamPlayer2Options = this.createTeamPlayer2Options.filter(
        (option) => option.id !== optionToRemove.id
      );
    }
  }

  removeTeamOption(optionToRemove, excluded: number) {
    if (excluded !== 0) {
      this.team1Options = this.team1Options.filter(
        (option) => option.id !== optionToRemove.id
      );
    } else {
      this.team2Options = this.team2Options.filter(
        (option) => option.id !== optionToRemove.id
      );
    }
  }
  removeOption(optionToRemove, excluded) {
    if (excluded !== 0) {
      this.team1player1Options = this.team1player1Options.filter((option) => {
        return option.id !== optionToRemove.id;
      });
    }
    if (excluded !== 1) {
      this.team1player2Options = this.team1player2Options.filter((option) => {
        return option.id !== optionToRemove.id;
      });
    }
    if (excluded !== 2) {
      this.team2player1Options = this.team2player1Options.filter((option) => {
        return option.id !== optionToRemove.id;
      });
    }
    if (excluded !== 3) {
      this.team2player2Options = this.team2player2Options.filter((option) => {
        return option.id !== optionToRemove.id;
      });
    }
  }

  addCreateTeamOption(optionToAdd, excluded) {
    if (excluded !== 0) {
      this.createTeamPlayer1Options.push(optionToAdd);
      this.createTeamPlayer1Options = [...this.createTeamPlayer1Options];
      this.sortOptions(this.createTeamPlayer1Options);
    } else {
      this.createTeamPlayer2Options.push(optionToAdd);
      this.createTeamPlayer2Options = [...this.createTeamPlayer2Options];
      this.sortOptions(this.createTeamPlayer2Options);
    }
  }

  addTeamOption(optionToAdd, excluded) {
    if (excluded !== 0) {
      this.team1Options.push(optionToAdd);
      this.team1Options = [...this.team1Options];
      this.sortOptions(this.team1Options);
    } else {
      this.team2Options.push(optionToAdd);
      this.team2Options = [...this.team2Options];
      this.sortOptions(this.team2Options);
    }
  }

  addOption(optionToAdd, excluded) {
    if (excluded !== 0) {
      this.team1player1Options.push(optionToAdd);
      this.team1player1Options = [...this.team1player1Options];
      this.sortOptions(this.team1player1Options);
    }
    if (excluded !== 1) {
      this.team1player2Options.push(optionToAdd);
      this.team1player2Options = [...this.team1player2Options];
      this.sortOptions(this.team1player2Options);
    }
    if (excluded !== 2) {
      this.team2player1Options.push(optionToAdd);
      this.team2player1Options = [...this.team2player1Options];
      this.sortOptions(this.team2player1Options);
    }
    if (excluded !== 3) {
      this.team2player2Options.push(optionToAdd);
      this.team2player2Options = [...this.team2player2Options];
      this.sortOptions(this.team2player2Options);
    }
  }

  sortOptions(options) {
    options.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  filterOptions(id: number) {
    return this.allOptions.filter((player) => {
      let keepOption = true;
      this.selectedOptions.forEach((option, index) => {
        if (option) {
          if (player.id === option.id && index !== id) keepOption = false;
        }
      });
      return keepOption;
    });
  }

  getValidOptions(autoId: number) {
    if (autoId === 0) {
      return this.team1player1Options;
    } else if (autoId === 1) {
      return this.team1player2Options;
    } else if (autoId === 2) {
      return this.team2player1Options;
    } else if (autoId === 3) {
      return this.team2player2Options;
    } else if (autoId === 4) {
      return this.team1Options;
    } else if (autoId === 5) {
      return this.team2Options;
    } else if (autoId === 6) {
      return this.createTeamPlayer1Options;
    } else {
      return this.createTeamPlayer2Options;
    }
  }

  autoSV(autoId: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const validOptions = this.getValidOptions(autoId);

      if (validOptions.indexOf(control.value) !== -1) {
        return null;
      }
      return { invalidAutocompleteString: { value: control.value } };
    };
  }

  autoOverlapping(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const user0 = this.selectedOptions[0];
      const user1 = this.selectedOptions[1];
      const user2 = this.selectedOptions[2];
      const user3 = this.selectedOptions[3];
      if (
        user0 &&
        user1 &&
        user2 &&
        user3 &&
        (user0 === user2 ||
          user0 === user3 ||
          user1 === user2 ||
          user1 === user3)
      ) {
        return { overlapping: { value: control.value } };
      }
      return null;
    };
  }

  openDialog(selId: number): void {
    this.dialog.open(CreateTeamDialogComponent, {
      data: {
        id: selId,
        dataSub: this.dialogDataSubject,
        resultSub: this.dialogResultSubject,
        control1: this.createTeamPlayer1Control,
        control2: this.createTeamPlayer2Control,
        options1: this.createTeamPlayer1Options,
        options2: this.createTeamPlayer2Options,
        displayWithFunction: this.displayWithFunction,
      },
      autoFocus: false,
    });
    this.setDialogOptions(0, this.createTeamPlayer1Options);
    this.setDialogOptions(1, this.createTeamPlayer2Options);
  }

  setDialogOptions(id: number, newData) {
    this.dialogDataSubject.next([id, newData]);
  }
}
