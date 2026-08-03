import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StatisticComponent } from './components/kicker/statistic/statistic.component';
import { TournamentsComponent } from './components/kicker/tournaments/tournaments.component';
import { MatchesComponent } from './components/kicker/matches/matches.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { KickerComponent } from './components/kicker/kicker.component';
import { MatchFinderComponent } from './components/kicker/match-finder/match-finder.component';
import { LoginComponent } from './components/login/login.component';
import { InteractiveMapComponent } from './components/interactive-map/interactive-map.component';
import { authGuard } from './core/auth.guard';

const routes: Routes = [
  {
    path: 'kicker',
    component: KickerComponent,
    children: [
      {
        path: 'statistics',
        component: StatisticComponent,
        canActivate: [authGuard],
      },
      {
        path: 'tournaments',
        component: TournamentsComponent,
        canActivate: [authGuard],
      },
      {
        path: 'matches',
        component: MatchesComponent,
        canActivate: [authGuard],
      },
      {
        path: 'matchmaking',
        component: MatchFinderComponent,
        canActivate: [authGuard],
      },
      { path: '', pathMatch: 'full', redirectTo: 'matches' },
    ],
  },
  {
    path: 'map',
    component: InteractiveMapComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: '**', pathMatch: 'full', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
