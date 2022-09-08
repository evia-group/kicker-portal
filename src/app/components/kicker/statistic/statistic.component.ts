import { Component, OnInit } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatTableDataSource } from '@angular/material/table';
import { ITeam, IUser } from 'src/app/shared/interfaces/user.interface';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit {
  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Card 1', cols: 1, rows: 1 },
          { title: 'Card 2', cols: 1, rows: 1 },
          { title: 'Card 3', cols: 1, rows: 1 },
          { title: 'Card 4', cols: 1, rows: 1 },
        ];
      }

      return [
        { title: 'Card 1', cols: 2, rows: 1 },
        { title: 'Card 2', cols: 1, rows: 1 },
        { title: 'Card 3', cols: 1, rows: 2 },
        { title: 'Card 4', cols: 1, rows: 1 },
      ];
    })
  );

  players: MatTableDataSource<any>;

  teams: MatTableDataSource<any>;

  playersTable: any[] = [];

  playersMap = new Map();

  teamsMap = new Map();

  teamsTable: any[] = [];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private usersService: UsersService,
    private teamsService: TeamsService,
    private authService: AuthService,
    private matchesService: MatchesService
  ) {}

  ngOnInit(): void {
    this.usersService.users$.pipe(take(1)).subscribe((players: IUser[]) => {
      players.map((player: IUser) => {
        const res = this.createTableData(player);
        this.playersTable.push(res);
        this.playersMap.set(player.id, res);
      });
      this.players = new MatTableDataSource(this.playersTable);
    });

    this.teamsService.teams$.pipe(take(1)).subscribe((teams: ITeam[]) => {
      teams.map((team) => {
        const res = this.createTableData(team);
        this.teamsTable.push(res);
        this.teamsMap.set(team.id, res);
      });
      this.teams = new MatTableDataSource(this.teamsTable);
    });

    this.sortTable(this.playersTable);
    this.sortTable(this.teamsTable);
    this.addRanks(this.playersTable);
    this.addRanks(this.teamsTable);
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
    newData['elo'] = this.calcElo(data);
    newData['winsTimeline'] = new Map();
    newData['lossesTimeline'] = new Map();

    return newData;
  }

  sortTable(table: any[]) {
    table.sort((a, b) => {
      if (a.elo > b.elo) return -1;
      if (a.elo < b.elo) return 1;
      return 0;
    });
  }

  addRanks(table: any[]) {
    table.forEach((value, index) => {
      value.rank = index + 1;
    });
  }

  calcElo(data: IUser | ITeam) {
    return (
      data.wins * 3 +
      data.losses * -3 +
      data.dominations * 1 +
      data.defeats * -1 +
      data.stats['2:0'] * 2 +
      data.stats['2:1'] * 1 +
      data.stats['0:2'] * -2 +
      data.stats['1:2'] * -1
    );
  }
}
