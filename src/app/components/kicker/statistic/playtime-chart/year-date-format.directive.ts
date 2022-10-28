import { Directive } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';

export const Y_FORMATS = {
  parse: {
    dateInput: 'YYYY',
  },
  display: {
    dateInput: 'YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Directive({
  selector: '[appYearDateFormat]',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: Y_FORMATS }],
})
export class YearDateFormatDirective {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
