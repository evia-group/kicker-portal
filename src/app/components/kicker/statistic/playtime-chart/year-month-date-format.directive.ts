import { Directive } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Directive({
  selector: '[appYearMonthDateFormat]',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }],
})
export class YearMonthDateFormatDirective {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
