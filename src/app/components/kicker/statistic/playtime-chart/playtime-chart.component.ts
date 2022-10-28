import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { take } from 'rxjs';
import { MatchesService } from 'src/app/shared/services/matches.service';
import { MatDatepicker } from '@angular/material/datepicker';
import * as _moment from 'moment';

import { default as _rollupMoment, Moment } from 'moment';
import { DateAdapter } from '@angular/material/core';

const moment = _rollupMoment || _moment;

@Component({
  selector: 'app-playtime-chart',
  templateUrl: './playtime-chart.component.html',
  styleUrls: ['./playtime-chart.component.scss'],
})
export class PlaytimeChartComponent implements OnInit, OnChanges {
  @Input()
  months: string[];

  @Input()
  legendLabels: string[];

  @Input()
  localeId: string;

  today = moment();

  yearDate = new FormControl(this.today);
  monthDate = new FormControl(this.today);
  dayDate = new FormControl(this.today);

  selectedOption = 'Year';
  selectedYear = this.today.year();
  selectedMonth = this.today.month();
  selectedDay = this.today.date();

  playtimeChartData = new Map<number, number[][][]>();

  public barChartLegend = true;
  public barChartData: ChartConfiguration<'bar'>['data'];

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          color: 'rgb(199,199,199)',
        },
        grid: {
          color: 'rgb(89,89,89)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(199,199,199)',
          precision: 0,
        },
        grid: {
          color: 'rgb(89,89,89)',
        },
        title: {
          display: true,
          text: '',
          color: 'rgb(199,199,199)',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(199,199,199)',
        },
      },
    },
  };

  allYears: number[] = [];

  playtimeDataAvailable = false;
  chartIsReady = false;

  maxTime = 0;

  dayFilter = (_d: Moment | null): boolean => {
    return true;
  };

  yearFilter = (_d: Moment | null): boolean => {
    return true;
  };

  monthFilter = (_d: Moment | null): boolean => {
    return true;
  };

  constructor(
    private matchesService: MatchesService,
    private _adapter: DateAdapter<any>
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.setLocaleId();
    this.setYScaleTitle();
    if (this.months && this.playtimeDataAvailable) {
      this.setChartOnOption(
        this.selectedYear,
        this.selectedMonth,
        this.selectedDay
      );
    }
  }

  ngOnInit(): void {
    this.matchesService.playtime$
      .pipe(take(1))
      .subscribe((playtimeData: [{ startTime: string; endTime: string }]) => {
        if (playtimeData.length > 0) {
          const playtimeNumData = playtimeData.map((item) => {
            return {
              startTime: Number(item.startTime) * 1000,
              endTime: Number(item.endTime) * 1000,
            };
          });
          playtimeNumData.forEach((item) => {
            let startTime = item.startTime;
            const endTime = item.endTime;
            this.maxTime = this.maxTime < endTime ? endTime : this.maxTime;
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            let difference = Math.round((endTime - startTime) / 1000 / 60);
            const dataEndYear = endDate.getFullYear();
            const dataStartSeconds = startDate.getSeconds();

            let dateForCalc: Date;
            if (dataStartSeconds >= 30) {
              startTime += (60 - dataStartSeconds) * 1000;
              dateForCalc = new Date(startTime);
            } else {
              dateForCalc = startDate;
            }

            let dataStartYear = dateForCalc.getFullYear();
            let dataStartMonth = dateForCalc.getMonth();
            let dataStartDay = dateForCalc.getDate() - 1;
            let dataStartHour = dateForCalc.getHours();
            let dataStartMinutes = dateForCalc.getMinutes();

            for (let i = dataStartYear; i <= dataEndYear; i++) {
              if (!this.playtimeChartData.get(i)) {
                this.playtimeChartData.set(i, this.createEmptyDataStructure(i));
              }
            }

            while (difference > 0) {
              const minutesToAdd = 60 - dataStartMinutes;
              if (difference > minutesToAdd) {
                this.playtimeChartData.get(dataStartYear)[dataStartMonth][
                  dataStartDay
                ][dataStartHour] += minutesToAdd;
                difference -= minutesToAdd;
              } else {
                this.playtimeChartData.get(dataStartYear)[dataStartMonth][
                  dataStartDay
                ][dataStartHour] += difference;
                difference = 0;
              }
              dataStartMinutes = 0;
              if (dataStartHour < 23) {
                dataStartHour += 1;
              } else {
                dataStartHour = 0;
                if (
                  dataStartDay <
                  this.getDaysInMonth(dataStartYear, dataStartMonth)
                ) {
                  dataStartDay += 1;
                } else {
                  dataStartDay = 0;
                  if (dataStartMonth < 11) {
                    dataStartMonth += 1;
                  } else {
                    dataStartMonth = 0;
                    dataStartYear += 1;
                  }
                }
              }
            }
          });
          this.allYears = Array.from(this.playtimeChartData.keys());
          this.yearFilter = (d: Moment | null): boolean => {
            const year = (d || moment()).year();
            return this.allYears.includes(year);
          };
          this.monthFilter = (d: Moment | null): boolean => {
            const year = (d || moment()).year();
            if (!this.allYears.includes(year)) {
              return false;
            } else {
              const month = (d || moment()).month();
              return this.getYearData(year)[month] > 0;
            }
          };
          this.dayFilter = (d: Moment | null): boolean => {
            const year = (d || moment()).year();
            if (!this.allYears.includes(year)) {
              return false;
            } else {
              const month = (d || moment()).month();
              const day = (d || moment()).date() - 1;
              return this.getMonthData(year, month)[day] > 0;
            }
          };

          this.yearDate = new FormControl(moment(this.maxTime));
          this.monthDate = new FormControl(moment(this.maxTime));
          this.dayDate = new FormControl(moment(this.maxTime));

          this.setChartData(this.getYearData(moment(this.maxTime).year()));
          this.yearDate.markAllAsTouched();
          this.monthDate.markAllAsTouched();
          this.dayDate.markAllAsTouched();
          this.playtimeDataAvailable = true;
        }
      });
  }

  setYScaleTitle() {
    if (this.legendLabels) {
      this.barChartOptions.scales.y.title.text = this.legendLabels[7];
    }
  }

  setLocaleId() {
    if (this.localeId) {
      this._adapter.setLocale(this.localeId);
    }
  }

  setChartOnOption(
    selectedYear: number,
    selectedMonth: number,
    selectedDay: number
  ) {
    if (this.selectedOption === 'Year') {
      const yearData = this.getYearData(selectedYear);
      this.setChartData(yearData);
    } else if (this.selectedOption === 'Month') {
      const monthData = this.getMonthData(selectedYear, selectedMonth);
      this.setChartData(monthData);
    } else {
      this.setChartData(
        this.playtimeChartData.get(selectedYear)[selectedMonth][selectedDay - 1]
      );
    }
  }

  setDateOnInput(
    normalizedMonthAndYear: Moment,
    datepicker?: MatDatepicker<Moment>
  ) {
    const date = this.getForm();
    const ctrlValue = date.value;
    if (ctrlValue && date.valid) {
      this.selectedYear = normalizedMonthAndYear.year();
      this.selectedMonth = normalizedMonthAndYear.month();
      this.selectedDay = normalizedMonthAndYear.date();
      ctrlValue.year(this.selectedYear);
      ctrlValue.month(this.selectedMonth);
      ctrlValue.date(this.selectedDay);
      date.setValue(ctrlValue);
      this.setChartOnOption(
        this.selectedYear,
        this.selectedMonth,
        this.selectedDay
      );
    }
    if (datepicker) {
      datepicker.close();
    }
  }

  onChange() {
    const date = this.getForm();
    const ctrlValue = date.value;
    this.selectedYear = ctrlValue.year();
    this.selectedMonth = ctrlValue.month();
    this.selectedDay = ctrlValue.date();
    this.setChartOnOption(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay
    );
  }

  getForm(): FormControl {
    let date: FormControl;
    if (this.selectedOption === 'Year') {
      date = this.yearDate;
    } else if (this.selectedOption === 'Month') {
      date = this.monthDate;
    } else {
      date = this.dayDate;
    }
    return date;
  }

  createEmptyDataStructure(year: number) {
    const dataStructure = [];
    for (let i = 0; i < 12; i++) {
      const daysInMonth = this.getDaysInMonth(year, i);
      const daysArray = new Array(daysInMonth);
      for (let j = 0; j < daysInMonth; j++) {
        const hoursArray = new Array(24);
        for (let k = 0; k < 24; k++) {
          hoursArray[k] = 0;
        }
        daysArray[j] = hoursArray;
      }
      dataStructure[i] = daysArray;
    }
    return dataStructure;
  }

  getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  getMonthData(year: number, month: number) {
    return this.playtimeChartData.get(year)[month].map((item: number[]) =>
      item.reduce((accumulator, value) => {
        return accumulator + value;
      }, 0)
    );
  }

  getYearData(year: number) {
    const data = this.playtimeChartData.get(year).map((monthArray) => {
      const monthArraySum = monthArray
        .map((item) =>
          item.reduce((accumulator, value) => {
            return accumulator + value;
          }, 0)
        )
        .reduce((accumulator, value) => {
          return accumulator + value;
        }, 0);
      return monthArraySum;
    });
    return data;
  }

  setChartData(chartData: number[]) {
    let labelData = [];
    if (this.selectedOption === 'Day') {
      labelData = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23,
      ];
    } else if (this.selectedOption === 'Month') {
      labelData = Array.from({ length: chartData.length }, (_, i) => i + 1);
    } else {
      labelData = this.months;
    }
    this.barChartData = {
      labels: labelData,
      datasets: [
        {
          type: 'bar',
          data: chartData,
          label: this.legendLabels[6],
          backgroundColor: ['rgba(51, 133, 255, 0.7)'],
          borderColor: ['rgba(51, 133, 255, 1)'],
          hoverBackgroundColor: ['rgba(51, 133, 255, 1)'],
        },
      ],
    };
    this.chartIsReady = true;
  }
}
