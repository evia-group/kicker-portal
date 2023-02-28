import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ILeaderboard } from 'src/app/shared/interfaces/statistic.interface';
import { Subscription } from 'rxjs';
// import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, AfterViewInit, OnDestroy {
  boardData: MatTableDataSource<ILeaderboard>;

  @Input()
  dataSubject$;

  @Input()
  dataChanged = false;

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

  @ViewChild(MatPaginator) boardPaginator: MatPaginator;
  @ViewChild(MatSort) boardSort: MatSort;

  chartIsReady = false;

  dataSubscription: Subscription;

  ngOnInit(): void {
    try {
      this.dataSubscription = this.dataSubject$.subscribe((data) => {
        this.boardData = new MatTableDataSource(data);
        this.setTable();
      });
    } catch (error) {
      console.log(error);
    }
  }

  ngAfterViewInit(): void {
    this.setTable();
  }

  ngOnDestroy(): void {
    try {
      this.dataSubscription.unsubscribe();
    } catch (error) {
      console.log(error);
    }
  }

  setTable() {
    if (this.boardData) {
      if (this.boardPaginator) {
        this.boardData.paginator = this.boardPaginator;
      }
      if (this.boardSort) {
        this.boardData.sort = this.boardSort;
        const sortState: Sort = {
          active: this.activeColumn,
          direction: this.sortDirection,
        };
        this.boardSort.active = sortState.active;
        this.boardSort.direction = sortState.direction;
        this.boardSort.disableClear = this.disableClear;
        this.boardSort.sortChange.emit(sortState);
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
