import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { BehaviorSubject } from 'rxjs';
import { ITeam, IUser } from '../interfaces/user.interface';
import { ILeaderboard } from '../interfaces/statistic.interface';
import {
  winsTimeline,
  lossesTimeline,
  twoZero,
  zeroTwo,
  twoOne,
  oneTwo,
  rank,
  totalMatches,
  diff,
  elo,
} from '../global-variables';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  receivedPlayersData = false;
  receivedTeamsData = false;

  playersMap = new Map<string, ILeaderboard>();
  playersMapSM = new Map<string, ILeaderboard>();
  teamsMap = new Map<string, ILeaderboard>();

  playersTable: ILeaderboard[];
  playersTableSM: ILeaderboard[];
  teamsTable: ILeaderboard[];

  playerData$ = new BehaviorSubject(undefined);
  teamData$ = new BehaviorSubject(undefined);

  constructor(usersService: UsersService, teamsService: TeamsService) {
    usersService.users$.subscribe((data) => {
      this.receivedPlayersData = true;
      const playersData = data;
      if (playersData.length > 0) {
        playersData.map((player: IUser) => {
          const res = this.createTableData(player, false);
          this.playersMap.set(player.id, res);
          const resSM = this.createTableData(player, true);
          this.playersMapSM.set(player.id, resSM);
        });
        this.playersTable = Array.from(this.playersMap.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(this.playersTable);
        this.playersTableSM = Array.from(this.playersMapSM.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(this.playersTableSM);
        this.playerData$.next([
          this.playersTable,
          this.playersMap,
          this.playersTableSM,
          this.playersMapSM,
        ]);
      } else {
        this.playerData$.next([[], new Map(), [], new Map()]);
      }
    });

    teamsService.teams$.subscribe((data) => {
      this.receivedTeamsData = true;
      const teamsData = data;
      if (teamsData.length > 0) {
        teamsData.map((team: IUser | ITeam) => {
          const res = this.createTableData(team, false);
          this.teamsMap.set(team.id, res);
        });
        this.teamsTable = Array.from(this.teamsMap.values()).filter(
          (team) => team.totalMatches > 0
        );
        this.addRanks(this.teamsTable);
        this.teamData$.next([this.teamsTable, this.teamsMap]);
      } else {
        this.teamData$.next([[], new Map()]);
      }
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
      lossesTimeline: undefined,
      name: '',
      rank: 0,
      totalMatches: 0,
      wins: 0,
      winsTimeline: undefined,
    };
    if (!forSingleMode) {
      // newData = (({ name, wins, losses, dominations, defeats }) => ({
      //   name,
      //   wins,
      //   losses,
      //   dominations,
      //   defeats,
      // }))(data);
      newData['name'] = data.name;
      newData['wins'] = data.wins;
      newData['losses'] = data.losses;
      newData['dominations'] = data.dominations;
      newData['defeats'] = data.defeats;
      newData[twoZero] = data.stats[twoZero];
      newData[twoOne] = data.stats[twoOne];
      newData[zeroTwo] = data.stats[zeroTwo];
      newData[oneTwo] = data.stats[oneTwo];
      newData[totalMatches] = data.wins + data.losses;
      newData[diff] = data.wins - data.losses;
      newData[elo] = 0;
      newData[winsTimeline] = new Map<number, number[]>();
      newData[lossesTimeline] = new Map<number, number[]>();
      newData[rank] = 0;
    } else {
      data = data as IUser;
      if (data.s_wins !== undefined) {
        newData['name'] = data.name;
        newData['wins'] = data.s_wins;
        newData['losses'] = data.s_losses;
        newData['dominations'] = data.s_dominations;
        newData['defeats'] = data.s_defeats;
        newData[twoZero] = data.s_stats[twoZero];
        newData[twoOne] = data.s_stats[twoOne];
        newData[zeroTwo] = data.s_stats[zeroTwo];
        newData[oneTwo] = data.s_stats[oneTwo];
        newData[totalMatches] = data.s_wins + data.s_losses;
        newData[diff] = data.s_wins - data.s_losses;
        newData[elo] = 0;
        newData[winsTimeline] = new Map<number, number[]>();
        newData[lossesTimeline] = new Map<number, number[]>();
        newData[rank] = 0;
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
