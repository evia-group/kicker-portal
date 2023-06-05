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
