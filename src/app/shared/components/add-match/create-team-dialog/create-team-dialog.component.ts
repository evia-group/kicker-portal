import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs/internal/Subscription';
import { IPlayers } from 'src/app/shared/interfaces/match.interface';
import { ITeam } from 'src/app/shared/interfaces/user.interface';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { InfoBarService } from 'src/app/shared/services/info-bar.service';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { ReplaySubject, Subject, take } from 'rxjs';
import { TextService } from '../../../services/text.service';

@Component({
  selector: 'app-create-team-dialog',
  templateUrl: './create-team-dialog.component.html',
  styleUrls: ['./create-team-dialog.component.scss'],
})
export class CreateTeamDialogComponent implements OnInit, OnDestroy {
  addTeamForm: FormGroup = this.fb.group({ validators: Validators.required });

  dataSubscription: Subscription;

  infoText = '';

  closeText = '';

  warnText = '';

  labelText = '';

  placeholderText = '';

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
      control1: FormControl;
      control2: FormControl;
      options1: any[];
      options2: any[];
      displayWithFunction: (option: any) => any;
    },
    private fb: FormBuilder,
    protected db: Firestore,
    protected infoBar: InfoBarService,
    private teamsService: TeamsService,
    private textService: TextService
  ) {}

  ngOnInit(): void {
    this.addTeamForm.addControl('one', this.data.control1);
    this.addTeamForm.addControl('two', this.data.control2);
    this.addTeamForm.reset();

    this.textService.textData$.pipe(take(1)).subscribe((res) => {
      this.labelText = res[2][1];
      this.placeholderText = res[10];
      this.infoText = res[11];
      this.closeText = res[12];
      this.warnText = res[13];
    });

    this.dataSubscription = this.data.dataSub.subscribe(
      (newData: [number, any]) => {
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

  async createTeam(teamId: string, teamName: string, teamPlayers: IPlayers[]) {
    this.teamExists = false;
    const docRef = doc(this.db, environment.prefix + `Teams/${teamId}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const team: ITeam = {
        name: teamName,
        players: [
          doc(this.db, environment.prefix + `Users/${teamPlayers[0].id}`),
          doc(this.db, environment.prefix + `Users/${teamPlayers[1].id}`),
        ],
        wins: 0,
        losses: 0,
        stats: {
          '0:2': 0,
          '2:0': 0,
          '1:2': 0,
          '2:1': 0,
        },
        dominations: 0,
        defeats: 0,
      };
      await setDoc(doc(this.db, environment.prefix + `Teams/${teamId}`), team)
        .then(() => {
          this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
        })
        .catch((err) => {
          this.infoBar.openComponentSnackBar(5);
          console.log('ERROR', err);
        });
    } else {
      this.infoBar.openCustomSnackBar(
        this.warnText,
        this.closeText,
        5,
        'alert-snackbar'
      );
      this.teamExists = true;
    }
  }
}
