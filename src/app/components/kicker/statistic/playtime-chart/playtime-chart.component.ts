import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { take } from 'rxjs';
import { MatchesService } from 'src/app/shared/services/matches.service';
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';

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
  legendLabel: string;

  @Input()
  yScaleLabel: string;

  @Input()
  localeId: string;

  @Input()
  datepickerLabelTexts: string[];

  @Input()
  datepickerHintTexts: string[];

  MAX_DIFFERENCE = 720;

  currentDatepickerLabel = '';
  currentDatepickerHint = '';

  today = moment();

  yearMoment = moment();
  monthMoment = moment();
  dayMoment = moment();

  currentMoment = this.yearMoment;

  selectedOption = 'Year';
  selectedYear = this.today.year();
  selectedMonth = this.today.month();
  selectedDay = this.today.date();

  playtimeChartData = new Map<number, number[][][]>();

  public barChartLegend = true;
  public barChartData: ChartConfiguration<'bar'>['data'];

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    maintainAspectRatio: false,
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
          boxWidth: 20,
        },
      },
    },
  };

  allYears: number[] = [];

  waitingForData = true;
  playtimeDataAvailable = false;
  chartIsReady = false;

  maxTime = 0;
  datePickerFormatType = 0;

  panelClass = 'year-picker';

  dayFilter = (_d: Moment | null): boolean => {
    return true;
  };

  yearFilter = (_d: Moment | null): boolean => {
    return true;
  };

  monthFilter = (_d: Moment | null): boolean => {
    return true;
  };

  datePickerFilter = this.yearFilter;

  constructor(private matchesService: MatchesService) {}

  ngOnChanges(): void {
    this.setDatepickerText();
    this.setYScaleTitle();
    if (this.months && this.playtimeDataAvailable && this.legendLabel) {
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
        this.waitingForData = false;
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

            if (difference <= this.MAX_DIFFERENCE) {
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
                  this.playtimeChartData.set(
                    i,
                    this.createEmptyDataStructure(i)
                  );
                }
              }

              while (difference > 0) {
                try {
                  const minutesToAdd = 60 - dataStartMinutes;
                  const currentHour =
                    this.playtimeChartData.get(dataStartYear)[dataStartMonth][
                      dataStartDay
                    ][dataStartHour];
                  if (difference > minutesToAdd) {
                    this.playtimeChartData.get(dataStartYear)[dataStartMonth][
                      dataStartDay
                    ][dataStartHour] = Math.min(60, currentHour + minutesToAdd);
                    difference -= minutesToAdd;
                  } else {
                    this.playtimeChartData.get(dataStartYear)[dataStartMonth][
                      dataStartDay
                    ][dataStartHour] = Math.min(60, currentHour + difference);
                    difference = 0;
                  }
                  dataStartMinutes = 0;
                  if (dataStartHour < 23) {
                    dataStartHour += 1;
                  } else {
                    dataStartHour = 0;
                    if (
                      dataStartDay <
                      this.getDaysInMonth(dataStartYear, dataStartMonth) - 1
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
                } catch (error) {
                  console.log(error);
                  break;
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

          this.datePickerFilter = this.yearFilter;

          this.yearMoment = moment(this.maxTime);
          this.monthMoment = moment(this.maxTime);
          this.dayMoment = moment(this.maxTime);

          this.setChartData(this.getYearData(moment(this.maxTime).year()));

          this.playtimeDataAvailable = true;

          this.selectedYear = moment(this.maxTime).year();
          this.selectedMonth = moment(this.maxTime).month();
          this.selectedDay = moment(this.maxTime).date();
        }
      });
  }

  setYScaleTitle() {
    if (this.yScaleLabel) {
      this.barChartOptions.scales.y.title.text = this.yScaleLabel;
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

  setDateOnInput(normalizedDate: Moment) {
    if (this.datePickerFormatType === 0) {
      this.yearMoment = normalizedDate;
    } else if (this.datePickerFormatType === 1) {
      this.monthMoment = normalizedDate;
    } else {
      this.dayMoment = normalizedDate;
    }
    this.selectedYear = normalizedDate.year();
    this.selectedMonth = normalizedDate.month();
    this.selectedDay = normalizedDate.date();

    this.setChartOnOption(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay
    );
  }

  setDatepickerText() {
    if (this.datepickerLabelTexts) {
      this.currentDatepickerLabel =
        this.datepickerLabelTexts[this.datePickerFormatType];
    }
    if (this.datepickerHintTexts) {
      this.currentDatepickerHint =
        this.datepickerHintTexts[this.datePickerFormatType];
    }
  }

  onChange() {
    if (this.selectedOption === 'Year') {
      this.datePickerFormatType = 0;
      this.datePickerFilter = this.yearFilter;
      this.currentMoment = this.yearMoment;
      this.panelClass = 'year-picker';
    } else if (this.selectedOption === 'Month') {
      this.datePickerFormatType = 1;
      this.datePickerFilter = this.monthFilter;
      this.currentMoment = this.monthMoment;
      this.panelClass = 'year-month-picker';
    } else {
      this.datePickerFormatType = 2;
      this.datePickerFilter = this.dayFilter;
      this.currentMoment = this.dayMoment;
      this.panelClass = 'year-month-day-picker';
    }
    this.setDatepickerText();
    this.selectedYear = this.currentMoment.year();
    this.selectedMonth = this.currentMoment.month();
    this.selectedDay = this.currentMoment.date();
    this.setChartOnOption(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay
    );
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
    return this.playtimeChartData.get(year).map((monthArray) => {
      return monthArray
        .map((item) =>
          item.reduce((accumulator, value) => {
            return accumulator + value;
          }, 0)
        )
        .reduce((accumulator, value) => {
          return accumulator + value;
        }, 0);
    });
  }

  setChartData(chartData: number[]) {
    let labelData;
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
          label: this.legendLabel,
          backgroundColor: ['rgba(51, 133, 255, 0.7)'],
          borderColor: ['rgba(51, 133, 255, 1)'],
          hoverBackgroundColor: ['rgba(51, 133, 255, 1)'],
        },
      ],
    };
    this.chartIsReady = true;
  }
}
