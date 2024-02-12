import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
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
  firstPlayerControl: UntypedFormControl;

  @Input()
  secondPlayerControl: UntypedFormControl;

  @Input()
  firstPlayerOptions: any;

  @Input()
  secondPlayerOptions: any;

  @Input()
  displayWithFunction: any;

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
  buttonText = '';

  dataSubject = new ReplaySubject<ISelectionsData>(1);

  firstPlayer = '';
  secondPlayer = '';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnChanges(): void {
    if (!this.singleMode) {
      if (!this.firstPlayerControl.value && !this.secondPlayerControl.value) {
        this.firstPlayer = '';
        this.secondPlayer = '';
        this.changeButtonText();
      }
    } else {
      if (!this.firstPlayerControl.value) {
        this.firstPlayer = '';
        this.changeButtonText();
      }
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
      singleMode: this.singleMode,
    });
  }

  ngOnInit(): void {
    this.buttonText = this.singleMode
      ? 'common.choosePlayer'
      : 'common.choosePlayers';
    this.breakpointObserverSubscription = this.breakpointObserver
      .observe(Breakpoints.XSmall)
      .subscribe((result) => {
        this.showButton = result.matches;
        if (typeof this.firstPlayerControl.value === 'string') {
          this.firstPlayerControl.setValue('');
        }
        if (
          !this.singleMode &&
          typeof this.secondPlayerControl.value === 'string'
        ) {
          this.secondPlayerControl.setValue('');
        }
        if (!result.matches) {
          this.dialog.closeAll();
        } else {
          this.firstPlayer = this.firstPlayerControl.value
            ? this.firstPlayerControl.value.name
            : '';
          if (!this.singleMode) {
            this.secondPlayer = this.secondPlayerControl.value
              ? this.secondPlayerControl.value.name
              : '';
          }
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
    if (!this.singleMode && this.firstPlayer && this.secondPlayer) {
      this.buttonText = 'common.editPlayers';
    } else if (this.singleMode && this.firstPlayer) {
      this.buttonText = 'common.editPlayer';
    } else {
      this.buttonText = this.singleMode
        ? 'common.choosePlayer'
        : 'common.choosePlayers';
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
      if (!this.singleMode && this.secondPlayerControl.value) {
        this.secondPlayer = this.secondPlayerControl.value.name;
      }
      this.changeButtonText();
    });
  }

  remove(id: number) {
    console.log(id);
  }
}
