import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, DocumentReference} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';
import {IMatch} from '../interfaces/match.interface';
import {InfoBarService} from './info-bar.service';
import {FormGroup} from '@angular/forms';
import {ITeamIncrement, IUserIncrement} from '../interfaces/user.interface';
import {UsersService} from './users.service';
import {TeamsService} from './teams.service';



@Injectable({
  providedIn: 'root',
})
export class MatchesService {

  constructor(protected db: AngularFirestore,
              protected userService: UsersService,
              protected teamService: TeamsService,
              protected infoBar: InfoBarService) {

    this.collection = this.db.collection<IMatch>('Matches');
    this.matches$ = this.collection.valueChanges().pipe(shareReplay(1));
  }

  public matches$: Observable<any>;

  protected collection: AngularFirestoreCollection;

  private static getRoundInfos(team: string, form: FormGroup, type: 'win' | 'dominationTeamOne' | 'dominationTeamTwo'): number {
    const rounds = [
      form.get(`rounds.one.${type}`).value,
      form.get(`rounds.two.${type}`).value,
      form.get(`rounds.three.${type}`).value
    ];

    return rounds.filter((round) => {
      if (type === 'win') {
        return round === team;
      } else {
        return round;
      }
    }).length;
  }

  public async add(match: FormGroup) {
    console.log('!-----ADD-----!');
    console.log('match:', match);

    const team1 = match.get('players.team1.teamId').value;
    const team2 = match.get('players.team2.teamId').value;

    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsTeam1 = MatchesService.getRoundInfos('team1', match, 'dominationTeamOne');
    const dominationsTeam2 = MatchesService.getRoundInfos('team2', match, 'dominationTeamTwo');


    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];


    const teams = [
      this.db.doc(`Teams/${team1})}`).ref,
      this.db.doc(`Teams/${team2})}`).ref,
    ];

    const players = [
      this.db.doc(`Teams/${match.get('players.team1.one').value.id}`).ref,
      this.db.doc(`Teams/${match.get('players.team1.two').value.id}`).ref,
      this.db.doc(`Teams/${match.get('players.team2.one').value.id}`).ref,
      this.db.doc(`Teams/${match.get('players.team2.two').value.id}`).ref,
    ];

    const result = {
      [`${team1}`]: winTeam1,
      [`${team2}`]: winTeam2,
    };

    for (let i = 0; i < dominationsTeam1; i++) {
      dominations.push(this.db.doc(`Teams/${team1}`).ref);
      defeats.push(this.db.doc(`Teams/${team2}`).ref);
    }

    for (let j = 0; j < dominationsTeam2; j++) {
      dominations.push(this.db.doc(`Teams/${team2}`).ref);
      defeats.push(this.db.doc(`Teams/${team1}`).ref);
    }

    const resultMatch: IMatch = {
      defeats,
      dominations,
      players,
      result,
      teams,
      type: `${winTeam1}:${winTeam2}`
    };

    await this.updateTeamAndUserStats(match);

    this.collection.add(resultMatch)
      .then(() => {
        this.infoBar.openCustomSnackBar('Dein Spiel wurde erfolgreich gespeichert!', 'close', 5);
      })
      .catch(() => this.infoBar.openComponentSnackBar(5));
  }

  updateTeamAndUserStats(match: FormGroup) {
    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');
    const dominationsTeam1 = MatchesService.getRoundInfos('team1', match, 'dominationTeamOne');
    const dominationsTeam2 = MatchesService.getRoundInfos('team1', match, 'dominationTeamTwo');
    const type = `${winTeam1}:${winTeam2}`;

    console.log('DOMINATION 1', dominationsTeam1);
    console.log('DOMINATION 2', dominationsTeam2);

    const userUpdateStats: IUserIncrement[] = [
      {
        defeat: dominationsTeam2 >= 1,
        domination: dominationsTeam1 >= 1,
        loss: winTeam1 < 2,
        win: winTeam1 >= 2,
        userId: match.get('players.team1.one').value.id,
        statsType: type,
      },
      {
        defeat: dominationsTeam2 >= 1,
        domination: dominationsTeam1 >= 1,
        loss: winTeam1 < 2,
        win: winTeam1 >= 2,
        userId: match.get('players.team1.two').value.id,
        statsType: type,
      },
      {
        defeat: dominationsTeam1 >= 1,
        domination: dominationsTeam2 >= 1,
        loss: winTeam2 < 2,
        win: winTeam2 >= 2,
        userId: match.get('players.team2.one').value.id,
        statsType: type,
      },
      {
        defeat: dominationsTeam1 >= 1,
        domination: dominationsTeam2 >= 1,
        loss: winTeam2 < 2,
        win: winTeam2 >= 2,
        userId: match.get('players.team2.two').value.id,
        statsType: type,
      }
    ];

    // Teams
    const teamUpdateStats: ITeamIncrement[] = [
      {
        defeat: dominationsTeam2 >= 1,
        domination: dominationsTeam1 >= 1,
        loss: winTeam1 < 2,
        win: winTeam1 >= 2,
        teamId: match.get('players.team1.teamId').value,
        statsType: type,
      },
      {
        defeat: dominationsTeam1 >= 1,
        domination: dominationsTeam2 >= 1,
        loss: winTeam2 < 2,
        win: winTeam2 >= 2,
        teamId: match.get('players.team2.teamId').value,
        statsType: type,
      },
    ];

    this.updateUserStats(userUpdateStats);
    this.updateTeam(teamUpdateStats);
  }

  updateUserStats(userIncrement: IUserIncrement[]) {
    userIncrement.forEach((user) => {
      this.userService.incrementUserStates(user.userId, user.win, user.loss, user.defeat, user.domination, user.statsType);
    })
  }

  updateTeam(teamIncrement: ITeamIncrement[]) {
    teamIncrement.forEach((team) => {
      this.teamService.incrementTeamStates(team.teamId, team.win, team.loss, team.defeat, team.domination, team.statsType )
    })
  }

  delete(matchId) {
    this.collection.doc(matchId).delete();
  }
}
