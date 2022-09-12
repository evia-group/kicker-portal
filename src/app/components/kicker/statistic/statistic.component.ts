import { Component, OnInit } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatTableDataSource } from '@angular/material/table';
import { ITeam, IUser } from 'src/app/shared/interfaces/user.interface';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { IMatch } from 'src/app/shared/interfaces/match.interface';

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

  selectedPlayer: string;
  selectedTeam: string;

  playersWithMatches = [];
  teamsWithMatches = [];

  playerIds = [];

  playerYearsList = [];
  teamYearsList = [];

  selectedYearPlayer: number;
  selectedYearTeam: number;

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

    this.matchesService.matches$
      .pipe(take(1))
      .subscribe((matches: IMatch[]) => {
        this.selectedPlayer = undefined;
        const loggedInUser = this.authService.user.uid;

        matches.forEach((match: IMatch) => {
          const matchTeams = Object.keys(match.result);
          const team1 = matchTeams[0];
          const team2 = matchTeams[1];
          const resultTeam1 = match.result[team1];
          let playersTeam1 = [];
          let playersTeam2 = [];
          const matchYear = match.date.toDate().getFullYear();
          const matchMonth = match.date.toDate().getMonth();

          this.playerIds = Array.from(this.playersMap.keys());
          playersTeam1 = this.getPlayersOfTeam(team1);
          playersTeam2 = this.getPlayersOfTeam(team2);

          playersTeam1.forEach((player) => {
            if (!this.playersWithMatches.includes(player)) {
              this.playersWithMatches.push(player);
            }
          });

          playersTeam2.forEach((player) => {
            if (!this.playersWithMatches.includes(player)) {
              this.playersWithMatches.push(player);
            }
          });

          let winningTeam;
          let loosingTeam;

          resultTeam1 === 2
            ? ((winningTeam = playersTeam1), (loosingTeam = playersTeam2))
            : ((winningTeam = playersTeam2), (loosingTeam = playersTeam1));

          winningTeam.forEach((player) => {
            this.updateTimeline(
              this.playersMap,
              player,
              matchYear,
              matchMonth,
              'winsTimeline',
              'lossesTimeline'
            );
          });

          loosingTeam.forEach((player) => {
            this.updateTimeline(
              this.playersMap,
              player,
              matchYear,
              matchMonth,
              'lossesTimeline',
              'winsTimeline'
            );
          });

          if (this.playersWithMatches.includes(loggedInUser)) {
            this.selectedPlayer = loggedInUser;
          } else {
            this.selectedPlayer = this.playersWithMatches[0];
          }

          if (!this.selectedTeam) {
            if (
              team1.startsWith(loggedInUser) ||
              team1.endsWith(loggedInUser)
            ) {
              this.selectedTeam = team1;
            } else if (
              team2.startsWith(loggedInUser) ||
              team2.endsWith(loggedInUser)
            ) {
              this.selectedTeam = team2;
            }
          }

          if (!this.teamsWithMatches.includes(team1)) {
            this.teamsWithMatches.push(team1);
          }

          if (!this.teamsWithMatches.includes(team2)) {
            this.teamsWithMatches.push(team2);
          }

          if (resultTeam1 === 2) {
            this.updateTimeline(
              this.teamsMap,
              team1,
              matchYear,
              matchMonth,
              'winsTimeline',
              'lossesTimeline'
            );
            this.updateTimeline(
              this.teamsMap,
              team2,
              matchYear,
              matchMonth,
              'lossesTimeline',
              'winsTimeline'
            );
          } else {
            this.updateTimeline(
              this.teamsMap,
              team2,
              matchYear,
              matchMonth,
              'winsTimeline',
              'lossesTimeline'
            );
            this.updateTimeline(
              this.teamsMap,
              team1,
              matchYear,
              matchMonth,
              'lossesTimeline',
              'winsTimeline'
            );
          }
        });

        if (!this.selectedTeam) {
          this.selectedTeam = this.teamsWithMatches[0];
        }

        for (let i = 0; i < this.playersWithMatches.length; i++) {
          const itemId = this.playersWithMatches[i];
          this.playersWithMatches[i] = {
            id: itemId,
            name: this.playersMap.get(itemId)['name'],
          };
        }

        for (let i = 0; i < this.teamsWithMatches.length; i++) {
          const itemId = this.teamsWithMatches[i];
          this.teamsWithMatches[i] = {
            id: itemId,
            name: this.teamsMap.get(itemId)['name'],
          };
        }

        this.playerYearsList = this.setYearsList(
          this.selectedPlayer,
          this.playersMap
        );
        this.teamYearsList = this.setYearsList(
          this.selectedTeam,
          this.teamsMap
        );

        this.selectedYearPlayer =
          this.playerYearsList[this.playerYearsList.length - 1];
        this.selectedYearTeam =
          this.teamYearsList[this.teamYearsList.length - 1];
      });
  }

  getPlayersOfTeam(teamId: string) {
    let counter = 0;
    const teamPlayers = [];

    for (const playerId of this.playerIds) {
      if (teamId.startsWith(playerId) || teamId.endsWith(playerId)) {
        teamPlayers.push(playerId);
        counter++;
      }
      if (counter === 2) {
        break;
      }
    }
    return teamPlayers;
  }

  updateTimeline(
    dataMap,
    playerOrTeam: any,
    matchYear: number,
    matchMonth: number,
    mapId: string,
    otherId: string
  ) {
    let actualTimeline = dataMap.get(playerOrTeam)[mapId].get(matchYear);
    if (actualTimeline) {
      actualTimeline[matchMonth]++;
    } else {
      actualTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      actualTimeline[matchMonth] = 1;
      const otherTimeline = dataMap.get(playerOrTeam)[otherId].get(matchYear);
      if (!otherTimeline) {
        dataMap
          .get(playerOrTeam)
          [otherId].set(matchYear, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
    }
    dataMap.get(playerOrTeam)[mapId].set(matchYear, actualTimeline);
  }

  setYearsList(selectedData, dataMap) {
    const yearsList = [...dataMap.get(selectedData)['winsTimeline'].keys()];
    const lossesYearsList = [
      ...dataMap.get(selectedData)['lossesTimeline'].keys(),
    ];
    lossesYearsList.forEach((year) => {
      if (!yearsList.includes(year)) {
        yearsList.push(year);
      }
    });
    yearsList.sort((a, b) => a - b);

    return yearsList;
  }

  updateYearsList(isTeamSelection: boolean) {
    if (isTeamSelection) {
      this.teamYearsList = this.setYearsList(this.selectedTeam, this.teamsMap);
      if (!this.teamYearsList.includes(this.selectedYearTeam)) {
        this.selectedYearTeam =
          this.teamYearsList[this.teamYearsList.length - 1];
      }
    } else {
      this.playerYearsList = this.setYearsList(
        this.selectedPlayer,
        this.playersMap
      );
      if (!this.playerYearsList.includes(this.selectedYearPlayer)) {
        this.selectedYearPlayer =
          this.playerYearsList[this.playerYearsList.length - 1];
      }
    }
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
