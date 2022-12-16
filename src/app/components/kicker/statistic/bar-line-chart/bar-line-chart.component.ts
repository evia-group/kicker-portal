import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { ILeaderboard } from 'src/app/shared/interfaces/statistic.interface';

@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.scss'],
})
export class BarLineChartComponent implements OnChanges {
  @Input()
  dataMap: Map<string, ILeaderboard>;

  @Input()
  selectedData: string;

  @Input()
  selectedYear: number;

  @Input()
  months: string[];

  @Input()
  legendLabels: string[];

  @Output()
  barLineChartIsReadyEvent = new EventEmitter<boolean>();

  public barChartLegend = true;
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
          precision: 0,
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

  ngOnChanges(): void {
    if (
      this.dataMap &&
      this.selectedData &&
      this.selectedYear &&
      this.months &&
      this.legendLabels
    ) {
      this.setBarChartData();
    }
  }

  setBarChartData() {
    this.barChartData = {
      labels: this.months,
      datasets: [
        {
          type: 'bar',
          data: this.getWins(),
          label: this.legendLabels[0],
          backgroundColor: ['rgba(40, 164, 40, 0.7)'],
          borderColor: ['rgba(40, 164, 40, 1)'],
          hoverBackgroundColor: ['rgba(40, 164, 40, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'bar',
          data: this.getLosses(),
          label: this.legendLabels[1],
          backgroundColor: ['rgba(255, 51, 51, 0.7)'],
          borderColor: ['rgba(255, 51, 51, 1)'],
          hoverBackgroundColor: ['rgba(255, 51, 51, 1)'],
          stack: 'a',
          order: 2,
        },
        {
          type: 'line',
          data: this.getWinningQuotes(),
          tension: 0.3,
          label: this.legendLabels[4],
          backgroundColor: ['rgba(248, 209, 99, 1)'],
          borderColor: ['rgba(248, 209, 99, 1)'],
          hoverBackgroundColor: ['rgba(248, 209, 99, 1)'],
          order: 1,
          yAxisID: 'qouteAxis',
        },
      ],
    };
    this.barLineChartIsReadyEvent.emit(true);
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
