import { Directive } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';

export const DMY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Directive({
  selector: '[appYearMonthDayDateFormat]',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DMY_FORMATS }],
})
export class YearMonthDayDateFormatDirective {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
