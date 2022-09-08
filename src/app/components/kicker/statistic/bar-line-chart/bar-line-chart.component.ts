import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { take } from 'rxjs/operators';
import { IMatch } from 'src/app/shared/interfaces/match.interface';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.scss'],
})
export class BarLineChartComponent implements OnInit {
  @Input()
  dataMap: Map<any, any>;

  @Input()
  showingTeams = false;

  public playersOrTeamsWithMatches = [];

  public selectedData: string;
  public selectedYear: number;

  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartConfiguration<'bar' | 'line'>['data'];

  public barChartOptions: ChartConfiguration<'bar' | 'line'>['options'] = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          color: 'rgb(199,199,199)',
        },
        grid: {
          color: 'rgb(89,89,89)',
        },
      },
      y: {
        ticks: {
          callback: (val) => {
            return val < 0 ? -val : val;
          },
          color: 'rgb(199,199,199)',
        },
        grid: {
          color: 'rgb(89,89,89)',
        },
      },
      qouteAxis: {
        position: 'right',
        ticks: {
          callback: (val) => {
            return val + '%';
          },
          color: 'rgb(199,199,199)',
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(199,199,199)',
        },
      },
      tooltip: {
        callbacks: {
          label: (item) => {
            const val = parseInt(item.formattedValue);
            return (
              item.dataset.label +
              ': ' +
              (val < 0 ? -val : val) +
              (item.dataset.type === 'line' ? '%' : '')
            );
          },
        },
      },
    },
  };

  public yearsList: number[] = [];

  public dataIds;

  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  constructor(
    private matchesService: MatchesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.matchesService.matches$
      .pipe(take(1))
      .subscribe((matches: IMatch[]) => {
        this.playersOrTeamsWithMatches = [];
        matches.forEach((match: IMatch) => {
          const matchTeams = Object.keys(match.result);
          const team1 = matchTeams[0];
          const team2 = matchTeams[1];
          const resultTeam1 = match.result[team1];
          let playersTeam1 = [];
          let playersTeam2 = [];
          const matchYear = match.date.toDate().getFullYear();
          const matchMonth = match.date.toDate().getMonth();

          if (!this.showingTeams) {
            this.dataIds = Array.from(this.dataMap.keys());
            playersTeam1 = this.getPlayersOfTeam(team1);
            playersTeam2 = this.getPlayersOfTeam(team2);

            playersTeam1.forEach((player) => {
              if (!this.playersOrTeamsWithMatches.includes(player)) {
                this.playersOrTeamsWithMatches.push(player);
              }
            });

            playersTeam2.forEach((player) => {
              if (!this.playersOrTeamsWithMatches.includes(player)) {
                this.playersOrTeamsWithMatches.push(player);
              }
            });

            let winningTeam;
            let loosingTeam;

            resultTeam1 === 2
              ? ((winningTeam = playersTeam1), (loosingTeam = playersTeam2))
              : ((winningTeam = playersTeam2), (loosingTeam = playersTeam1));

            winningTeam.forEach((player) => {
              this.updateTimeline(
                player,
                matchYear,
                matchMonth,
                'winsTimeline',
                'lossesTimeline'
              );
            });

            loosingTeam.forEach((player) => {
              this.updateTimeline(
                player,
                matchYear,
                matchMonth,
                'lossesTimeline',
                'winsTimeline'
              );
            });
          } else {
            if (!this.playersOrTeamsWithMatches.includes(team1)) {
              this.playersOrTeamsWithMatches.push(team1);
            }

            if (!this.playersOrTeamsWithMatches.includes(team2)) {
              this.playersOrTeamsWithMatches.push(team2);
            }

            if (resultTeam1 === 2) {
              this.updateTimeline(
                team1,
                matchYear,
                matchMonth,
                'winsTimeline',
                'lossesTimeline'
              );
              this.updateTimeline(
                team2,
                matchYear,
                matchMonth,
                'lossesTimeline',
                'winsTimeline'
              );
            } else {
              this.updateTimeline(
                team2,
                matchYear,
                matchMonth,
                'winsTimeline',
                'lossesTimeline'
              );
              this.updateTimeline(
                team1,
                matchYear,
                matchMonth,
                'lossesTimeline',
                'winsTimeline'
              );
            }
          }
        });

        const loggedInUser = this.authService.user.uid;
        if (this.playersOrTeamsWithMatches.includes(loggedInUser)) {
          this.selectedData = loggedInUser;
        } else {
          this.selectedData = this.playersOrTeamsWithMatches[0];
        }

        for (let i = 0; i < this.playersOrTeamsWithMatches.length; i++) {
          const playerId = this.playersOrTeamsWithMatches[i];
          this.playersOrTeamsWithMatches[i] = {
            id: playerId,
            name: this.dataMap.get(playerId)['name'],
          };
        }
        this.setYearsList();
        this.setBarChartData();
      });
  }

  getPlayersOfTeam(teamId: string) {
    let counter = 0;
    const teamPlayers = [];

    for (const playerId of this.dataIds) {
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
    playerOrTeam: any,
    matchYear: number,
    matchMonth: number,
    mapId: string,
    otherId: string
  ) {
    let actualTimeline = this.dataMap.get(playerOrTeam)[mapId].get(matchYear);
    if (actualTimeline) {
      actualTimeline[matchMonth]++;
    } else {
      actualTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      actualTimeline[matchMonth] = 1;
      const otherTimeline = this.dataMap
        .get(playerOrTeam)
        [otherId].get(matchYear);
      if (!otherTimeline) {
        this.dataMap
          .get(playerOrTeam)
          [otherId].set(matchYear, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
    }
    this.dataMap.get(playerOrTeam)[mapId].set(matchYear, actualTimeline);
  }

  updateChart() {
    this.setYearsList();
    this.setBarChartData();
  }

  setYearsList() {
    this.yearsList = [
      ...this.dataMap.get(this.selectedData)['winsTimeline'].keys(),
    ];
    const lossesYearsList = [
      ...this.dataMap.get(this.selectedData)['lossesTimeline'].keys(),
    ];
    lossesYearsList.forEach((year) => {
      if (!this.yearsList.includes(year)) {
        this.yearsList.push(year);
      }
    });
    this.yearsList.sort((a, b) => a - b);

    this.selectedYear = this.yearsList[this.yearsList.length - 1];
  }

  setBarChartData() {
    this.barChartData = {
      labels: this.getLabels(),
      datasets: [
        {
          type: 'bar',
          data: this.getWins(),
          label: 'Wins',
          backgroundColor: ['rgba(70, 203, 29, 0.7)'],
          borderColor: ['rgba(70, 203, 29, 1)'],
          hoverBackgroundColor: ['rgba(70, 203, 29, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'bar',
          data: this.getLosses(),
          label: 'Losses',
          backgroundColor: ['rgba(239, 63, 51, 0.7)'],
          borderColor: ['rgba(239, 63, 51, 1)'],
          hoverBackgroundColor: ['rgba(239, 63, 51, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'line',
          data: this.getWinningQuotes(),
          tension: 0.3,
          label: 'Qoute',
          order: 1,
          yAxisID: 'qouteAxis',
        },
      ],
    };
  }

  getLabels() {
    return this.months;
  }

  getWins() {
    return this.dataMap
      .get(this.selectedData)
      ['winsTimeline'].get(this.selectedYear);
  }

  getLosses() {
    return this.dataMap
      .get(this.selectedData)
      ['lossesTimeline'].get(this.selectedYear)
      .map((num: number) => {
        return -num;
      });
  }

  getWinningQuotes() {
    const winnings = this.dataMap
      .get(this.selectedData)
      ['winsTimeline'].get(this.selectedYear);
    const losses = this.dataMap
      .get(this.selectedData)
      ['lossesTimeline'].get(this.selectedYear);
    const quotes = [];

    for (let i = 0; i < winnings.length; i++) {
      const numOfMatches = winnings[i] + losses[i];
      if (numOfMatches > 0) {
        quotes.push(Math.round((winnings[i] / numOfMatches) * 100));
      } else {
        quotes.push(0);
      }
    }
    return quotes;
  }

  updateChartByYear() {
    this.setBarChartData();
  }
}
