import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { TwoSelectionsDialogComponent } from '../two-selections-dialog/two-selections-dialog.component';
import { ISelectionsData } from '../../../../interfaces/match.interface';

@Component({
  selector: 'app-responsive-selector',
  templateUrl: './responsive-selector.component.html',
  styleUrls: ['./responsive-selector.component.scss'],
})
export class ResponsiveSelectorComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input()
  firstPlayerControl: FormControl;

  @Input()
  secondPlayerControl: FormControl;

  @Input()
  firstPlayerOptions;

  @Input()
  secondPlayerOptions;

  @Input()
  displayWithFunction;

  @Input()
  placeholderText: string;

  @Input()
  labelText: string;

  @Input()
  teamName: string;

  @Input()
  singleMode = false;

  breakpointObserverSubscription: Subscription;

  showButton = false;
  buttonText = 'common.choosePlayers';

  dataSubject = new ReplaySubject<ISelectionsData>(1);

  firstPlayer = '';
  secondPlayer = '';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnChanges(): void {
    if (!this.firstPlayerControl.value && !this.secondPlayerControl.value) {
      this.firstPlayer = '';
      this.secondPlayer = '';
      this.changeButtonText();
    }
    this.dataSubject.next({
      firstPlayerControl: this.firstPlayerControl,
      secondPlayerControl: this.secondPlayerControl,
      firstPlayerOptions: this.firstPlayerOptions,
      secondPlayerOptions: this.secondPlayerOptions,
      displayWithFunction: this.displayWithFunction,
      placeholderText: this.placeholderText,
      labelText: this.labelText,
      teamName: this.teamName,
    });
  }

  ngOnInit(): void {
    this.breakpointObserverSubscription = this.breakpointObserver
      .observe(Breakpoints.XSmall)
      .subscribe((result) => {
        this.showButton = result.matches;
        if (typeof this.firstPlayerControl.value === 'string') {
          this.firstPlayerControl.setValue('');
        }
        if (typeof this.secondPlayerControl.value === 'string') {
          this.secondPlayerControl.setValue('');
        }
        if (!result.matches) {
          this.dialog.closeAll();
        } else {
          this.firstPlayer = this.firstPlayerControl.value
            ? this.firstPlayerControl.value.name
            : '';
          this.secondPlayer = this.secondPlayerControl.value
            ? this.secondPlayerControl.value.name
            : '';
          this.changeButtonText();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.breakpointObserverSubscription) {
      this.breakpointObserverSubscription.unsubscribe();
    }
  }

  changeButtonText() {
    if (this.firstPlayer && this.secondPlayer) {
      this.buttonText = 'common.editPlayers';
    } else {
      this.buttonText = 'common.choosePlayers';
    }
  }

  openDialog() {
    this.dialog.open(TwoSelectionsDialogComponent, {
      data: {
        dataSubject: this.dataSubject,
      },
      autoFocus: false,
      width: '100%',
      disableClose: true,
    });
    this.dialog.afterAllClosed.subscribe(() => {
      if (this.firstPlayerControl.value) {
        this.firstPlayer = this.firstPlayerControl.value.name;
      }
      if (this.secondPlayerControl.value) {
        this.secondPlayer = this.secondPlayerControl.value.name;
      }
      this.changeButtonText();
    });
  }
}
