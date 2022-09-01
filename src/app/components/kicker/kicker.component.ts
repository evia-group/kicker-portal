import { Component } from '@angular/core';
import { getDatabase, onValue, ref } from '@angular/fire/database';

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
  kickerStatus = false;

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
      active: false,
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

  constructor() {
    onValue(ref(getDatabase(), '/Kicker'), (snapshot) => {
      this.kickerStatus = snapshot.val().status || false;
    });
  }
}
