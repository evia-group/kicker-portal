import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  oneTwo,
  twoOne,
  twoZero,
  zeroTwo,
} from '../../../../shared/global-variables';
import { BaseChartDirective } from 'ng2-charts';
import { chartTheme } from '../../../../shared/chart-theme';

@Component({
  selector: 'app-result-doughnut-chart',
  templateUrl: './result-doughnut-chart.component.html',
  styleUrls: ['./result-doughnut-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BaseChartDirective],
})
export class ResultDoughnutChartComponent implements OnChanges {
  @Input()
  chartData: number[];

  @Input()
  winsLegendLabel: string;

  @Input()
  lossesLegendLabel: string;

  @Input()
  dominationsLegendLabel: string;

  @Input()
  defeatsLegendLabel: string;

  @Input()
  allChartsReady = false;

  showStats = false;
  showWL = false;
  showDD = false;

  doughnutChartLabelsStats = [twoZero, twoOne, oneTwo, zeroTwo];
  doughnutChartDataStats: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabelsStats,
    datasets: [],
  };
  doughnutChartLabelsWL = [];
  doughnutChartDataWL: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabelsWL,
    datasets: [],
  };
  doughnutChartLabelsDD = [];
  doughnutChartDataDD: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabelsDD,
    datasets: [],
  };
  doughnutChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: chartTheme.legend(),
    },
  };

  // Vierstufige Ergebnisskala (2:0, 2:1, 1:2, 0:2). Index 0 ist der klarste
  // Sieg, Index 3 die klarste Niederlage.
  backgroundColors = chartTheme.areas(chartTheme.resultScale);

  hoverColors = chartTheme.resultScale;

  @Output()
  doughnutChartIsReadyEvent = new EventEmitter<boolean>();

  ngOnChanges(): void {
    if (
      this.chartData &&
      this.winsLegendLabel &&
      this.lossesLegendLabel &&
      this.dominationsLegendLabel &&
      this.defeatsLegendLabel
    ) {
      this.doughnutChartLabelsWL = [
        this.winsLegendLabel,
        this.lossesLegendLabel,
      ];
      this.doughnutChartLabelsDD = [
        this.dominationsLegendLabel,
        this.defeatsLegendLabel,
      ];
      this.setDataset();
    }
  }

  sumArray(arr: number[]) {
    return arr.reduce((accumulator, value) => {
      return accumulator + value;
    }, 0);
  }

  setDataset() {
    const statsData = this.chartData.slice(4, 8);
    const sumStats = this.sumArray(statsData);
    if (sumStats > 0) {
      this.showStats = true;
      this.doughnutChartDataStats = {
        labels: this.doughnutChartLabelsStats,
        datasets: [
          {
            data: statsData,
            backgroundColor: this.backgroundColors,
            hoverBackgroundColor: this.hoverColors,
            hoverBorderColor: this.hoverColors,
          },
        ],
      };
    } else {
      this.showStats = false;
    }
    const WLData = this.chartData.slice(0, 2);
    const sumWL = this.sumArray(WLData);
    if (sumWL > 0) {
      this.showWL = true;
      this.doughnutChartDataWL = {
        labels: this.doughnutChartLabelsWL,
        datasets: [
          {
            data: WLData,
            backgroundColor: [
              this.backgroundColors[0],
              this.backgroundColors[3],
            ],
            hoverBackgroundColor: [this.hoverColors[0], this.hoverColors[3]],
            hoverBorderColor: [this.hoverColors[0], this.hoverColors[3]],
          },
        ],
      };
    } else {
      this.showWL = false;
    }
    const DDData = this.chartData.slice(2, 4);
    const sumDD = this.sumArray(DDData);
    if (sumDD > 0) {
      this.showDD = true;
      this.doughnutChartDataDD = {
        labels: this.doughnutChartLabelsDD,
        datasets: [
          {
            data: DDData,
            backgroundColor: [
              this.backgroundColors[0],
              this.backgroundColors[3],
            ],
            hoverBackgroundColor: [this.hoverColors[0], this.hoverColors[3]],
            hoverBorderColor: [this.hoverColors[0], this.hoverColors[3]],
          },
        ],
      };
    } else {
      this.showDD = false;
    }
    this.doughnutChartIsReadyEvent.emit(true);
  }
}
