import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import { Observable, Subscription } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormControlStatus,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';

@Component({
  selector: 'app-select-players',
  templateUrl: './select-players.component.html',
  styleUrls: ['./select-players.component.scss'],
})
export class SelectPlayersComponent implements OnInit, OnDestroy {
  @Input()
  players: Observable<IUser[]> | Observable<ITeam[]>;

  @Input()
  matchForm: FormGroup;

  @Input()
  singleMode = false;

  teams: number[] = [0, 1];

  allOptions: (IUser | ITeam)[] = [];

  team1player1Control = new FormControl();
  team1player2Control = new FormControl();
  team2player1Control = new FormControl();
  team2player2Control = new FormControl();

  placeholderText = 'common.placeholder';
  playerLabelText = 'common.player';

  team1player1Options = [];
  team1player2Options = [];
  team2player1Options = [];
  team2player2Options = [];
  team1Options = [];
  team2Options = [];
  createTeamPlayer1Options: IUser[] = [];
  createTeamPlayer2Options: IUser[] = [];

  selectedOptions = [undefined, undefined, undefined, undefined];

  subscriptionsList: Subscription[] = [];

  constructor(private usersService: UsersService) {}

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

    this.usersService.users$.subscribe((data: IUser[]) => {
      this.allOptions = data;
      this.playersProcess();
    });
  }

  ngOnDestroy(): void {
    this.subscriptionsList.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  playersProcess() {
    if (!this.singleMode) {
      this.team1player2Options = [...this.allOptions];
      this.sortOptions(this.team1player2Options);
      this.team2player2Options = [...this.allOptions];
      this.sortOptions(this.team2player2Options);
    }
    this.team1player1Options = [...this.allOptions];
    this.sortOptions(this.team1player1Options);
    this.team2player1Options = [...this.allOptions];
    this.sortOptions(this.team2player1Options);

    if (!this.singleMode) {
      this.team1player2Control.addValidators(this.autoSV(1));
      this.team2player2Control.addValidators(this.autoSV(3));
    }

    this.team1player1Control.addValidators(this.autoSV(0));
    this.team2player1Control.addValidators(this.autoSV(2));

    if (!this.singleMode) {
      const sub1 = this.team1player2Control.statusChanges.subscribe(
        (status) => {
          this.updateOptions(status, this.team1player2Control.value, 1);
        }
      );
      this.subscriptionsList.push(sub1);

      const sub3 = this.team2player2Control.statusChanges.subscribe(
        (status) => {
          this.updateOptions(status, this.team2player2Control.value, 3);
        }
      );
      this.subscriptionsList.push(sub3);
    }

    const sub0 = this.team1player1Control.statusChanges.subscribe(
      (status: FormControlStatus) => {
        this.updateOptions(status, this.team1player1Control.value, 0);
      }
    );
    this.subscriptionsList.push(sub0);

    const sub2 = this.team2player1Control.statusChanges.subscribe((status) => {
      this.updateOptions(status, this.team2player1Control.value, 2);
    });
    this.subscriptionsList.push(sub2);
  }

  displayWithFunction(option) {
    return option && option.name ? option.name : '';
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
}
