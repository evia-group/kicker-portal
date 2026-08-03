import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { MatTabScrollDirective } from '../../shared/directives/mat-tab-scroll.directive';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
  ],
})
export class KickerComponent {
  versionNumber: string = environment.versionNumber;

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
  ];
}
