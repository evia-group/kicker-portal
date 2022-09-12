import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnChanges {
  @Input()
  boardData: MatTableDataSource<any>;

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
    'elo',
  ];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  ngOnChanges(): void {
    if (this.boardData) {
      this.boardData.paginator = this.boardPaginator;
      this.boardData.sort = this.boardSort;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.boardData) {
      this.boardData.paginator = this.boardPaginator;
      this.boardData.sort = this.boardSort;
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
