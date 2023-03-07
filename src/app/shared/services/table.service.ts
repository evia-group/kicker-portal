import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { BehaviorSubject } from 'rxjs';
import { ITeam, IUser } from '../interfaces/user.interface';
import { ILeaderboard } from '../interfaces/statistic.interface';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  playersDataAvailable = false;
  teamsDataAvailable = false;

  playersMap = new Map<string, ILeaderboard>();
  teamsMap = new Map<string, ILeaderboard>();

  playersTable: ILeaderboard[];
  teamsTable: ILeaderboard[];

  playerData$ = new BehaviorSubject([[], new Map()]);
  teamData$ = new BehaviorSubject([[], new Map()]);

  constructor(
    private usersService: UsersService,
    private teamsService: TeamsService
  ) {
    usersService.users$.subscribe((data) => {
      const playersData = data;
      if (playersData.length > 0) {
        this.playersDataAvailable = true;
        playersData.map((player: IUser) => {
          const res = this.createTableData(player);
          this.playersMap.set(player.id, res);
        });
        this.playersTable = Array.from(this.playersMap.values()).filter(
          (user) => user.totalMatches > 0
        );
        this.addRanks(this.playersTable);
        this.playerData$.next([this.playersTable, this.playersMap]);
      }
    });

    teamsService.teams$.subscribe((data) => {
      const teamsData = data;
      if (teamsData.length > 0) {
        this.teamsDataAvailable = true;
        teamsData.map((team: IUser | ITeam) => {
          const res = this.createTableData(team);
          this.teamsMap.set(team.id, res);
        });
        this.teamsTable = Array.from(this.teamsMap.values()).filter(
          (team) => team.totalMatches > 0
        );
        this.addRanks(this.teamsTable);
        this.teamData$.next([this.teamsTable, this.teamsMap]);
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
    newData['2:0'] = data.stats['2:0'];
    newData['2:1'] = data.stats['2:1'];
    newData['0:2'] = data.stats['0:2'];
    newData['1:2'] = data.stats['1:2'];
    newData['totalMatches'] = data.wins + data.losses;
    newData['diff'] = data.wins - data.losses;
    newData['elo'] = 0;
    newData['winsTimeline'] = new Map<number, number[]>();
    newData['lossesTimeline'] = new Map<number, number[]>();
    newData['rank'] = 0;

    return newData;
  }

  addRanks(table: ILeaderboard[]) {
    // table.map((item) => (item.elo = Math.round(item.elo)));
    // table.sort((a, b) => b.elo - a.elo);
    table.sort((a, b) => b.diff - a.diff);
    table.forEach((value, index) => {
      value.rank = index + 1;
    });
    // table.forEach((value, index) => {
    //   if (index > 0) {
    //     const previousValue = table[index - 1];
    //     if (value.elo === previousValue.elo) {
    //       value.rank = previousValue.rank;
    //     } else {
    //       value.rank = index + 1;
    //     }
    //   } else {
    //     value.rank = index + 1;
    //   }
    // });
  }
}
