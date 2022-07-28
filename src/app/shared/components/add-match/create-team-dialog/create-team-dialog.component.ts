import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs/internal/Subscription';
import { IPlayers } from 'src/app/shared/interfaces/match.interface';
import { ITeam, IUser } from 'src/app/shared/interfaces/user.interface';
import { UsersService } from 'src/app/shared/services/users.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { InfoBarService } from 'src/app/shared/services/info-bar.service';
import { TranslateService } from '@ngx-translate/core';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-create-team-dialog',
  templateUrl: './create-team-dialog.component.html',
  styleUrls: ['./create-team-dialog.component.scss'],
})
export class CreateTeamDialogComponent implements OnInit, OnDestroy {
  addTeamForm: FormGroup = this.fb.group({
    team: this.fb.group(
      {
        one: [null, { validators: Validators.required }],
        two: [null, { validators: Validators.required }],
        teamId: [null],
      },
      { validators: Validators.required }
    ),
  });

  allPlayers: IUser[] = [];

  playerLists: IUser[][] = [[], []];

  selectedPlayers: string[] = ['', ''];

  touched: boolean[] = [false, false];

  usersSub: Subscription;

  translateSub: Subscription;

  infoText = '';

  closeText = '';

  warnText = '';

  teamExists = false;

  players: number[] = [0, 1];

  constructor(
    public dialogRef: MatDialogRef<CreateTeamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: number,
    private userService: UsersService,
    private fb: FormBuilder,
    protected db: Firestore,
    protected infoBar: InfoBarService,
    protected translateService: TranslateService,
    private teamsService: TeamsService,
    private matchesService: MatchesService
  ) {}

  ngOnInit(): void {
    this.usersSub = this.userService.users$.subscribe((data: IUser[]) => {
      this.allPlayers = data;
      this.matchesService.initProcess(
        false,
        this.addTeamForm,
        this.selectedPlayers,
        this.playerLists,
        this.allPlayers,
        this.touched,
        true
      );
    });
    this.translateSub = this.translateService
      .get(['info', 'common'])
      .subscribe((res) => {
        this.infoText = res.info.saveTeam;
        this.closeText = res.info.close;
        this.warnText = res.common.teamExists;
      });
  }

  ngOnDestroy(): void {
    this.usersSub.unsubscribe();
    this.translateSub.unsubscribe();
  }

  getPlayersList(selId: number) {
    this.matchesService.addTouched(
      selId,
      false,
      this.addTeamForm,
      true,
      this.touched
    );
    return this.playerLists[selId];
  }

  updatePlayers(playerId: number) {
    this.matchesService.updatePlayers(
      playerId,
      false,
      this.addTeamForm,
      true,
      this.selectedPlayers,
      this.playerLists,
      this.allPlayers
    );
  }

  async saveTeam() {
    const selP: IPlayers[] = [];
    this.selectedPlayers.forEach((id) => {
      this.allPlayers.forEach((player) => {
        if (id === player.id) {
          selP.push(player);
        }
      });
    });
    const teamId = this.teamsService.createTeamId(selP);
    await this.createTeam(teamId, selP);
    if (!this.teamExists) {
      this.closeDialog();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  async createTeam(teamId: string, teamPlayers: IPlayers[]) {
    this.teamExists = false;
    const docRef = doc(this.db, environment.prefix + `Teams/${teamId}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const team: ITeam = {
        name: this.teamsService.createTeamName(teamPlayers),
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
      const result = { id: teamId, name: team.name, players: team.players };
      this.teamsService.setDialogResult(result, this.data);
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
