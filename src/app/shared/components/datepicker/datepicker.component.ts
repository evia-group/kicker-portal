import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { FormControl } from '@angular/forms';
import * as _moment from 'moment';

import { default as _rollupMoment, Moment } from 'moment';
import { DateFilterFn, MatDatepicker } from '@angular/material/datepicker';
import { DateFormat } from './date-format';

const moment = _rollupMoment || _moment;

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

  @Input()
  localeId = 'de';

  @Input()
  panelClass = '';

  @Input()
  textLabel = '';

  @Input()
  textHint = '';

  @Output()
  newDateEvent = new EventEmitter();

  dateFormControl = new FormControl(this.formControlMoment);

  startView: 'month' | 'year' | 'multi-year' = 'month';

  constructor(
    @Inject(MAT_DATE_FORMATS) private config: DateFormat,
    private dateAdapter: DateAdapter<any>
  ) {}

  ngOnInit(): void {
    this.updatePicker();
  }

  ngOnChanges() {
    this.updatePicker();
  }

  updatePicker() {
    this.dateAdapter.setLocale(this.localeId);
    this.config.value = this.formatType;
    this.dateFormControl = new FormControl(this.formControlMoment);
    this.dateFormControl.markAllAsTouched();

    this.startView =
      this.formatType === 0
        ? 'multi-year'
        : this.formatType === 1
        ? 'year'
        : 'month';
  }

  emitDate(normalizedDate: any) {
    if (this.dateFormControl.valid && this.dateFormControl.value) {
      this.formControlMoment = this.dateFormControl.value;
      this.formControlMoment.year(normalizedDate.year());
      this.formControlMoment.month(normalizedDate.month());
      this.formControlMoment.date(normalizedDate.date());
      this.dateFormControl.setValue(this.formControlMoment);
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
