import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ITeam, IUser } from '../interfaces/user.interface';
import { ILeaderboard } from '../interfaces/statistic.interface';
import { twoZero, zeroTwo, twoOne, oneTwo } from '../global-variables';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  playerData$ = new BehaviorSubject<
    [Map<string, ILeaderboard>, Map<string, ILeaderboard>]
  >(undefined);
  teamData$ = new BehaviorSubject<Map<string, ILeaderboard>>(undefined);
  subscriptions: Subscription[] = [];

  constructor(
    protected usersService: UsersService,
    protected teamsService: TeamsService,
    protected authService: AuthService
  ) {
    authService.isLoggedIn.subscribe((loggedIn) =>
      loggedIn
        ? this.subscribeToObservables()
        : this.unsubscribeFromObservables()
    );
  }

  subscribeToObservables() {
    this.subscriptions[0] = this.usersService.users$.subscribe({
      next: (data) => {
        const playersMap = new Map<string, ILeaderboard>();
        const playersMapSM = new Map<string, ILeaderboard>();
        if (data.length > 0) {
          data.forEach((player: IUser) => {
            const res = this.createTableData(player, false);
            if (res.totalMatches > 0) {
              playersMap.set(player.id, res);
            }
            const resSM = this.createTableData(player, true);
            if (resSM.totalMatches > 0) {
              playersMapSM.set(player.id, resSM);
            }
          });
        }
        this.playerData$.next([playersMap, playersMapSM]);
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.subscriptions[1] = this.teamsService.teams$.subscribe({
      next: (data) => {
        const teamsMap = new Map<string, ILeaderboard>();
        if (data.length > 0) {
          data.forEach((team: IUser | ITeam) => {
            const res = this.createTableData(team, false);
            if (res.totalMatches > 0) {
              teamsMap.set(team.id, res);
            }
          });
        }
        this.teamData$.next(teamsMap);
      },
      error: (err) => console.log(err),
    });
  }

  unsubscribeFromObservables() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  createTableData(data: IUser | ITeam, forSingleMode: boolean) {
    const newData: ILeaderboard = {
      '0:2': 0,
      '1:2': 0,
      '2:0': 0,
      '2:1': 0,
      defeats: 0,
      diff: 0,
      dominations: 0,
      elo: 0,
      losses: 0,
      lossesTimeline: new Map<number, number[]>(),
      name: '',
      rank: 0,
      totalMatches: 0,
      wins: 0,
      winsTimeline: new Map<number, number[]>(),
    };
    if (!forSingleMode) {
      Object.assign(newData, {
        name: data.name.replace(/ -/g, '\u00A0-'),
        wins: data.wins,
        losses: data.losses,
        dominations: data.dominations,
        defeats: data.defeats,
        [twoZero]: data.stats[twoZero],
        [twoOne]: data.stats[twoOne],
        [zeroTwo]: data.stats[zeroTwo],
        [oneTwo]: data.stats[oneTwo],
        totalMatches: data.wins + data.losses,
        diff: data.wins - data.losses,
      });
    } else {
      data = data as IUser;
      if (data.s_wins !== undefined) {
        Object.assign(newData, {
          name: data.name.replace(/ -/g, '\u00A0-'),
          wins: data.s_wins,
          losses: data.s_losses,
          dominations: data.s_dominations,
          defeats: data.s_defeats,
          [twoZero]: data.s_stats[twoZero],
          [twoOne]: data.s_stats[twoOne],
          [zeroTwo]: data.s_stats[zeroTwo],
          [oneTwo]: data.s_stats[oneTwo],
          totalMatches: data.s_wins + data.s_losses,
          diff: data.s_wins - data.s_losses,
        });
      }
    }
    return newData;
  }
}
