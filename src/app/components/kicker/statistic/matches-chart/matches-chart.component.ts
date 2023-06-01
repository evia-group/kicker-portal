import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-matches-chart',
  templateUrl: './matches-chart.component.html',
  styleUrls: ['./matches-chart.component.scss'],
})
export class MatchesChartComponent implements OnChanges {
  @Input()
  chartData: number[];

  @Input()
  months: string[];

  @Input()
  legendLabel: string;

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
          backgroundColor: ['rgba(51, 133, 255, 0.7)'],
          borderColor: ['rgba(51, 133, 255, 1)'],
          hoverBackgroundColor: ['rgba(51, 133, 255, 1)'],
        },
      ],
    };
    this.matchesChartIsReadyEvent.emit(true);
  }
}
