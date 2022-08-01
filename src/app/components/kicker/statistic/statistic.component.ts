import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ITeam, IUser } from 'src/app/shared/interfaces/user.interface';
import { TeamsService } from 'src/app/shared/services/teams.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit, AfterViewInit {
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

  @ViewChild('playersPaginator') playersPaginator: MatPaginator;
  @ViewChild('teamsPaginator') teamsPaginator: MatPaginator;

  @ViewChild('playersBoard') playersSort: MatSort;
  @ViewChild('teamsBoard') teamsSort: MatSort;

  players;

  teams;

  displayedColumns: string[] = [
    'name',
    'wins',
    'losses',
    'dominations',
    'defeats',
    '2:0',
    '2:1',
    '0:2',
    '1:2',
    'totalMatches',
  ];

  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['2006', '2007', '2008', '2009', '2010', '2011', '2012'],
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
      { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' },
    ],
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: false,
  };

  constructor(
    private breakpointObserver: BreakpointObserver,
    private usersService: UsersService,
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    const playersTable = [];
    this.usersService.users$.pipe(take(1)).subscribe((players: IUser[]) => {
      players.map((player: IUser) => {
        playersTable.push(this.createTableData(player));
      });
      this.players = new MatTableDataSource(playersTable);
    });
    const teamsTable = [];
    this.teamsService.teams$.pipe(take(1)).subscribe((teams: ITeam[]) => {
      teams.map((team) => {
        teamsTable.push(this.createTableData(team));
      });
      this.teams = new MatTableDataSource(teamsTable);
    });
  }

  ngAfterViewInit(): void {
    this.players.paginator = this.playersPaginator;
    this.players.sort = this.playersSort;
    this.teams.paginator = this.teamsPaginator;
    this.teams.sort = this.teamsSort;
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

    return newData;
  }

  applyFilter(event: Event, id: number) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (id === 0) {
      this.players.filter = filterValue.trim().toLowerCase();

      if (this.players.paginator) {
        this.players.paginator.firstPage();
      }
    } else {
      this.teams.filter = filterValue.trim().toLowerCase();

      if (this.teams.paginator) {
        this.teams.paginator.firstPage();
      }
    }
  }
}
