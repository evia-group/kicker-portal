import {MediaMatcher} from '@angular/cdk/layout';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnDestroy {
  isLoggedIn$: Observable<boolean>;
  mobileQuery: MediaQueryList;
  private mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authService: AuthService,
    private translate: TranslateService) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change',this.mobileQueryListener);
    this.isLoggedIn$ = this.authService.isLoggedIn;
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change',this.mobileQueryListener);
  }

  public changeLanguage(language: string): void {
    this.translate.use(language);
  }

  public logout() {
    this.authService.logout();
  }

}
