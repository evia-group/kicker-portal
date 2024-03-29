import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { combineLatest, ReplaySubject, Subscription } from 'rxjs';
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
  elo,
} from '../../../shared/global-variables';
import {
  IMatch,
  IPlayers,
  ISingleMatch,
} from '../../../shared/interfaces/match.interface';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit, OnDestroy {
  playersMap = new Map<string, ILeaderboard>();

  playersMapSM = new Map<string, ILeaderboard>();

  teamsMap = new Map<string, ILeaderboard>();

  selectedPlayer: string;
  selectedPlayerValue: IPlayers;
  selectedPlayerSM: string;
  selectedPlayerValueSM: IPlayers;
  selectedTeam: string;
  selectedTeamValue: IPlayers;

  playersWithMatches: { id: string; name: string }[] = [];

  playersWithMatchesSM: { id: string; name: string }[] = [];

  teamsWithMatches: { id: string; name: string }[] = [];

  playerYearsList: number[];
  playerYearsListSM: number[];
  teamYearsList: number[];

  selectedYearPlayer: number;
  selectedYearPlayerSM: number;
  selectedYearTeam: number;

  doughnutDataPlayer: number[];
  doughnutDataPlayerSM: number[];
  doughnutDataTeam: number[];

  matchesChartDataPlayer: number[];
  matchesChartDataPlayerSM: number[];
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
    elo,
  ];

  playersTable: ILeaderboard[];
  playersTableSM: ILeaderboard[];
  teamsTable: ILeaderboard[];

  barLineChartReadyP = false;
  doughnutChartReadyP = false;
  matchesChartReadyP = false;
  barLineChartReadyT = false;
  doughnutChartReadyT = false;
  matchesChartReadyT = false;
  barLineChartReadyPSM = false;
  doughnutChartReadyPSM = false;
  matchesChartReadyPSM = false;
  allChartsReadyP = false;
  allChartsReadyT = false;
  allChartsReadyPSM = false;

  playerTableData$ = new ReplaySubject(1);
  playerTableDataSM$ = new ReplaySubject(1);
  teamsTableData$ = new ReplaySubject(1);

  receivedDataP = false;
  receivedDataT = false;
  receivedDataM = false;
  receivedDataSM = false;

  playerDataAvailable = false;
  playerDataAvailableSM = false;
  teamDataAvailable = false;
  matchesDataAvailable = false;
  matchesDataAvailableSM = false;

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

  singleMode = false;

  singleModeSubscription: Subscription;

  yearFilter = (d: Date | null, yearsList: number[]): boolean => {
    return d ? yearsList.includes(d.getFullYear()) : false;
  };
  yearFilterPlayer = (d: Date | null): boolean => {
    return this.yearFilter(d, this.playerYearsList);
  };

  yearFilterPlayerSM = (d: Date | null): boolean => {
    return this.yearFilter(d, this.playerYearsListSM);
  };

  yearFilterTeam = (d: Date | null): boolean => {
    return this.yearFilter(d, this.teamYearsList);
  };

  yearDatePlayer = new Date();
  yearDatePlayerSM = new Date();
  yearDateTeam = new Date();

  constructor(
    private matchesService: MatchesService,
    private tableService: TableService,
    private chartsService: ChartsService
  ) {}

  ngOnInit(): void {
    this.matchesService.singleModeSub$.subscribe((singleMode) => {
      if (this.singleMode !== singleMode) {
        this.singleMode = singleMode;
      }
    });

    this.statisticsDataSub = combineLatest([
      this.tableService.playerData$,
      this.tableService.teamData$,
      this.matchesService.matchesSub$,
      this.matchesService.singleMatchesSub$,
    ]).subscribe(
      (
        data: [
          [Map<string, ILeaderboard>, Map<string, ILeaderboard>],
          Map<string, ILeaderboard>,
          IMatch[],
          ISingleMatch[]
        ]
      ) => {
        if (data[0]) {
          this.receivedDataP = true;
          this.playerDataAvailable = data[0][0].size > 0;
          this.playerDataAvailableSM = data[0][1].size > 0;
          if (this.playerDataAvailable) {
            this.playersMap = data[0][0];
          }
          if (this.playerDataAvailableSM) {
            this.playersMapSM = data[0][1];
          }
        }
        if (data[1]) {
          this.receivedDataT = true;
          this.teamDataAvailable = data[1].size > 0;
          if (this.teamDataAvailable) {
            this.teamsMap = data[1];
          }
        }
        if (data[2]) {
          this.receivedDataM = true;
          this.matchesDataAvailable = data[2].length > 0;
          if (this.playerDataAvailable && this.matchesDataAvailable) {
            [
              this.playersMap,
              this.selectedPlayerValue,
              this.playersWithMatches,
              this.selectedYearPlayer,
              this.playerYearsList,
              this.matchesChartDataPlayer,
              this.doughnutDataPlayer,
            ] = this.chartsService.createStatisticPlayerData(
              data[2],
              this.playersMap
            );
            this.playersTable = this.getTable(this.playersMap);
            this.playerTableData$.next(this.playersTable);
            this.selectedPlayer = this.selectedPlayerValue.id;
            this.yearDatePlayer = this.getDateFromYear(this.selectedYearPlayer);
          }
          if (this.teamDataAvailable && this.matchesDataAvailable) {
            [
              this.teamsMap,
              this.selectedTeamValue,
              this.teamsWithMatches,
              this.selectedYearTeam,
              this.teamYearsList,
              this.matchesChartDataTeam,
              this.doughnutDataTeam,
            ] = this.chartsService.createStatisticTeamData(
              data[2],
              this.teamsMap
            );
            this.teamsTable = this.getTable(this.teamsMap);
            this.teamsTableData$.next(this.teamsTable);
            this.selectedTeam = this.selectedTeamValue.id;
            this.yearDateTeam = this.getDateFromYear(this.selectedYearTeam);
          }
        }
        if (data[3]) {
          this.receivedDataSM = true;
          this.matchesDataAvailableSM = data[3].length > 0;
          if (this.playerDataAvailableSM && this.matchesDataAvailableSM) {
            [
              this.playersMapSM,
              this.selectedPlayerValueSM,
              this.playersWithMatchesSM,
              this.selectedYearPlayerSM,
              this.playerYearsListSM,
              this.matchesChartDataPlayerSM,
              this.doughnutDataPlayerSM,
            ] = this.chartsService.createStatisticPlayerData(
              data[3],
              this.playersMapSM
            );
            this.playersTableSM = this.getTable(this.playersMapSM);
            this.playerTableDataSM$.next(this.playersTableSM);
            this.selectedPlayerSM = this.selectedPlayerValueSM.id;
            this.yearDatePlayerSM = this.getDateFromYear(
              this.selectedYearPlayerSM
            );
          }
        }
      }
    );
  }

  onSingleModeChange(singleMode: boolean) {
    this.matchesService.singleModeSub$.next(singleMode);
  }

  ngOnDestroy(): void {
    this.statisticsDataSub?.unsubscribe();
    this.singleModeSubscription?.unsubscribe();
  }

  onOptionSelectedEvent(
    val: IPlayers,
    isTeamSelection: boolean,
    forSingleMode: boolean
  ) {
    if (isTeamSelection) {
      this.selectedTeam = val.id;
    } else if (forSingleMode) {
      this.selectedPlayerSM = val.id;
    } else {
      this.selectedPlayer = val.id;
    }

    this.updateYearsList(isTeamSelection, forSingleMode);
  }

  getDateFromYear(year: number) {
    return new Date(year, 0, 1);
  }

  getTable(currentMap: Map<string, ILeaderboard>) {
    const newTable = Array.from(currentMap.values());

    if (newTable.length > 0) {
      newTable.sort((a, b) => b.elo - a.elo);

      let currentElo = newTable[0].elo;
      let lastRank = 1;
      newTable.forEach((entity, index) => {
        if (entity.elo !== currentElo) {
          lastRank = index + 1;
          currentElo = entity.elo;
        }
        entity.rank = lastRank;
      });
    }

    return newTable;
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
      '',
    ];
  }

  updateYearsList(isTeamSelection: boolean, forSingleMode: boolean) {
    if (isTeamSelection) {
      this.teamYearsList = this.chartsService.setYearsList(
        this.selectedTeam,
        this.teamsMap
      );
      if (!this.teamYearsList.includes(this.selectedYearTeam)) {
        this.selectedYearTeam =
          this.teamYearsList[this.teamYearsList.length - 1];
        this.yearDateTeam = this.getDateFromYear(this.selectedYearTeam);
      }
      this.doughnutDataTeam = this.chartsService.getDoughnutData(
        this.teamsMap.get(this.selectedTeam)
      );
      this.matchesChartDataTeam = this.chartsService.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else if (!forSingleMode) {
      this.playerYearsList = this.chartsService.setYearsList(
        this.selectedPlayer,
        this.playersMap
      );
      if (!this.playerYearsList.includes(this.selectedYearPlayer)) {
        this.selectedYearPlayer =
          this.playerYearsList[this.playerYearsList.length - 1];
        this.yearDatePlayer = this.getDateFromYear(this.selectedYearPlayer);
      }
      this.doughnutDataPlayer = this.chartsService.getDoughnutData(
        this.playersMap.get(this.selectedPlayer)
      );
      this.matchesChartDataPlayer = this.chartsService.getMatchesChartData(
        this.playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
    } else {
      this.playerYearsListSM = this.chartsService.setYearsList(
        this.selectedPlayerSM,
        this.playersMapSM
      );
      if (!this.playerYearsListSM.includes(this.selectedYearPlayerSM)) {
        this.selectedYearPlayerSM =
          this.playerYearsListSM[this.playerYearsListSM.length - 1];
        this.yearDatePlayerSM = this.getDateFromYear(this.selectedYearPlayerSM);
      }
      this.doughnutDataPlayerSM = this.chartsService.getDoughnutData(
        this.playersMapSM.get(this.selectedPlayerSM)
      );
      this.matchesChartDataPlayerSM = this.chartsService.getMatchesChartData(
        this.playersMapSM.get(this.selectedPlayerSM),
        this.selectedYearPlayerSM
      );
    }
  }

  updateMatchesData(isTeam: boolean, forSingleMode: boolean, newDate: Date) {
    if (isTeam) {
      this.selectedYearTeam = newDate.getFullYear();
      this.matchesChartDataTeam = this.chartsService.getMatchesChartData(
        this.teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    } else if (!forSingleMode) {
      this.selectedYearPlayer = newDate.getFullYear();
      this.matchesChartDataPlayer = this.chartsService.getMatchesChartData(
        this.playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
    } else {
      this.selectedYearPlayerSM = newDate.getFullYear();
      this.matchesChartDataPlayerSM = this.chartsService.getMatchesChartData(
        this.playersMapSM.get(this.selectedPlayerSM),
        this.selectedYearPlayerSM
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
    } else if (chartId === 5) {
      this.matchesChartReadyT = isReady;
    } else if (chartId === 6) {
      this.barLineChartReadyPSM = isReady;
    } else if (chartId === 7) {
      this.doughnutChartReadyPSM = isReady;
    } else if (chartId === 8) {
      this.matchesChartReadyPSM = isReady;
    }
    this.allChartsReadyP =
      this.barLineChartReadyP &&
      this.doughnutChartReadyP &&
      this.matchesChartReadyP;
    this.allChartsReadyT =
      this.barLineChartReadyT &&
      this.doughnutChartReadyT &&
      this.matchesChartReadyT;
    this.allChartsReadyPSM =
      this.barLineChartReadyPSM &&
      this.doughnutChartReadyPSM &&
      this.matchesChartReadyPSM;
  }
}
