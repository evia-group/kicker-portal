export class DateFormat {
  value = 0;

  get display() {
    return {
      dateInput: this.getDateFormat(),
      monthYearLabel: 'MMM yyyy',
      dateA11yLabel: 'PPP',
      monthYearA11yLabel: 'MMMM yyyy',
    };
  }

  get parse() {
    return { dateInput: this.getDateFormat() };
  }

  getDateFormat() {
    return this.value === 0
      ? 'yyyy'
      : this.value === 1
      ? 'MM/yyyy'
      : 'dd/MM/yyyy';
  }
}
