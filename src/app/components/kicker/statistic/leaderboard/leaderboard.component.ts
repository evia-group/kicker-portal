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

  receivedData = false;

  @ViewChild(MatPaginator) set boardPaginator(matPaginator) {
    if (this.boardData && matPaginator) {
      this.boardData.paginator = matPaginator;
    }
  }

  @ViewChild(MatSort) set boardSort(matSort) {
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

  dataAvailable = false;

  ngOnInit(): void {
    try {
      this.dataSubscription = this.dataSubject$.subscribe(
        (tableData: never[]) => {
          this.receivedData = true;
          if (tableData) {
            if (tableData.length > 0) {
              this.dataAvailable = true;
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
