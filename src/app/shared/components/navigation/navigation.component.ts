import type { MediaMatcher } from '@angular/cdk/layout';
import type { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import type { TranslateService } from '@ngx-translate/core';
import type { Observable } from 'rxjs';
import type { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnDestroy {
  versionNumber: string = environment.versionNumber;
  isLoggedIn$: Observable<boolean>;
  mobileQuery: MediaQueryList;
  private readonly mobileQueryListener: () => void;

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
