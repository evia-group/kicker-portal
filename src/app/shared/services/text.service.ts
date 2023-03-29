import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TextService {
  textData$ = new BehaviorSubject([]);

  constructor(private translateService: TranslateService) {
    this.getText();
    this.translateService.onLangChange.subscribe((_event: LangChangeEvent) => {
      this.getText();
    });
  }

  getText() {
    this.translateService
      .get(['months', 'stats', 'app', 'common'])
      .pipe(take(1))
      .subscribe((res) => {
        const months = [
          res.months.jan,
          res.months.feb,
          res.months.mar,
          res.months.apr,
          res.months.may,
          res.months.jun,
          res.months.jul,
          res.months.aug,
          res.months.sep,
          res.months.oct,
          res.months.nov,
          res.months.dec,
        ];

        const legendLabels = [
          res.stats.wins,
          res.stats.losses,
          res.stats.dominations,
          res.stats.defeats,
          res.stats.winRate,
          res.app.matches,
          res.stats.playtimeLegend,
          res.stats.minutes,
        ];

        const displayedColumnsTextPlayer = [
          res.stats.rank,
          res.common.player,
          res.stats.wins,
          res.stats.losses,
          res.stats.difference,
          res.stats.dominations,
          res.stats.defeats,
          '2:0',
          '2:1',
          '1:2',
          '0:2',
          res.app.matches,
        ];

        const displayedColumnsTextTeam = [
          res.stats.rank,
          res.common.team,
          res.stats.wins,
          res.stats.losses,
          res.stats.difference,
          res.stats.dominations,
          res.stats.defeats,
          '2:0',
          '2:1',
          '1:2',
          '0:2',
          res.app.matches,
        ];

        const filterText = res.stats.filter;
        const filterHintText = res.stats.filterHint;

        const localeId = res.app.language.id;

        const datepickerLabelTexts = [
          res.stats.year,
          res.stats.monthYear,
          res.stats.dayMonthYear,
        ];

        const datepickerHintTexts = [
          res.stats.yearFormat,
          res.stats.monthFormat,
          res.stats.dayFormat,
        ];

        this.textData$.next([
          months,
          legendLabels,
          displayedColumnsTextPlayer,
          displayedColumnsTextTeam,
          filterText,
          filterHintText,
          localeId,
          datepickerLabelTexts,
          datepickerHintTexts,
        ]);
      });
  }
}
