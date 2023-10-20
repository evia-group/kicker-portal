import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  boardData = new MatTableDataSource();

  @Input()
  dataSubject$;

  @Input()
  displayedColumnsText: string[];

  @Input()
  displayedColumns: string[];

  @Input()
  activeColumn: string;

  @Input()
  sortDirection: SortDirection;

  @Input()
  disableClear: boolean;

  @Input()
  filterHintText = '';

  @Input()
  filterText = '';

  @Input()
  pageSizeOptions = [];

  @ViewChild(MatPaginator) set boardPaginator(matPaginator: MatPaginator) {
    if (this.boardData && matPaginator) {
      this.boardData.paginator = matPaginator;
    }
  }

  @ViewChild(MatSort) set boardSort(matSort: MatSort) {
    if (this.boardData && matSort) {
      this.boardData.sort = matSort;
      const sortState: Sort = {
        active: this.activeColumn,
        direction: this.sortDirection,
      };
      matSort.active = sortState.active;
      matSort.direction = sortState.direction;
      matSort.disableClear = this.disableClear;
      matSort.sortChange.emit(sortState);
    }
  }

  dataSubscription: Subscription;

  ngOnInit(): void {
    try {
      this.dataSubscription = this.dataSubject$.subscribe(
        (tableData: never[]) => {
          if (tableData) {
            if (tableData.length > 0) {
              this.boardData.data = tableData;
            }
          }
        },
        (err) => console.log(err)
      );
    } catch (error) {
      console.log(error);
    }
  }

  ngOnDestroy(): void {
    try {
      this.dataSubscription.unsubscribe();
    } catch (error) {
      console.log(error);
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
