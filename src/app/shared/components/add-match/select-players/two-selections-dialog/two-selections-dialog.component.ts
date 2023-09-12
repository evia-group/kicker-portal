import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReplaySubject, Subscription } from 'rxjs';
import { ISelectionsData } from '../../../../interfaces/match.interface';

export interface DialogData {
  dataSubject: ReplaySubject<ISelectionsData>;
}

@Component({
  selector: 'app-two-selections-dialog',
  templateUrl: './two-selections-dialog.component.html',
  styleUrls: ['./two-selections-dialog.component.scss'],
})
export class TwoSelectionsDialogComponent implements OnInit, OnDestroy {
  firstPlayerControl = new FormControl();

  secondPlayerControl = new FormControl();

  firstPlayerOptions;

  secondPlayerOptions;

  displayWithFunction;

  placeholderText: string;

  labelText: string;

  subscriptions: Subscription[] = [];

  teamName: string;

  firstPlayerPreviousValue;
  firstPlayerTouched = false;

  secondPlayerPreviousValue;
  secondPlayerTouched = false;

  firstReception = true;

  singleMode = false;

  constructor(
    private dialogRef: MatDialogRef<TwoSelectionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: DialogData
  ) {}

  ngOnInit(): void {
    const clickSubscription = this.dialogRef.backdropClick().subscribe(() => {
      this.closeDialog();
    });
    this.subscriptions.push(clickSubscription);
    const dataSubscription = this.data.dataSubject.subscribe(
      (selectionsData: ISelectionsData) => {
        this.firstPlayerControl = selectionsData.firstPlayerControl;
        this.secondPlayerControl = selectionsData.secondPlayerControl;
        this.firstPlayerOptions = selectionsData.firstPlayerOptions;
        this.secondPlayerOptions = selectionsData.secondPlayerOptions;
        this.displayWithFunction = selectionsData.displayWithFunction;
        this.placeholderText = selectionsData.placeholderText;
        this.labelText = selectionsData.labelText;
        this.teamName = selectionsData.teamName;
        this.singleMode = selectionsData.singleMode;

        if (this.firstReception) {
          this.firstReception = false;
          this.firstPlayerPreviousValue = this.firstPlayerControl.value;
          this.firstPlayerTouched = this.firstPlayerControl.touched;
          if (!this.singleMode) {
            this.secondPlayerPreviousValue = this.secondPlayerControl.value;
            this.secondPlayerTouched = this.secondPlayerControl.touched;
          }
        }
      }
    );
    this.subscriptions.push(dataSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  resetControlValues() {
    if (!this.firstPlayerPreviousValue && !this.firstPlayerTouched) {
      this.firstPlayerControl.reset();
    } else {
      this.firstPlayerControl.setValue(this.firstPlayerPreviousValue);
    }
    if (
      !this.singleMode &&
      !this.secondPlayerPreviousValue &&
      !this.secondPlayerTouched
    ) {
      this.secondPlayerControl.reset();
    } else {
      this.secondPlayerControl.setValue(this.secondPlayerPreviousValue);
    }
  }

  saveTeam() {
    this.dialogRef.close();
  }

  closeDialog() {
    this.resetControlValues();
    this.dialogRef.close();
  }
}
