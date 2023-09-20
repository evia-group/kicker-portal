import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { BehaviorSubject } from 'rxjs';
import { ITeam, IUser } from '../interfaces/user.interface';
import { ILeaderboard } from '../interfaces/statistic.interface';
import { twoZero, zeroTwo, twoOne, oneTwo } from '../global-variables';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  playerData$ = new BehaviorSubject<
    [
      ILeaderboard[],
      Map<string, ILeaderboard>,
      ILeaderboard[],
      Map<string, ILeaderboard>
    ]
  >(undefined);
  teamData$ = new BehaviorSubject<[ILeaderboard[], Map<string, ILeaderboard>]>(
    undefined
  );

  constructor(usersService: UsersService, teamsService: TeamsService) {
    usersService.users$.subscribe((data) => {
      const playersMap = new Map<string, ILeaderboard>();
      const playersMapSM = new Map<string, ILeaderboard>();
      let playersTable: ILeaderboard[] = [];
      let playersTableSM: ILeaderboard[] = [];
      if (data.length > 0) {
        data.forEach((player: IUser) => {
          const res = this.createTableData(player, false);
          playersMap.set(player.id, res);
          const resSM = this.createTableData(player, true);
          playersMapSM.set(player.id, resSM);
        });
        playersTable = Array.from(playersMap.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(playersTable);
        playersTableSM = Array.from(playersMapSM.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(playersTableSM);
      }
      this.playerData$.next([
        playersTable,
        playersMap,
        playersTableSM,
        playersMapSM,
      ]);
    });

    teamsService.teams$.subscribe((data) => {
      const teamsMap = new Map<string, ILeaderboard>();
      let teamsTable: ILeaderboard[] = [];
      if (data.length > 0) {
        data.forEach((team: IUser | ITeam) => {
          const res = this.createTableData(team, false);
          teamsMap.set(team.id, res);
        });
        teamsTable = Array.from(teamsMap.values()).filter(
          (team) => team.totalMatches > 0
        );
        this.addRanks(teamsTable);
      }
      this.teamData$.next([teamsTable, teamsMap]);
    });
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
        name: data.name,
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
          name: data.name,
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

  addRanks(table: ILeaderboard[]) {
    table.sort((a, b) => b.diff - a.diff);
    table.forEach((value, index) => {
      value.rank = index + 1;
    });
  }
}
