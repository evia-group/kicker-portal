import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  zeroTwo,
  oneTwo,
  twoOne,
  twoZero,
} from '../../../../shared/global-variables';

@Component({
  selector: 'app-result-doughnut-chart',
  templateUrl: './result-doughnut-chart.component.html',
  styleUrls: ['./result-doughnut-chart.component.scss'],
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
  // doughnutChartType: ChartType = 'doughnut';
  doughnutChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(199,199,199)',
          boxWidth: 20,
        },
      },
    },
  };

  backgroundColors = [
    'rgba(40, 164, 40, 0.7)',
    'rgba(153, 215, 91, 0.7)',
    'rgba(255, 129, 87, 0.7)',
    'rgba(255, 51, 51, 0.7)',
  ];

  hoverColors = [
    'rgba(40, 164, 40, 1)',
    'rgba(153, 215, 91, 1)',
    'rgba(255, 129, 87, 1)',
    'rgba(255, 51, 51, 1)',
  ];

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
    const sum = arr.reduce((accumulator, value) => {
      return accumulator + value;
    }, 0);
    return sum;
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
