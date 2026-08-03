import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { KickerSocketService } from './shared/services/kicker-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  kickerStatus = false;
  private statusSubscription: Subscription;

  constructor(
    translate: TranslateService,
    private kickerSocketService: KickerSocketService
  ) {
    const lang = translate.getBrowserLang();

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    if (lang === 'de' || lang === 'en') {
      translate.use(lang);
    } else {
      translate.use('de');
    }
  }

  ngOnInit() {
    this.statusSubscription = this.kickerSocketService.status$.subscribe(
      (status) => {
        this.kickerStatus = status.status || false;
      }
    );
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
  }
}
