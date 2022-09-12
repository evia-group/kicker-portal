import { Component, Input, OnInit } from '@angular/core';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-result-doughnut-chart',
  templateUrl: './result-doughnut-chart.component.html',
  styleUrls: ['./result-doughnut-chart.component.scss'],
})
export class ResultDoughnutChartComponent implements OnInit {
  @Input()
  chartData;

  doughnutChartLabels = ['BMW', 'Ford', 'Tesla'];
  doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      { data: [350, 450, 100] },
      { data: [50, 150, 120] },
      { data: [250, 130, 70] },
    ],
  };
  doughnutChartType: ChartType = 'doughnut';

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit(): void {}
}
