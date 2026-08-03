import {
  Component,
  OnDestroy,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/operators';
import { IPlayers } from '../../../interfaces/match.interface';
import { IUser } from '../../../interfaces/user.interface';
import { InfoBarService } from '../../../services/info-bar.service';
import { TeamsService } from '../../../services/teams.service';
import { firstValueFrom, ReplaySubject, Subject } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { AutocompleteSelectionComponent } from '../../autocomplete-selection/autocomplete-selection.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-create-team-dialog',
  templateUrl: './create-team-dialog.component.html',
  styleUrls: ['./create-team-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CdkScrollable,
    MatDialogContent,
    AutocompleteSelectionComponent,
    MatDialogActions,
    MatButton,
    TranslatePipe,
  ],
})
export class CreateTeamDialogComponent implements OnInit, OnDestroy {
  addTeamForm: UntypedFormGroup = this.fb.group({
    validators: Validators.required,
  });

  dataSubscription: Subscription;

  infoText = '';

  closeText = '';

  warnText = '';

  labelText = 'common.player';

  placeholderText = 'common.placeholder';

  teamExists = false;

  players: number[] = [0, 1];

  options = [[], []];

  constructor(
    public dialogRef: MatDialogRef<CreateTeamDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id: number;
      dataSub: ReplaySubject<any>;
      resultSub: Subject<any>;
      control1: UntypedFormControl;
      control2: UntypedFormControl;
      options1: any[];
      options2: any[];
      displayWithFunction: (option: any) => any;
    },
    private fb: UntypedFormBuilder,
    protected infoBar: InfoBarService,
    private teamsService: TeamsService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.addTeamForm.addControl('one', this.data.control1);
    this.addTeamForm.addControl('two', this.data.control2);
    this.addTeamForm.reset();

    const translations = this.translateService.instant(['info', 'common']);

    this.infoText = translations.info.saveTeam;
    this.closeText = translations.info.close;
    this.warnText = translations.common.teamExists;

    this.dataSubscription = this.data.dataSub.subscribe(
      (newData: [number, IUser[]]) => {
        const id = newData[0];
        this.options[id] = newData[1];
      }
    );
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  async saveTeam() {
    const selP: IPlayers[] = [];
    selP.push(this.data.control1.value, this.data.control2.value);
    const teamId = this.teamsService.createTeamId(selP);
    const teamName = this.teamsService.createTeamName(selP);
    await this.createTeam(teamId, teamName, selP);
    if (!this.teamExists) {
      this.data.resultSub.next([{ id: teamId, name: teamName }, this.data.id]);
      this.closeDialog();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  /**
   * Teams have no independent identity in the new backend - they're implied
   * by the exact player pairing and get created lazily when a match with
   * this pairing is submitted (MatchesService.findOrCreateTeam). This just
   * checks whether the pairing already exists so the user gets the same
   * "team already exists" feedback as before; nothing is persisted here.
   */
  async createTeam(teamId: string, teamName: string, teamPlayers: IPlayers[]) {
    this.teamExists = false;
    const memberIds = teamPlayers.map((p) => p.id).sort();

    const teams = await firstValueFrom(this.teamsService.teams$.pipe(take(1)));
    const exists = teams.some((team) => {
      const teamMemberIds = team.players.map((p) => p.id).sort();
      return (
        teamMemberIds.length === memberIds.length &&
        teamMemberIds.every((id, i) => id === memberIds[i])
      );
    });

    if (exists) {
      this.infoBar.openCustomSnackBar(
        this.warnText,
        this.closeText,
        5,
        'alert-snackbar'
      );
      this.teamExists = true;
    } else {
      this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
    }
  }
}
