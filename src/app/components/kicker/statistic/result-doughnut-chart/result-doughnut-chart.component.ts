import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { chartTheme } from '../../../../shared/chart-theme';
import { resultKeys } from '../../../../shared/game-rules';

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

  /**
   * Rundenzahl, mit der die Spielart entschieden ist. Bestimmt, wie viele
   * Ergebnisse es gibt: vier beim Kicker (roundsToWin 2), sechs beim Dart.
   * Standard 2, damit bestehende Aufrufer ohne Angabe unveraendert bleiben.
   */
  @Input()
  roundsToWin = 2;

  showStats = false;
  showWL = false;
  showDD = false;

  doughnutChartLabelsStats: string[] = resultKeys(2);
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

  /** Ergebnisskala als Verlauf. Index 0 ist der klarste Sieg, der letzte Index
   *  die klarste Niederlage. Laenge folgt der Spielart. */
  backgroundColors: string[] = [];

  hoverColors: string[] = [];

  @Output()
  doughnutChartIsReadyEvent = new EventEmitter<boolean>();

  ngOnChanges(): void {
    this.doughnutChartLabelsStats = resultKeys(this.roundsToWin);
    this.hoverColors = chartTheme.resultScale(this.roundsToWin);
    this.backgroundColors = chartTheme.areas(this.hoverColors);

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
    // Sieg und Niederlage, also die Enden des Verlaufs. Vorher stand hier der
    // feste Index 3, der nur bei vier Ergebnissen die klarste Niederlage traf.
    const best = 0;
    const worst = this.hoverColors.length - 1;

    // Ab Index 4 stehen die Einzelergebnisse. Wie viele es sind, haengt an der
    // Spielart, deshalb ohne obere Grenze (vorher `slice(4, 8)`).
    const statsData = this.chartData.slice(4);
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
              this.backgroundColors[best],
              this.backgroundColors[worst],
            ],
            hoverBackgroundColor: [
              this.hoverColors[best],
              this.hoverColors[worst],
            ],
            hoverBorderColor: [this.hoverColors[best], this.hoverColors[worst]],
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
              this.backgroundColors[best],
              this.backgroundColors[worst],
            ],
            hoverBackgroundColor: [
              this.hoverColors[best],
              this.hoverColors[worst],
            ],
            hoverBorderColor: [this.hoverColors[best], this.hoverColors[worst]],
          },
        ],
      };
    } else {
      this.showDD = false;
    }
    this.doughnutChartIsReadyEvent.emit(true);
  }
}
