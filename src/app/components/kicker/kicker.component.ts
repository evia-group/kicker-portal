import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { APP_CONFIG } from '../../core/app-config';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { MatTabScrollDirective } from '../../shared/directives/mat-tab-scroll.directive';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';

interface INavigationItem {
  label: string;
  link: string;
  icon: string;
  active: boolean;
  index: number;
}

@Component({
  selector: 'app-kicker',
  templateUrl: './kicker.component.html',
  styleUrls: ['./kicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatTabNav,
    MatTabScrollDirective,
    MatTabLink,
    RouterLinkActive,
    RouterLink,
    MatIcon,
    MatTabNavPanel,
    RouterOutlet,
    MatToolbar,
    TranslatePipe,
  ],
})
export class KickerComponent {
  versionNumber: string = inject(APP_CONFIG).versionNumber;

  navLinks: INavigationItem[] = [
    {
      label: 'app.matches',
      link: '/kicker/matches',
      icon: 'sports',
      active: true,
      index: 0,
    },
    {
      label: 'app.statistics',
      link: '/kicker/statistics',
      icon: 'bubble_chart',
      active: true,
      index: 1,
    },
    // Route und i18n-Keys gab es schon, nur dieser Eintrag fehlte. Die Seite
    // war deshalb nur ueber die Adresszeile erreichbar.
    {
      label: 'app.matchmaking',
      link: '/kicker/matchmaking',
      icon: 'sports_esports',
      active: true,
      index: 2,
    },
  ];
}
