import { AfterContentChecked, Component, Input, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../interfaces/user.interface';
import { BehaviorSubject, combineLatestWith, Observable } from 'rxjs';
import { MatchesService } from '../../services/matches.service';
import { TeamsService } from '../../services/teams.service';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-match',
  templateUrl: './add-match.component.html',
  styleUrls: ['./add-match.component.scss'],
})
export class AddMatchComponent implements AfterContentChecked, OnInit {
  @Input()
  showingTeams = false;

  @Input()
  data: Observable<IUser[]> | Observable<ITeam[]>;

  winsTeam1 = new BehaviorSubject<number>(0);
  winsTeam2 = new BehaviorSubject<number>(0);

  currentForm: FormGroup;

  playersSaveButtonDisabled = false;
  teamsSaveButtonDisabled = false;

  public addMatchForm = this.fb.group({
    players: this.fb.group({
      team1: this.fb.group(
        {
          one: [null, { validators: Validators.required }],
          two: [null, { validators: Validators.required }],
          teamId: [null],
        },
        { validators: Validators.required }
      ),
      team2: this.fb.group(
        {
          one: [null, { validators: Validators.required }],
          two: [null, { validators: Validators.required }],
          teamId: [null],
        },
        { validators: Validators.required }
      ),
    }),
    rounds: this.createRoundsFormGroup(),
  });

  public addTeamMatchForm = this.fb.group({
    players: this.fb.group({
      team1: this.fb.group(
        {
          one: [null, { validators: Validators.required }],
          two: [null, { validators: Validators.required }],
          three: [
            null,
            {
              validators: [Validators.required],
            },
          ],
          teamId: [null],
        },
        { validators: Validators.required }
      ),
      team2: this.fb.group(
        {
          one: [null, { validators: Validators.required }],
          two: [null, { validators: Validators.required }],
          three: [
            null,
            {
              validators: [Validators.required],
            },
          ],
          teamId: [null],
        },
        { validators: Validators.required }
      ),
    }),
    rounds: this.createRoundsFormGroup(),
  });

  constructor(
    private teamsService: TeamsService,
    private matchesService: MatchesService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.currentForm = this.showingTeams
      ? this.addTeamMatchForm
      : this.addMatchForm;
    const roundThreeControl = this.currentForm.get('rounds.three.win');
    this.currentForm
      .get('rounds.one.win')
      .valueChanges.pipe(
        combineLatestWith(this.currentForm.get('rounds.two.win').valueChanges)
      )
      .subscribe(([roundOneWinningTeam, roundTwoWinningTeam]) => {
        if (
          roundOneWinningTeam &&
          roundTwoWinningTeam &&
          !roundThreeControl.value &&
          roundOneWinningTeam !== roundTwoWinningTeam
        ) {
          roundThreeControl.addValidators(Validators.required);
          roundThreeControl.setValue(null);
        } else if (
          roundOneWinningTeam &&
          roundTwoWinningTeam &&
          roundOneWinningTeam === roundTwoWinningTeam
        ) {
          roundThreeControl.removeValidators(Validators.required);
          roundThreeControl.setValue(null);
        }
      });
  }

  ngAfterContentChecked() {
    this.getWins('team1');
    this.getWins('team2');
  }

  createRoundsFormGroup() {
    return this.fb.group({
      one: this.fb.group({
        win: [null, { validators: Validators.required }],
        dominationTeamOne: [{ value: false, disabled: false }],
        dominationTeamTwo: [{ value: false, disabled: false }],
      }),
      two: this.fb.group({
        win: [null, { validators: Validators.required }],
        dominationTeamOne: [{ value: false, disabled: false }],
        dominationTeamTwo: [{ value: false, disabled: false }],
      }),
      three: this.fb.group({
        win: [null],
        dominationTeamOne: [{ value: false, disabled: false }],
        dominationTeamTwo: [{ value: false, disabled: false }],
      }),
    });
  }

  public async saveMatch() {
    if (
      (this.showingTeams && !this.teamsSaveButtonDisabled) ||
      (!this.showingTeams && !this.playersSaveButtonDisabled)
    ) {
      if (!this.showingTeams) {
        this.playersSaveButtonDisabled = true;
        this.currentForm.disable();
        this.currentForm
          .get('players.team1.teamId')
          .setValue(
            this.teamsService.createTeamId([
              this.currentForm.get('players.team1.one').value,
              this.currentForm.get('players.team1.two').value,
            ])
          );

        this.currentForm
          .get('players.team2.teamId')
          .setValue(
            this.teamsService.createTeamId([
              this.currentForm.get('players.team2.one').value,
              this.currentForm.get('players.team2.two').value,
            ])
          );
      } else {
        this.teamsSaveButtonDisabled = true;
      }

      this.matchesService.add(this.showingTeams, this.currentForm).then(() => {
        this.currentForm.reset();
        this.currentForm.enable();
        this.currentForm.get(`rounds.one.dominationTeamOne`).disable();
        this.currentForm.get(`rounds.one.dominationTeamTwo`).disable();
        this.currentForm.get(`rounds.two.dominationTeamOne`).disable();
        this.currentForm.get(`rounds.two.dominationTeamTwo`).disable();
        this.currentForm.get(`rounds.three.dominationTeamOne`).disable();
        this.currentForm.get(`rounds.three.dominationTeamTwo`).disable();
        this.showingTeams
          ? (this.teamsSaveButtonDisabled = false)
          : (this.playersSaveButtonDisabled = false);
      });
    }
  }

  private getWins(team: string) {
    this.checkRounds();

    let wins = 0;
    wins =
      this.currentForm.get('rounds.one.win').value === team ? wins + 1 : wins;
    wins =
      this.currentForm.get('rounds.two.win').value === team ? wins + 1 : wins;
    wins =
      this.currentForm.get('rounds.three.win').value === team ? wins + 1 : wins;

    if (team === 'team1') {
      this.winsTeam1.next(wins);
    } else if (team === 'team2') {
      this.winsTeam2.next(wins);
    }
  }

  private checkRounds(): boolean {
    const rounds = !(
      this.currentForm.get('rounds.one.win').value === null ||
      this.currentForm.get('rounds.two.win').value === null ||
      this.currentForm.get('rounds.one.win').value ===
        this.currentForm.get('rounds.two.win').value
    );

    if (!rounds) {
      this.currentForm.get('rounds.three.win').setValue(null);
      this.currentForm.get('rounds.three.dominationTeamOne').setValue(false);
      this.currentForm.get('rounds.three.dominationTeamTwo').setValue(false);
      this.currentForm.get('rounds.three.dominationTeamOne').enable();
      this.currentForm.get('rounds.three.dominationTeamTwo').enable();
    }

    return rounds;
  }
}
