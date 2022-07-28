import { AfterContentChecked, Component, Input, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../interfaces/user.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatchesService } from '../../services/matches.service';
import { TeamsService } from '../../services/teams.service';
import {
  Validators,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';

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

  actualForm: FormGroup;

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
    rounds: this.fb.group({
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
    }),
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
              validators: [
                Validators.required,
                this.checkOverlapping(this.matchesService),
              ],
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
              validators: [
                Validators.required,
                this.checkOverlapping(this.matchesService),
              ],
            },
          ],
          teamId: [null],
        },
        { validators: Validators.required }
      ),
    }),
    rounds: this.fb.group({
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
    }),
  });

  constructor(
    private teamsService: TeamsService,
    private matchesService: MatchesService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.actualForm = this.showingTeams
      ? this.addTeamMatchForm
      : this.addMatchForm;
  }

  ngAfterContentChecked() {
    this.getWins('team1');
    this.getWins('team2');
  }

  public async saveMatch() {
    if (!this.showingTeams) {
      this.actualForm
        .get('players.team1.teamId')
        .setValue(
          this.teamsService.createTeamId([
            this.actualForm.get('players.team1.one').value,
            this.actualForm.get('players.team1.two').value,
          ])
        );

      this.actualForm
        .get('players.team2.teamId')
        .setValue(
          this.teamsService.createTeamId([
            this.actualForm.get('players.team2.one').value,
            this.actualForm.get('players.team2.two').value,
          ])
        );
    }

    this.matchesService.add(this.showingTeams, this.actualForm).then(() => {
      this.actualForm.reset();
      this.matchesService.resetForm$.next(this.showingTeams);
    });
  }

  private getWins(team: string) {
    this.checkRounds();

    let wins = 0;
    wins =
      this.actualForm.get('rounds.one.win').value === team ? wins + 1 : wins;
    wins =
      this.actualForm.get('rounds.two.win').value === team ? wins + 1 : wins;
    wins =
      this.actualForm.get('rounds.three.win').value === team ? wins + 1 : wins;

    if (team === 'team1') {
      this.winsTeam1.next(wins);
    } else if (team === 'team2') {
      this.winsTeam2.next(wins);
    }
  }

  private checkRounds(): boolean {
    const rounds = !(
      this.actualForm.get('rounds.one.win').value === null ||
      this.actualForm.get('rounds.two.win').value === null ||
      this.actualForm.get('rounds.one.win').value ===
        this.actualForm.get('rounds.two.win').value
    );

    if (!rounds) {
      this.actualForm.get('rounds.three.win').setValue(null);
      this.actualForm.get('rounds.three.dominationTeamOne').setValue(false);
      this.actualForm.get('rounds.three.dominationTeamTwo').setValue(false);
      this.actualForm.get('rounds.three.dominationTeamOne').enable();
      this.actualForm.get('rounds.three.dominationTeamTwo').enable();
    }

    return rounds;
  }

  checkOverlapping(matchesService: MatchesService): ValidatorFn {
    return (): ValidationErrors | null => {
      const res = matchesService.overlapPlayers();
      return res ? { overlapping: res } : null;
    };
  }
}
