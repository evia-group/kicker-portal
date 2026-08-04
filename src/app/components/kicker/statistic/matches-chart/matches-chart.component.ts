import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { chartTheme } from '../../../../shared/chart-theme';

@Component({
  selector: 'app-matches-chart',
  templateUrl: './matches-chart.component.html',
  styleUrls: ['./matches-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BaseChartDirective],
})
export class MatchesChartComponent implements OnChanges {
  @Input()
  chartData: number[];

  @Input()
  months: string[];

  @Input()
  legendLabel: string;

  @Input()
  allChartsReady = false;

  public barChartLegend = true;
  public barChartData: ChartConfiguration<'bar'>['data'];

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
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
          color: chartTheme.tickColor,
          precision: 0,
        },
        grid: {
          color: chartTheme.gridColor,
        },
      },
    },
    plugins: {
      legend: chartTheme.legend(),
    },
  };

  @Output()
  matchesChartIsReadyEvent = new EventEmitter<boolean>();

  ngOnChanges(): void {
    if (this.chartData && this.months && this.legendLabel) {
      this.setChartData();
    }
  }

  setChartData() {
    this.barChartData = {
      labels: this.months,
      datasets: [
        {
          type: 'bar',
          data: this.chartData,
          label: this.legendLabel,
          backgroundColor: [chartTheme.area(chartTheme.neutral)],
          borderColor: [chartTheme.neutral],
          hoverBackgroundColor: [chartTheme.neutral],
        },
      ],
    };
    this.matchesChartIsReadyEvent.emit(true);
  }
}
