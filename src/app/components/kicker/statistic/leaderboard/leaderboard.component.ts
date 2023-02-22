import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ILeaderboard } from 'src/app/shared/interfaces/statistic.interface';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  boardData: MatTableDataSource<ILeaderboard>;

  @Input()
  showingTeams = false;

  @Input()
  secondColumn: string;

  @ViewChild(MatPaginator) boardPaginator: MatPaginator;
  @ViewChild(MatSort) boardSort: MatSort;

  displayedColumns: string[] = [
    'rank',
    'name',
    'wins',
    'losses',
    'diff',
    'dominations',
    'defeats',
    '2:0',
    '2:1',
    '0:2',
    '1:2',
    'totalMatches',
  ];

  leaderboardSub: Subscription;

  chartIsReady = false;

  constructor(private matchesService: MatchesService) {}

  ngOnInit(): void {
    this.leaderboardSub = this.matchesService.leaderboardData$.subscribe(
      (data: [boolean, ILeaderboard[]]) => {
        const dataForTeams = data[0];
        const receivedBoardData = data[1];
        if (this.showingTeams === dataForTeams) {
          if (receivedBoardData.length > 0) {
            this.boardData = new MatTableDataSource(receivedBoardData);
            this.setTable();
          }
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.setTable();
  }

  ngOnDestroy(): void {
    this.leaderboardSub.unsubscribe();
  }

  setTable() {
    if (this.boardData) {
      if (this.boardPaginator) {
        this.boardData.paginator = this.boardPaginator;
      }
      if (this.boardSort) {
        this.boardSort.sort({ id: 'rank', start: 'asc' } as MatSortable);
        this.boardData.sort = this.boardSort;
      }
      this.chartIsReady = true;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.boardData.filter = filterValue.trim().toLowerCase();

    if (this.boardData.paginator) {
      this.boardData.paginator.firstPage();
    }
  }
}
