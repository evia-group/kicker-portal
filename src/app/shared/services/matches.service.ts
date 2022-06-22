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
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { IMatch } from '../interfaces/match.interface';
import { InfoBarService } from './info-bar.service';
import { FormGroup } from '@angular/forms';
import { ITeamIncrement, IUserIncrement } from '../interfaces/user.interface';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  constructor(
    protected db: Firestore,
    protected userService: UsersService,
    protected teamService: TeamsService,
    protected infoBar: InfoBarService,
  ) {
    this.collection = collection(
      db,
      `${environment.prefix}Matches`,
    ) as CollectionReference<IMatch>;
    this.matches$ = collectionData(this.collection).pipe(shareReplay(1));
  }

  public matches$: Observable<any>;

  protected collection: CollectionReference;

  private static getRoundInfos(
    team: string,
    form: FormGroup,
    type: 'win' | 'dominationTeamOne' | 'dominationTeamTwo',
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

  public async add(match: FormGroup): Promise<void> {
    const team1 = match.get('players.team1.teamId').value;
    const team2 = match.get('players.team2.teamId').value;

    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsTeam1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne',
    );
    const dominationsTeam2 = MatchesService.getRoundInfos(
      'team2',
      match,
      'dominationTeamTwo',
    );

    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];

    const teams = [
      doc(this.db, `Teams/${team1})}`),
      doc(this.db, `Teams/${team2})}`),
    ];

    const players = [
      doc(this.db, `Teams/${match.get('players.team1.one').value.id}`),
      doc(this.db, `Teams/${match.get('players.team1.two').value.id}`),
      doc(this.db, `Teams/${match.get('players.team2.one').value.id}`),
      doc(this.db, `Teams/${match.get('players.team2.two').value.id}`),
    ];

    const result = {
      [`${team1}`]: winTeam1,
      [`${team2}`]: winTeam2,
    };

    for (let i = 0; i < dominationsTeam1; i++) {
      dominations.push(doc(this.db, `Teams/${team1}`));
      defeats.push(doc(this.db, `Teams/${team2}`));
    }

    for (let j = 0; j < dominationsTeam2; j++) {
      dominations.push(doc(this.db, `Teams/${team2}`));
      defeats.push(doc(this.db, `Teams/${team1}`));
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
      .then(() => this.updateTeamAndUserStats(match))
      .then(() => {
        this.infoBar.openCustomSnackBar(
          'Dein Spiel wurde erfolgreich gespeichert!',
          'close',
          5,
        );
      })
      .catch((err) => {
        this.infoBar.openComponentSnackBar(5);
        console.log('ERROR', err);
      });
  }

  updateTeamAndUserStats(match: FormGroup) {
    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');
    const dominationsTeam1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne',
    );
    const dominationsTeam2 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamTwo',
    );
    const userIdTeam1One = match.get('players.team1.one').value.id;
    const userIdTeam1Two = match.get('players.team1.two').value.id;
    const userIdTeam2One = match.get('players.team2.one').value.id;
    const userIdTeam2Two = match.get('players.team2.two').value.id;
    const type = `${winTeam1}:${winTeam2}`;
    const userUpdateStats: IUserIncrement[] = [];

    userUpdateStats.push(
      this.generatUserUpdateObject(
        userIdTeam1One,
        dominationsTeam2,
        dominationsTeam1,
        winTeam1,
        type,
      ),
      this.generatUserUpdateObject(
        userIdTeam2One,
        dominationsTeam1,
        dominationsTeam2,
        winTeam2,
        type,
      ),
    );

    if (userIdTeam1One !== userIdTeam1Two) {
      userUpdateStats.push(
        this.generatUserUpdateObject(
          userIdTeam1Two,
          dominationsTeam2,
          dominationsTeam1,
          winTeam1,
          type,
        ),
      );
    }
    if (userIdTeam2One !== userIdTeam2Two) {
      userUpdateStats.push(
        this.generatUserUpdateObject(
          userIdTeam2Two,
          dominationsTeam1,
          dominationsTeam2,
          winTeam2,
          type,
        ),
      );
    }

    // Teams
    const teamUpdateStats: ITeamIncrement[] = [
      this.generatTeamUpdateObject(
        match.get('players.team1.teamId').value,
        dominationsTeam2,
        dominationsTeam1,
        winTeam1,
        type,
      ),
      this.generatTeamUpdateObject(
        match.get('players.team2.teamId').value,
        dominationsTeam1,
        dominationsTeam2,
        winTeam2,
        type,
      ),
    ];

    try {
      this.updateUserStats(userUpdateStats);
      this.updateTeam(teamUpdateStats);
    } catch (error) {
      console.log('error', error);
    }
  }

  updateUserStats(userIncrement: IUserIncrement[]) {
    userIncrement.forEach((user) => {
      this.userService.incrementUserStates(
        user.userId,
        user.win,
        user.loss,
        user.defeat,
        user.domination,
        user.statsType,
      );
    });
  }

  updateTeam(teamIncrement: ITeamIncrement[]) {
    teamIncrement.forEach((team) => {
      this.teamService.incrementTeamStates(
        team.teamId,
        team.win,
        team.loss,
        team.defeat,
        team.domination,
        team.statsType,
      );
    });
  }

  private changeType(type: string, teamWin: boolean): string {
    if (
      (teamWin && (type === '2:0' || type === '2:1')) ||
      (!teamWin && (type === '0:2' || type === '1:2'))
    ) {
      return type;
    }
    if (teamWin && type === '0:2') {
      return '2:0';
    }
    if (teamWin && type === '1:2') {
      return '2:1';
    }
    if (!teamWin && type === '2:0') {
      return '0:2';
    }
    if (!teamWin && type === '2:1') {
      return '1:2';
    }
  }

  private generatUserUpdateObject(
    userId: string,
    defeat,
    domination,
    team,
    type,
  ): IUserIncrement {
    return {
      defeat: defeat >= 1,
      domination: domination >= 1,
      loss: team < 2,
      win: team >= 2,
      userId,
      statsType: this.changeType(type, team >= 2),
    };
  }

  private generatTeamUpdateObject(
    teamId: string,
    defeat,
    domination,
    team,
    type,
  ): ITeamIncrement {
    return {
      defeat: defeat >= 1,
      domination: domination >= 1,
      loss: team < 2,
      win: team >= 2,
      teamId,
      statsType: this.changeType(type, team >= 2),
    };
  }

  async delete(matchId) {
    await deleteDoc(doc(this.db, this.collection.path, matchId));
  }
}
