import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { UsersService } from 'src/app/shared/services/users.service';
import { ITeam, IUser } from 'src/app/shared/interfaces/user.interface';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { IMatch } from 'src/app/shared/interfaces/match.interface';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';
import { ILeaderboard } from 'src/app/shared/interfaces/statistic.interface';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit, OnDestroy {
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

  playersMap = new Map<string, ILeaderboard>();

  teamsMap = new Map<string, ILeaderboard>();

  selectedPlayer: string;
  selectedTeam: string;

  playersWithMatches: { id: string; name: string }[] = [];
  teamsWithMatches: { id: string; name: string }[] = [];

  playerIds: string[] = [];

  playerYearsList: number[];
  teamYearsList: number[];

  selectedYearPlayer: number;
  selectedYearTeam: number;

  doughnutDataPlayer: number[];
  doughnutDataTeam: number[];

  matchesChartDataPlayer: number[];
  matchesChartDataTeam: number[];

  playersDataAvailable = false;
  teamsDataAvailable = false;
  matchesDataAvailable = false;

  translateSub: Subscription;

  legendLabels: string[] = [];

  months: string[] = [];

  localeId: string;

  playersTable: ILeaderboard[];
  teamsTable: ILeaderboard[];

  barLineChartReadyP = false;
  doughnutChartReadyP = false;
  matchesChartReadyP = false;
  barLineChartReadyT = false;
  doughnutChartReadyT = false;
  matchesChartReadyT = false;
  allChartsReadyP = false;
  allChartsReadyT = false;

  selectedTab = 0;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private usersService: UsersService,
    private teamsService: TeamsService,
    private authService: AuthService,
    private matchesService: MatchesService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.usersService.users$.pipe(take(1)),
      this.teamsService.teams$.pipe(take(1)),
    ]).subscribe((res) => {
      const playersData = res[0];
      const teamsData = res[1];

      if (playersData.length > 0) {
        this.playersDataAvailable = true;
        playersData.map((player: IUser) => {
          const res = this.createTableData(player);
          this.playersMap.set(player.id, res);
        });
        this.playersTable = Array.from(this.playersMap.values()).filter(
          (user) => user.totalMatches > 0
        );
      }
      if (teamsData.length > 0) {
        this.teamsDataAvailable = true;
        teamsData.map((team: IUser | ITeam) => {
          const res = this.createTableData(team);
          this.teamsMap.set(team.id, res);
        });
        this.teamsTable = Array.from(this.teamsMap.values()).filter(
          (team) => team.totalMatches > 0
        );
      }
      if (this.playersDataAvailable && this.teamsDataAvailable) {
        this.matchesProcess();
      }
    });

    this.getText();

    this.translateSub = this.translateService.onLangChange.subscribe(
      (_event: LangChangeEvent) => {
        this.getText();
      }
    );
  }

  matchesProcess() {
    this.matchesService.matches$
      .pipe(take(1))
      .subscribe((matches: IMatch[]) => {
        if (matches.length > 0) {
          this.matchesDataAvailable = true;
          this.selectedPlayer = undefined;
          const loggedInUser = this.authService.user.uid;
          matches.sort((a, b) => a.date.toMillis() - b.date.toMillis());

          const playerIdsWithMatches: string[] = [];
          const teamIdsWithMatches: string[] = [];
          matches.forEach((match: IMatch) => {
            const matchTeams = Object.keys(match.result);
            const team1 = matchTeams[0];
            const team2 = matchTeams[1];
            const resultTeam1 = match.result[team1];
            let playersTeam1: string[] = [];
            let playersTeam2: string[] = [];

            const matchYear = match.date.toDate().getFullYear();
            const matchMonth = match.date.toDate().getMonth();
            const teamIds = Array.from(this.teamsMap.keys());

            this.playerIds = Array.from(this.playersMap.keys());
            playersTeam1 = this.getPlayersOfTeam(team1);
            playersTeam2 = this.getPlayersOfTeam(team2);

            if (teamIds.includes(team1) || teamIds.includes(team2)) {
              playersTeam1.forEach((player) => {
                if (!playerIdsWithMatches.includes(player)) {
                  playerIdsWithMatches.push(player);
                }
              });

              playersTeam2.forEach((player) => {
                if (!playerIdsWithMatches.includes(player)) {
                  playerIdsWithMatches.push(player);
                }
              });

              let winningTeam: string[];
              let loosingTeam: string[];
              // let winningTeamId: string;
              // let loosingTeamId: string;

              if (resultTeam1 === 2) {
                winningTeam = playersTeam1;
                loosingTeam = playersTeam2;
                // winningTeamId = team1;
                // loosingTeamId = team2;
              } else {
                winningTeam = playersTeam2;
                loosingTeam = playersTeam1;
                // winningTeamId = team2;
                // loosingTeamId = team1;
              }

              // resultTeam1 === 2
              //   ? ((winningTeam = playersTeam1), (loosingTeam = playersTeam2))
              //   : ((winningTeam = playersTeam2), (loosingTeam = playersTeam1));

              // this.calcElo(
              //   winningTeam,
              //   loosingTeam,
              //   winningTeamId,
              //   loosingTeamId
              // );

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

              if (
                !teamIdsWithMatches.includes(team1) &&
                teamIds.includes(team1)
              ) {
                teamIdsWithMatches.push(team1);
              }

              if (
                !teamIdsWithMatches.includes(team2) &&
                teamIds.includes(team2)
              ) {
                teamIdsWithMatches.push(team2);
              }

              if (!this.selectedTeam) {
                if (
                  (team1.startsWith(loggedInUser) ||
                    team1.endsWith(loggedInUser)) &&
                  teamIdsWithMatches.includes(team1)
                ) {
                  this.selectedTeam = team1;
                } else if (
                  (team2.startsWith(loggedInUser) ||
                    team2.endsWith(loggedInUser)) &&
                  teamIdsWithMatches.includes(team2)
                ) {
                  this.selectedTeam = team2;
                }
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
            }
          });

          if (playerIdsWithMatches.includes(loggedInUser)) {
            this.selectedPlayer = loggedInUser;
          } else {
            this.selectedPlayer = playerIdsWithMatches[0];
          }

          if (!this.selectedTeam) {
            this.selectedTeam = teamIdsWithMatches[0];
          }

          for (let i = 0; i < playerIdsWithMatches.length; i++) {
            const itemId = playerIdsWithMatches[i];
            this.playersWithMatches[i] = {
              id: itemId,
              name: this.playersMap.get(itemId)['name'],
            };
          }

          for (let i = 0; i < teamIdsWithMatches.length; i++) {
            const itemId = teamIdsWithMatches[i];
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
          this.doughnutDataPlayer = this.getDoughnutData(
            this.playersMap.get(this.selectedPlayer)
          );
          this.doughnutDataTeam = this.getDoughnutData(
            this.teamsMap.get(this.selectedTeam)
          );
          this.matchesChartDataPlayer = this.getMatchesChartData(
            this.playersMap.get(this.selectedPlayer),
            this.selectedYearPlayer
          );
          this.matchesChartDataTeam = this.getMatchesChartData(
            this.teamsMap.get(this.selectedTeam),
            this.selectedYearTeam
          );

          this.addRanks(this.playersTable);
          this.addRanks(this.teamsTable);
          this.matchesService.leaderboardData$.next([false, this.playersTable]);
          this.matchesService.leaderboardData$.next([true, this.teamsTable]);
        }
      });
  }

  ngOnDestroy(): void {
    this.translateSub.unsubscribe();
  }

  getText() {
    this.translateService
      .get(['months', 'stats', 'app'])
      .pipe(take(1))
      .subscribe((res) => {
        this.months = [
          res.months.jan,
          res.months.feb,
          res.months.mar,
          res.months.apr,
          res.months.may,
          res.months.jun,
          res.months.jul,
          res.months.aug,
          res.months.sep,
          res.months.oct,
          res.months.nov,
          res.months.dec,
        ];

        this.legendLabels = [
          res.stats.wins,
          res.stats.losses,
          res.stats.dominations,
          res.stats.defeats,
          res.stats.winRate,
          res.app.matches,
          res.stats.playtimeLegend,
          res.stats.minutes,
        ];

        this.localeId = res.app.language.id;
      });
  }

  getPlayersOfTeam(teamId: string): string[] {
    let counter = 0;
    const teamPlayers: string[] = [];

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
    dataMap: Map<string, ILeaderboard>,
    playerOrTeam: string,
    matchYear: number,
    matchMonth: number,
    mapId: string,
    otherId: string
  ) {
    if (dataMap.get(playerOrTeam)) {
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
  }

  setYearsList(selectedData: string, dataMap: Map<string, ILeaderboard>) {
    // const yearsList = [...dataMap.get(selectedData)['winsTimeline'].keys()];
    const yearsList = Array.from(
      dataMap.get(selectedData)['winsTimeline'].keys()
    );
    // const lossesYearsList = [
    //   ...dataMap.get(selectedData)['lossesTimeline'].keys(),
    // ];
    const lossesYearsList = Array.from(
      dataMap.get(selectedData)['lossesTimeline'].keys()
    );
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
      this.doughnutDataTeam = this.getDoughnutData(
        this.teamsMap.get(this.selectedTeam)
      );
      this.matchesChartDataTeam = this.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else {
      this.playerYearsList = this.setYearsList(
        this.selectedPlayer,
        this.playersMap
      );
      if (!this.playerYearsList.includes(this.selectedYearPlayer)) {
        this.selectedYearPlayer =
          this.playerYearsList[this.playerYearsList.length - 1];
      }
      this.doughnutDataPlayer = this.getDoughnutData(
        this.playersMap.get(this.selectedPlayer)
      );
      this.matchesChartDataPlayer = this.getMatchesChartData(
        this.playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
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

  calcElo(
    winningTeam: string[],
    loosingTeam: string[],
    winningTeamId: string,
    loosingTeamId: string
  ) {
    const ratingA1 = this.playersMap.get(winningTeam[0]).elo;
    const ratingA2 = this.playersMap.get(winningTeam[1]).elo;
    const ratingB1 = this.playersMap.get(loosingTeam[0]).elo;
    const ratingB2 = this.playersMap.get(loosingTeam[1]).elo;
    let teamRatingA: number;

    const teamA = this.teamsMap.get(winningTeamId);
    if (teamA) {
      teamRatingA = teamA.elo;
    } else {
      teamRatingA = (ratingA1 + ratingA2) / 2;
    }

    let teamRatingB: number;
    const teamB = this.teamsMap.get(loosingTeamId);
    if (teamB) {
      teamRatingB = teamB.elo;
    } else {
      teamRatingB = (ratingB1 + ratingB2) / 2;
    }

    const eA = 1 / (1 + 10 ** ((teamRatingB - teamRatingA) / 400));
    const eB = 1 / (1 + 10 ** ((teamRatingA - teamRatingB) / 400));
    // console.log(eA, eB);
    const newRatingA1 = ratingA1 + 20 * (1 - eA);
    const newRatingA2 = ratingA2 + 20 * (1 - eA);
    const newRatingB1 = ratingB1 + 20 * (0 - eB);
    const newRatingB2 = ratingB2 + 20 * (0 - eB);
    const newTeamRatingA = teamRatingA + 20 * (1 - eA);
    const newTeamRatingB = teamRatingB + 20 * (0 - eA);
    this.playersMap.get(winningTeam[0]).elo = Math.round(newRatingA1);
    this.playersMap.get(winningTeam[1]).elo = Math.round(newRatingA2);
    this.playersMap.get(loosingTeam[0]).elo = Math.max(
      Math.round(newRatingB1),
      0
    );
    this.playersMap.get(loosingTeam[1]).elo = Math.max(
      Math.round(newRatingB2),
      0
    );
    this.teamsMap.get(winningTeamId).elo = Math.round(newTeamRatingA);
    this.teamsMap.get(loosingTeamId).elo = Math.max(
      Math.round(newTeamRatingB),
      0
    );
    // this.playersMap.get(winningTeam[0]).elo = newRatingA1;
    // this.playersMap.get(winningTeam[1]).elo = newRatingA2;
    // this.playersMap.get(loosingTeam[0]).elo = Math.max(newRatingB1, 0);
    // this.playersMap.get(loosingTeam[1]).elo = Math.max(newRatingB2, 0);
    // console.log(this.playersMap.get(winningTeam[0]).elo);
    // console.log(this.playersMap.get(winningTeam[1]).elo);
    // console.log(this.playersMap.get(loosingTeam[0]).elo);
    // console.log(this.playersMap.get(loosingTeam[1]).elo);
    // console.log('____________________________________________');
    // if () {
    //   //
    // }else {
    //   //
    // }

    // return (
    //   data.wins * 3 +
    //   data.losses * -3 +
    //   data.dominations * 1 +
    //   data.defeats * -1 +
    //   data.stats['2:0'] * 2 +
    //   data.stats['2:1'] * 1 +
    //   data.stats['0:2'] * -2 +
    //   data.stats['1:2'] * -1
    // );
  }

  getDoughnutData(data: ILeaderboard) {
    return [
      data.wins,
      data.losses,
      data.dominations,
      data.defeats,
      data['2:0'],
      data['2:1'],
      data['1:2'],
      data['0:2'],
    ];
  }

  getMatchesChartData(data: ILeaderboard, selYear: number) {
    const wins = data['winsTimeline'].get(selYear);
    const losses = data['lossesTimeline'].get(selYear);
    const sum: number[] = [];

    for (let i = 0; i < wins.length; i++) {
      sum[i] = wins[i] + losses[i];
    }
    return sum;
  }

  updateMatchesData(isTeam: boolean) {
    if (isTeam) {
      this.matchesChartDataTeam = this.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else {
      this.matchesChartDataPlayer = this.getMatchesChartData(
        this.playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
    }
  }

  checkIfChartsReady(chartId: number, isReady: boolean) {
    if (chartId === 0) {
      this.barLineChartReadyP = isReady;
    } else if (chartId === 1) {
      this.doughnutChartReadyP = isReady;
    } else if (chartId === 2) {
      this.matchesChartReadyP = isReady;
    } else if (chartId === 3) {
      this.barLineChartReadyT = isReady;
    } else if (chartId === 4) {
      this.doughnutChartReadyT = isReady;
    } else {
      this.matchesChartReadyT = isReady;
    }
    this.allChartsReadyP =
      this.barLineChartReadyP &&
      this.doughnutChartReadyP &&
      this.matchesChartReadyP;
    this.allChartsReadyT =
      this.barLineChartReadyT &&
      this.doughnutChartReadyT &&
      this.matchesChartReadyT;
  }
}
