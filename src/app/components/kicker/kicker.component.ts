import { Component } from '@angular/core';

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
})
export class KickerComponent {
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
    {
      label: 'app.tournaments',
      link: '/kicker/tournaments',
      icon: 'games',
      active: false,
      index: 2,
    },
    {
      label: 'app.matchmaking',
      link: '/kicker/matchmaking',
      icon: 'groups',
      active: false,
      index: 2,
    },
  ];
}
