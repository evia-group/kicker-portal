import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { LeaderboardService } from './leaderboard.service';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { ITeam, IUser } from '../interfaces/user.interface';
import {
  ILeaderboard,
  ILeaderboardEntry,
} from '../interfaces/statistic.interface';
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
    protected leaderboardService: LeaderboardService,
    protected authService: AuthService
  ) {
    authService.isLoggedIn.subscribe((loggedIn) =>
      loggedIn
        ? this.subscribeToObservables()
        : this.unsubscribeFromObservables()
    );
  }

  subscribeToObservables() {
    this.subscriptions[0] = combineLatest([
      this.usersService.users$,
      this.leaderboardService.userTeamLeaderboard$,
      this.leaderboardService.userSingleLeaderboard$,
    ]).subscribe({
      next: ([users, teamEntries, singleEntries]) => {
        this.playerData$.next([
          this.buildLeaderboardMap(users, teamEntries),
          this.buildLeaderboardMap(users, singleEntries),
        ]);
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.subscriptions[1] = combineLatest([
      this.teamsService.teams$,
      this.leaderboardService.teamLeaderboard$,
    ]).subscribe({
      next: ([teams, teamEntries]) => {
        this.teamData$.next(this.buildLeaderboardMap(teams, teamEntries));
      },
      error: (err) => console.log(err),
    });
  }

  unsubscribeFromObservables() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private buildLeaderboardMap(
    entities: (IUser | ITeam)[],
    entries: ILeaderboardEntry[]
  ): Map<string, ILeaderboard> {
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
    const map = new Map<string, ILeaderboard>();

    entities.forEach((entity) => {
      const entry = entriesById.get(entity.id);
      if (entry && entry.totalMatches > 0) {
        map.set(entity.id, this.createTableData(entity.name, entry));
      }
    });

    return map;
  }

  createTableData(name: string, entry: ILeaderboardEntry): ILeaderboard {
    return {
      name: name.replace(/ -/g, ' -'),
      wins: entry.wins,
      losses: entry.losses,
      dominations: entry.dominations,
      defeats: entry.defeats,
      [twoZero]: entry.stats[twoZero] ?? 0,
      [twoOne]: entry.stats[twoOne] ?? 0,
      [zeroTwo]: entry.stats[zeroTwo] ?? 0,
      [oneTwo]: entry.stats[oneTwo] ?? 0,
      totalMatches: entry.totalMatches,
      diff: entry.wins - entry.losses,
      elo: 0,
      rank: 0,
      winsTimeline: new Map<number, number[]>(),
      lossesTimeline: new Map<number, number[]>(),
    };
  }
}
