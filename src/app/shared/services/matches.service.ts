import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  doc,
  collectionData,
  addDoc,
  deleteDoc,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable, Subject, Subscription } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { IMatch } from '../interfaces/match.interface';
import { InfoBarService } from './info-bar.service';
import { FormGroup } from '@angular/forms';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { environment } from '../../../environments/environment';
import { ITeam, IUser } from '../interfaces/user.interface';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  constructor(
    protected db: Firestore,
    protected userService: UsersService,
    protected teamService: TeamsService,
    protected infoBar: InfoBarService,
    protected translateService: TranslateService
  ) {
    this.collection = collection(
      db,
      `${environment.prefix}Matches`
    ) as CollectionReference<IMatch>;
    this.matches$ = collectionData(this.collection).pipe(shareReplay(1));
  }

  translateSub: Subscription;

  infoText = '';

  closeText = '';

  public matches$: Observable<any>;

  public resetForm$ = new Subject<boolean>();

  protected collection: CollectionReference;

  protected overlap = false;

  private _selectedUsers: string[][] = [[], []];

  public set selectedUsers(selectedUsers: string[][]) {
    this._selectedUsers = selectedUsers;
  }

  public get selectedUsers() {
    return this._selectedUsers;
  }

  getText() {
    this.translateSub = this.translateService.get('info').subscribe((res) => {
      this.infoText = res.saveMatch;
      this.closeText = res.close;
    });
    this.translateSub.unsubscribe();
  }

  private static getRoundInfos(
    team: string,
    form: FormGroup,
    type: 'win' | 'dominationTeamOne' | 'dominationTeamTwo'
  ): number {
    const rounds = [
      form.get(`rounds.one.${type}`).value,
      form.get(`rounds.two.${type}`).value,
      form.get(`rounds.three.${type}`).value,
    ];

    return rounds.filter((round) => {
      if (type === 'win') {
        return round === team;
      } else {
        return round;
      }
    }).length;
  }

  public async add(showingTeams: boolean, match: FormGroup): Promise<void> {
    const team1 = match.get('players.team1.teamId').value;
    const team2 = match.get('players.team2.teamId').value;

    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsTeam1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne'
    );
    const dominationsTeam2 = MatchesService.getRoundInfos(
      'team2',
      match,
      'dominationTeamTwo'
    );

    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];

    const teams = [
      doc(this.db, `${environment.prefix}Teams/${team1})}`),
      doc(this.db, `${environment.prefix}Teams/${team2})}`),
    ];

    let players = [];
    if (showingTeams) {
      players = [
        match.get('players.team1.one').value,
        match.get('players.team1.two').value,
        match.get('players.team2.one').value,
        match.get('players.team2.two').value,
      ];
    } else {
      players = [
        doc(
          this.db,
          `${environment.prefix}Users/${
            match.get('players.team1.one').value.id
          }`
        ),
        doc(
          this.db,
          `${environment.prefix}Users/${
            match.get('players.team1.two').value.id
          }`
        ),
        doc(
          this.db,
          `${environment.prefix}Users/${
            match.get('players.team2.one').value.id
          }`
        ),
        doc(
          this.db,
          `${environment.prefix}Users/${
            match.get('players.team2.two').value.id
          }`
        ),
      ];
    }
    const result = {
      [`${team1}`]: winTeam1,
      [`${team2}`]: winTeam2,
    };

    for (let i = 0; i < dominationsTeam1; i++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
    }

    for (let j = 0; j < dominationsTeam2; j++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
    }

    const resultMatch: IMatch = {
      defeats,
      dominations,
      players,
      result,
      teams,
      type: `${winTeam1}:${winTeam2}`,
    };

    return await addDoc(this.collection, resultMatch)
      .then(() => {
        this.getText();
        this.infoBar.openCustomSnackBar(this.infoText, 'close', 5);
      })
      .catch((err) => {
        this.infoBar.openComponentSnackBar(5);
        console.log('ERROR', err);
      });
  }

  async delete(matchId) {
    await deleteDoc(doc(this.db, this.collection.path, matchId));
  }

  initProcess(
    showingTeams: boolean,
    matchForm: FormGroup,
    selectedPlayers: string[],
    playerLists: (IUser | ITeam)[][],
    allPlayers: (IUser | ITeam)[],
    touched: boolean[],
    inDialog: boolean
  ) {
    const allIds: string[] = [];

    allPlayers.forEach((player) => {
      allIds.push(player.id);
    });

    selectedPlayers.forEach((pId, index) => {
      if (!allIds.includes(pId)) {
        this.resetControl(index, showingTeams, matchForm, inDialog);
      }
    });

    this.setPlayerLists(playerLists, selectedPlayers, allPlayers);

    this.teamService.getDialogResult().forEach((res, index) => {
      if (res) {
        touched[index] = true;
      }
    });

    touched.forEach((isTouched, index) => {
      if (isTouched) {
        this.markControlTouched(index, showingTeams, matchForm, inDialog);
      }
    });

    return allIds;
  }

  resetControl(
    index: number,
    showingTeams: boolean,
    matchForm: FormGroup,
    inDialog: boolean
  ) {
    this.getControl(index, showingTeams, matchForm, inDialog).reset();
  }

  getControl(
    index: number,
    showingTeams: boolean,
    matchForm: FormGroup,
    inDialog: boolean
  ) {
    if (inDialog) {
      if (index === 0) {
        return matchForm.get('team.one');
      } else if (index === 1) {
        return matchForm.get('team.two');
      }
    } else {
      if (showingTeams) {
        if (index === 0) {
          return matchForm.get('players.team1.three');
        } else if (index === 1) {
          return matchForm.get('players.team2.three');
        }
      } else {
        if (index === 0) {
          return matchForm.get('players.team1.one');
        } else if (index === 1) {
          return matchForm.get('players.team1.two');
        } else if (index === 2) {
          return matchForm.get('players.team2.one');
        } else if (index === 3) {
          return matchForm.get('players.team2.two');
        }
      }
    }
  }

  markControlTouched(
    index: number,
    showingTeams: boolean,
    matchForm: FormGroup,
    inDialog: boolean
  ) {
    this.getControl(index, showingTeams, matchForm, inDialog).markAsTouched();
  }

  addTouched(
    index: number,
    showingTeams: boolean,
    matchForm: FormGroup,
    inDialog: boolean,
    touched: boolean[]
  ) {
    touched[index] = this.getControl(
      index,
      showingTeams,
      matchForm,
      inDialog
    ).touched;
  }

  updatePlayers(
    selId: number,
    showingTeams: boolean,
    matchForm: FormGroup,
    inDialog: boolean,
    selectedPlayers: string[],
    playerLists: (IUser | ITeam)[][],
    allPlayers: (IUser | ITeam)[],
    allUserIds?: string[]
  ) {
    const selectData = this.getControl(
      selId,
      showingTeams,
      matchForm,
      inDialog
    );
    selectedPlayers[selId] = selectData.value.id;
    if (showingTeams) {
      const teamId: string = selectData.value.id;
      this.selectedUsers[selId].length = 0;
      allUserIds.forEach((userId) => {
        if (teamId.startsWith(userId) || teamId.endsWith(userId)) {
          this.selectedUsers[selId].push(userId);
        }
      });
      if (selId === 0) {
        matchForm
          .get('players.team1.one')
          .setValue(selectData.value.players[0]);
        matchForm
          .get('players.team1.two')
          .setValue(selectData.value.players[1]);
        matchForm.get('players.team1.teamId').setValue(selectData.value.id);
      } else {
        matchForm
          .get('players.team2.one')
          .setValue(selectData.value.players[0]);
        matchForm
          .get('players.team2.two')
          .setValue(selectData.value.players[1]);
        matchForm.get('players.team2.teamId').setValue(selectData.value.id);
      }
    }
    this.setPlayerLists(playerLists, selectedPlayers, allPlayers);
  }

  setPlayerLists(
    playerLists: (IUser | ITeam)[][],
    selectedPlayers: string[],
    allPlayers: (IUser | ITeam)[]
  ) {
    for (let i = 0; i < playerLists.length; i++) {
      playerLists[i] = this.createPlayersList(i, selectedPlayers, allPlayers);
    }
  }

  createPlayersList(
    selId: number,
    selectedPlayers: string[],
    allPlayers: (IUser | ITeam)[]
  ) {
    return allPlayers.filter((player) => {
      return (
        !selectedPlayers.includes(player.id) ||
        selectedPlayers.indexOf(player.id) === selId
      );
    });
  }

  overlapPlayers() {
    this.overlap = false;
    this.selectedUsers[0].forEach((playerId) => {
      if (this.selectedUsers[1].includes(playerId)) {
        this.overlap = true;
      }
    });
    if (this.overlap) {
      return true;
    } else {
      return false;
    }
  }

  compareValues(o1: any, o2: any) {
    return o1 && o2 && o1.id === o2.id;
  }
}
