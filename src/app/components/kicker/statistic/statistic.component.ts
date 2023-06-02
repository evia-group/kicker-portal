import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { ILeaderboard } from 'src/app/shared/interfaces/statistic.interface';
import { SortDirection } from '@angular/material/sort';
import { TableService } from '../../../shared/services/table.service';
import { ChartsService } from '../../../shared/services/charts.service';
import {
  zeroTwo,
  oneTwo,
  twoZero,
  twoOne,
  rank,
  name,
  wins,
  losses,
  diff,
  dominations,
  defeats,
  totalMatches,
} from '../../../shared/global-variables';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit, OnDestroy {
  playersMap = new Map<string, ILeaderboard>();

  teamsMap = new Map<string, ILeaderboard>();

  selectedPlayer: string;
  selectedTeam: string;

  playersWithMatches: { id: string; name: string }[] = [];
  teamsWithMatches: { id: string; name: string }[] = [];

  playerYearsList: number[];
  teamYearsList: number[];

  selectedYearPlayer: number;
  selectedYearTeam: number;

  doughnutDataPlayer: number[];
  doughnutDataTeam: number[];

  matchesChartDataPlayer: number[];
  matchesChartDataTeam: number[];

  statisticsDataSub: Subscription;

  displayedColumnsTranslationKeysPlayer =
    this.getTranslationKeysForDisplayedColumns(false);

  displayedColumnsTranslationKeysTeam =
    this.getTranslationKeysForDisplayedColumns(true);

  displayedColumns: string[] = [
    rank,
    name,
    wins,
    losses,
    diff,
    dominations,
    defeats,
    twoZero,
    twoOne,
    zeroTwo,
    oneTwo,
    totalMatches,
  ];

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

  playerTableData$ = new BehaviorSubject([]);
  teamsTableData$ = new BehaviorSubject([]);

  activeColumn = rank;
  sortDirection: SortDirection = 'asc';
  disableClear = true;
  filterHintTranslationKey = 'stats.filterHint';
  filterTranslationKey = 'stats.filter';
  pageSizeOptions = [5, 10, 20];
  datepickerLabelKeys = ['stats.year', 'stats.monthYear', 'stats.dayMonthYear'];
  datepickerHintKeys = [
    'stats.yearFormat',
    'stats.monthFormat',
    'stats.dayFormat',
  ];

  constructor(
    private matchesService: MatchesService,
    private tableService: TableService,
    private chartsService: ChartsService
  ) {}

  ngOnInit(): void {
    this.statisticsDataSub = combineLatest([
      this.tableService.playerData$,
      this.tableService.teamData$,
      this.matchesService.matchesSub$,
    ]).subscribe((data: any) => {
      const playerDataAvailable = data[0][0].length > 0;
      const teamDataAvailable = data[1][0].length > 0;
      const matchesDataAvailable = data[2].length > 0;
      if (playerDataAvailable) {
        this.playersTable = data[0][0];
        this.playersMap = data[0][1];
        this.playerTableData$.next(this.playersTable);
      }
      if (teamDataAvailable) {
        this.teamsTable = data[1][0];
        this.teamsMap = data[1][1];
        this.teamsTableData$.next(this.teamsTable);
      }
      if (playerDataAvailable && teamDataAvailable && matchesDataAvailable) {
        [
          this.playersMap,
          this.teamsMap,
          this.selectedPlayer,
          this.playersWithMatches,
          this.selectedYearPlayer,
          this.playerYearsList,
          this.matchesChartDataPlayer,
          this.doughnutDataPlayer,
          this.selectedTeam,
          this.teamsWithMatches,
          this.selectedYearTeam,
          this.teamYearsList,
          this.matchesChartDataTeam,
          this.doughnutDataTeam,
        ] = this.chartsService.createStatisticData(
          data[2],
          this.playersMap,
          this.teamsMap
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.statisticsDataSub.unsubscribe();
  }

  getTranslationKeysForDisplayedColumns(forTeams: boolean) {
    return [
      'stats.rank',
      forTeams ? 'common.team' : 'common.player',
      'stats.wins',
      'stats.losses',
      'stats.difference',
      'stats.dominations',
      'stats.defeats',
      twoZero,
      twoOne,
      oneTwo,
      zeroTwo,
      'app.matches',
    ];
  }

  updateYearsList(isTeamSelection: boolean) {
    if (isTeamSelection) {
      this.teamYearsList = this.chartsService.setYearsList(
        this.selectedTeam,
        this.teamsMap
      );
      if (!this.teamYearsList.includes(this.selectedYearTeam)) {
        this.selectedYearTeam =
          this.teamYearsList[this.teamYearsList.length - 1];
      }
      this.doughnutDataTeam = this.chartsService.getDoughnutData(
        this.teamsMap.get(this.selectedTeam)
      );
      this.matchesChartDataTeam = this.chartsService.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else {
      this.playerYearsList = this.chartsService.setYearsList(
        this.selectedPlayer,
        this.playersMap
      );
      if (!this.playerYearsList.includes(this.selectedYearPlayer)) {
        this.selectedYearPlayer =
          this.playerYearsList[this.playerYearsList.length - 1];
      }
      this.doughnutDataPlayer = this.chartsService.getDoughnutData(
        this.playersMap.get(this.selectedPlayer)
      );
      this.matchesChartDataPlayer = this.chartsService.getMatchesChartData(
        this.playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
    }
  }

  updateMatchesData(isTeam: boolean) {
    if (isTeam) {
      this.matchesChartDataTeam = this.chartsService.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else {
      this.matchesChartDataPlayer = this.chartsService.getMatchesChartData(
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
