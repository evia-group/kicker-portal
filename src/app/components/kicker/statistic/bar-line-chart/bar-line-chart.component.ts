import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.scss'],
})
export class BarLineChartComponent implements OnInit, OnChanges {
  @Input()
  dataMap: Map<any, any>;

  @Input()
  selectedData: string;

  @Input()
  selectedYear: number;

  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartConfiguration<'bar' | 'line'>['data'];

  public barChartOptions: ChartConfiguration<'bar' | 'line'>['options'] = {
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
          callback: (val) => {
            return val < 0 ? -val : val;
          },
          color: 'rgb(199,199,199)',
        },
        grid: {
          color: 'rgb(89,89,89)',
        },
      },
      qouteAxis: {
        position: 'right',
        ticks: {
          callback: (val) => {
            return val + '%';
          },
          color: 'rgb(199,199,199)',
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(199,199,199)',
        },
      },
      tooltip: {
        callbacks: {
          label: (item) => {
            const val = parseInt(item.formattedValue);
            return (
              item.dataset.label +
              ': ' +
              (val < 0 ? -val : val) +
              (item.dataset.type === 'line' ? '%' : '')
            );
          },
        },
      },
    },
  };

  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  ngOnChanges(): void {
    if (this.dataMap && this.selectedData && this.selectedYear) {
      this.setBarChartData();
    }
  }

  ngOnInit(): void {
    // if (this.dataMap && this.selectedData && this.selectedYear) {
    //   this.setBarChartData();
    // }
  }

  setBarChartData() {
    this.barChartData = {
      labels: this.getLabels(),
      datasets: [
        {
          type: 'bar',
          data: this.getWins(),
          label: 'Wins',
          backgroundColor: ['rgba(70, 203, 29, 0.7)'],
          borderColor: ['rgba(70, 203, 29, 1)'],
          hoverBackgroundColor: ['rgba(70, 203, 29, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'bar',
          data: this.getLosses(),
          label: 'Losses',
          backgroundColor: ['rgba(239, 63, 51, 0.7)'],
          borderColor: ['rgba(239, 63, 51, 1)'],
          hoverBackgroundColor: ['rgba(239, 63, 51, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'line',
          data: this.getWinningQuotes(),
          tension: 0.3,
          label: 'Qoute',
          order: 1,
          yAxisID: 'qouteAxis',
        },
      ],
    };
  }

  getLabels() {
    return this.months;
  }

  getWins() {
    return this.dataMap
      .get(this.selectedData)
      ['winsTimeline'].get(this.selectedYear);
  }

  getLosses() {
    return this.dataMap
      .get(this.selectedData)
      ['lossesTimeline'].get(this.selectedYear)
      .map((num: number) => {
        return -num;
      });
  }

  getWinningQuotes() {
    const winnings = this.dataMap
      .get(this.selectedData)
      ['winsTimeline'].get(this.selectedYear);
    const losses = this.dataMap
      .get(this.selectedData)
      ['lossesTimeline'].get(this.selectedYear);
    const quotes = [];

    for (let i = 0; i < winnings.length; i++) {
      const numOfMatches = winnings[i] + losses[i];
      if (numOfMatches > 0) {
        quotes.push(Math.round((winnings[i] / numOfMatches) * 100));
      } else {
        quotes.push(0);
      }
    }
    return quotes;
  }
}
