import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { getDatabase, onValue, ref } from '@angular/fire/database';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnDestroy, OnInit {
  versionNumber: string = environment.versionNumber;
  isLoggedIn$: Observable<boolean>;
  mobileQuery: MediaQueryList;
  kickerStatus = true;
  kickerBusyTime: Date;
  private mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this.mobileQueryListener);
    this.isLoggedIn$ = this.authService.isLoggedIn;
  }

  ngOnInit() {
    onValue(ref(getDatabase(), '/Kicker'), (snapshot) => {
      this.kickerStatus = snapshot.val().status || true;
      if (this.kickerStatus === false) {
        this.kickerBusyTime = new Date(snapshot.val().startTime * 1000);
      }
    });
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this.mobileQueryListener);
  }

  public changeLanguage(language: string): void {
    this.translate.use(language);
  }

  public logout() {
    this.authService.logout();
  }
}
