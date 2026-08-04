import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { ILeaderboard } from '../../../../shared/interfaces/statistic.interface';
import {
  lossesTimeline,
  winsTimeline,
} from '../../../../shared/global-variables';
import { BaseChartDirective } from 'ng2-charts';
import { chartTheme } from '../../../../shared/chart-theme';

@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BaseChartDirective],
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
  topBarLegendLabel: string;

  @Input()
  lowerBarLegendLabel: string;

  @Input()
  lineLegendLabel: string;

  @Input()
  allChartsReady = false;

  @Output()
  barLineChartIsReadyEvent = new EventEmitter<boolean>();

  public barChartLegend = true;
  public barChartData: ChartConfiguration<'bar' | 'line'>['data'];

  public barChartOptions: ChartConfiguration<'bar' | 'line'>['options'] = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        ticks: {
          color: chartTheme.tickColor,
        },
        grid: {
          color: chartTheme.gridColor,
        },
      },
      y: {
        ticks: {
          callback: (val) => {
            const numVal = Number(val);
            return numVal < 0 ? -numVal : numVal;
          },
          color: chartTheme.tickColor,
          precision: 0,
        },
        grid: {
          color: chartTheme.gridColor,
        },
      },
      qouteAxis: {
        position: 'right',
        ticks: {
          callback: (val) => {
            return val + '%';
          },
          color: chartTheme.tickColor,
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: chartTheme.legend(),
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
      this.topBarLegendLabel &&
      this.lowerBarLegendLabel &&
      this.lineLegendLabel
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
          label: this.topBarLegendLabel,
          backgroundColor: [chartTheme.area(chartTheme.positive)],
          borderColor: [chartTheme.positive],
          hoverBackgroundColor: [chartTheme.positive],
          stack: 'a',
          order: 2,
        },
        {
          type: 'bar',
          data: this.getLosses(),
          label: this.lowerBarLegendLabel,
          backgroundColor: [chartTheme.area(chartTheme.negative)],
          borderColor: [chartTheme.negative],
          hoverBackgroundColor: [chartTheme.negative],
          stack: 'a',
          order: 2,
        },
        {
          type: 'line',
          data: this.getWinningQuotes(),
          tension: 0.3,
          label: this.lineLegendLabel,
          backgroundColor: [chartTheme.emphasis],
          borderColor: [chartTheme.emphasis],
          hoverBackgroundColor: [chartTheme.emphasis],
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
      [winsTimeline].get(this.selectedYear);
  }

  getLosses() {
    return this.dataMap
      .get(this.selectedData)
      [lossesTimeline].get(this.selectedYear)
      .map((num: number) => {
        return -num;
      });
  }

  getWinningQuotes() {
    const winnings = this.dataMap
      .get(this.selectedData)
      [winsTimeline].get(this.selectedYear);
    const losses = this.dataMap
      .get(this.selectedData)
      [lossesTimeline].get(this.selectedYear);
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
