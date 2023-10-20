import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MatPaginatorIntlService
  extends MatPaginatorIntl
  implements OnDestroy
{
  translateSub: Subscription;

  constructor(private translateService: TranslateService) {
    super();

    this.translateSub = this.translateService.onLangChange.subscribe(
      (_event: Event) => {
        this.translateLabels();
      }
    );

    this.translateLabels();
  }

  ngOnDestroy(): void {
    this.translateSub.unsubscribe();
  }

  getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const of = this.translateService
      ? this.translateService.instant('MAT_PAGINATOR.OF')
      : 'of';
    if (length === 0 || pageSize === 0) {
      return '0 ' + of + ' ' + length;
    }
    length = Math.max(length, 0);
    const startIndex =
      page * pageSize > length
        ? (Math.ceil(length / pageSize) - 1) * pageSize
        : page * pageSize;

    const endIndex = Math.min(startIndex + pageSize, length);
    return startIndex + 1 + ' - ' + endIndex + ' ' + of + ' ' + length;
  };

  translateLabels(): void {
    this.firstPageLabel = this.translateService.instant(
      'MAT_PAGINATOR.FIRST_PAGE'
    );
    this.itemsPerPageLabel = this.translateService.instant(
      'MAT_PAGINATOR.ITEMS_PER_PAGE'
    );
    this.lastPageLabel = this.translateService.instant(
      'MAT_PAGINATOR.LAST_PAGE'
    );
    this.nextPageLabel = this.translateService.instant(
      'MAT_PAGINATOR.NEXT_PAGE'
    );
    this.previousPageLabel = this.translateService.instant(
      'MAT_PAGINATOR.PREVIOUS_PAGE'
    );
    this.changes.next();
  }
}
