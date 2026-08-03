import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { getDatabase, onValue, ref } from '@angular/fire/database';
import { Router } from '@angular/router';
import { MatIconRegistry, MatIcon } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatToolbar } from '@angular/material/toolbar';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import {
  NgClass,
  NgTemplateOutlet,
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import {
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular/material/sidenav';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  imports: [
    MatToolbar,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    NgClass,
    MatIconButton,
    NgTemplateOutlet,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatDrawerContainer,
    MatDrawerContent,
    AsyncPipe,
    DatePipe,
    TranslatePipe,
  ],
})
export class NavigationComponent implements OnDestroy, OnInit {
  isLoggedIn$: Observable<boolean>;
  kickerStatus = true;
  kickerBusyTime: Date;
  private mobileQueryListener: () => void;
  breakpointObserverSubscription: Subscription;
  showDropdown = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.isLoggedIn$ = this.authService.isLoggedIn;

    iconRegistry.addSvgIcon(
      'github',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/github.svg')
    );
  }

  ngOnInit() {
    onValue(ref(getDatabase(), '/Kicker'), (snapshot) => {
      this.kickerStatus = snapshot.val().status || false;
      if (this.kickerStatus === false) {
        this.kickerBusyTime = new Date(snapshot.val().startTime * 1000);
      }
    });
    this.breakpointObserverSubscription = this.breakpointObserver
      .observe('(max-width: 740px)')
      .subscribe((result) => {
        this.showDropdown = result.matches;
      });
  }

  ngOnDestroy(): void {
    this.breakpointObserverSubscription.unsubscribe();
  }

  public changeLanguage(language: string): void {
    this.translate.use(language);
  }

  public logout() {
    this.authService.logout();
  }

  public goToBuglist() {
    window.open(
      'https://eviaconsulting.sharepoint.com/teams/kickerportal885/Lists/Tickets/AllItems.aspx?env=WebViewList',
      '_blank'
    );
  }

  public goToGithub() {
    window.open('https://github.com/evia-group/kicker-portal', '_blank');
  }
}
