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
import { DateFilterFn, MatDatepicker } from '@angular/material/datepicker';
import { DateFormat } from './date-format';
import { de, enUS } from 'date-fns/locale';

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
  formControlDate = new Date();

  @Input()
  localeId = 'de-DE';

  @Input()
  panelClass = '';

  @Input()
  textLabel = '';

  @Input()
  textHint = '';

  @Output()
  newDateEvent = new EventEmitter();

  dateFormControl = new FormControl(this.formControlDate);

  startView: 'month' | 'year' | 'multi-year' = 'month';

  constructor(
    @Inject(MAT_DATE_FORMATS) private config: DateFormat,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit(): void {
    this.updatePicker();
  }

  ngOnChanges() {
    this.updatePicker();
  }

  updatePicker() {
    this.dateAdapter.setLocale(this.localeId === 'de-DE' ? de : enUS);
    this.config.value = this.formatType;
    this.dateFormControl.setValue(this.formControlDate);
    this.dateFormControl.markAllAsTouched();

    this.startView =
      this.formatType === 0
        ? 'multi-year'
        : this.formatType === 1
        ? 'year'
        : 'month';
  }

  emitDate(normalizedDate: Date) {
    if (this.dateFormControl.valid && this.dateFormControl.value) {
      this.dateFormControl.setValue(normalizedDate);
      this.newDateEvent.emit(normalizedDate);
    }
  }

  closeYearPanel(matDatePicker: MatDatepicker<Date>, normalizedDate: Date) {
    if (this.formatType === 0) {
      this.closeAndEmit(matDatePicker, normalizedDate);
    }
  }

  closeMonthPanel(matDatePicker: MatDatepicker<Date>, normalizedDate: Date) {
    if (this.formatType === 1) {
      this.closeAndEmit(matDatePicker, normalizedDate);
    }
  }

  closeAndEmit(matDatePicker: MatDatepicker<Date>, normalizedDate: Date) {
    matDatePicker.close();
    this.emitDate(normalizedDate);
  }
}
