import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { FormControl } from '@angular/forms';
import * as _moment from 'moment';

import { default as _rollupMoment, Moment } from 'moment';
import { DateFilterFn, MatDatepicker } from '@angular/material/datepicker';

const moment = _rollupMoment || _moment;

export class DateFormat {
  value = 0;

  get display() {
    let returnValue;
    if (this.value === 0) {
      returnValue = {
        dateInput: 'YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      };
      return returnValue;
    } else if (this.value === 1) {
      returnValue = {
        dateInput: 'MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      };
    } else {
      returnValue = {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      };
    }
    return returnValue;
  }

  get parse() {
    if (this.value === 0) {
      return { dateInput: 'YYYY' };
    } else if (this.value === 1) {
      return {
        dateInput: 'MM/YYYY',
      };
    } else {
      return {
        dateInput: 'DD/MM/YYYY',
      };
    }
  }
}

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useClass: DateFormat }],
})
export class DatepickerComponent implements OnInit, OnChanges {
  @Input()
  formatType = 0;

  @Input()
  dateFilter: DateFilterFn<never>;

  @Input()
  formControlMoment = moment();

  @Output()
  newDateEvent = new EventEmitter();

  dateFormControl = new FormControl(this.formControlMoment);

  startView: 'month' | 'year' | 'multi-year' = 'month';

  panelClass = 'year-picker';

  textIdLabel = '';
  textIdHint = '';

  constructor(@Inject(MAT_DATE_FORMATS) private config: DateFormat) {}

  ngOnInit(): void {
    this.updatePicker();
  }

  ngOnChanges() {
    this.updatePicker();
  }

  updatePicker() {
    this.config.value = this.formatType;
    this.dateFormControl = new FormControl(this.formControlMoment);
    this.dateFormControl.markAllAsTouched();

    this.startView =
      this.formatType === 0
        ? 'multi-year'
        : this.formatType === 1
        ? 'year'
        : 'month';
    this.panelClass =
      this.formatType === 0
        ? 'year-picker'
        : this.formatType === 1
        ? 'year-month-picker'
        : 'year-month-day-picker';
    this.textIdLabel =
      this.formatType === 0
        ? 'stats.year'
        : this.formatType === 1
        ? 'stats.monthYear'
        : 'stats.dayMonthYear';
    this.textIdHint =
      this.formatType === 0
        ? 'stats.yearFormat'
        : this.formatType === 1
        ? 'stats.monthFormat'
        : 'stats.dayFormat';
  }

  emitDate(normalizedDate: any) {
    if (this.dateFormControl.valid && this.dateFormControl.value) {
      const ctrlValue = this.dateFormControl.value;
      ctrlValue.year(normalizedDate.year());
      ctrlValue.month(normalizedDate.month());
      ctrlValue.date(normalizedDate.date());
      this.dateFormControl.setValue(ctrlValue);
      this.newDateEvent.emit(normalizedDate);
    }
  }

  closeYearPanel(matDatePicker: MatDatepicker<any>, normalizedDate: Moment) {
    if (this.formatType === 0) {
      this.closeAndEmit(matDatePicker, normalizedDate);
    }
  }

  closeMonthPanel(matDatePicker: MatDatepicker<any>, normalizedDate: Moment) {
    if (this.formatType === 1) {
      this.closeAndEmit(matDatePicker, normalizedDate);
    }
  }

  closeAndEmit(matDatePicker: MatDatepicker<any>, normalizedDate: Moment) {
    matDatePicker.close();
    this.emitDate(normalizedDate);
  }
}
