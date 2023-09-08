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
  teamsMap = new Map<string, ILeaderboard>();

  playersTable: ILeaderboard[];
  teamsTable: ILeaderboard[];

  playerData$ = new BehaviorSubject(undefined);
  teamData$ = new BehaviorSubject(undefined);

  constructor(usersService: UsersService, teamsService: TeamsService) {
    usersService.users$.subscribe((data) => {
      this.receivedPlayersData = true;
      const playersData = data;
      if (playersData.length > 0) {
        playersData.map((player: IUser) => {
          const res = this.createTableData(player);
          this.playersMap.set(player.id, res);
        });
        this.playersTable = Array.from(this.playersMap.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(this.playersTable);
        this.playerData$.next([this.playersTable, this.playersMap]);
      } else {
        this.playerData$.next([[], new Map()]);
      }
    });

    teamsService.teams$.subscribe((data) => {
      this.receivedTeamsData = true;
      const teamsData = data;
      if (teamsData.length > 0) {
        teamsData.map((team: IUser | ITeam) => {
          const res = this.createTableData(team);
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

  createTableData(data: IUser | ITeam) {
    const newData = (({ name, wins, losses, dominations, defeats }) => ({
      name,
      wins,
      losses,
      dominations,
      defeats,
    }))(data);
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

    return newData;
  }

  addRanks(table: ILeaderboard[]) {
    table.sort((a, b) => b.diff - a.diff);
    table.forEach((value, index) => {
      value.rank = index + 1;
    });
  }
}
