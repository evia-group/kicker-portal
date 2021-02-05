import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {StatisticComponent} from './components/kicker/statistic/statistic.component';
import {TournamentsComponent} from './components/kicker/tournaments/tournaments.component';
import {MatchesComponent} from './components/kicker/matches/matches.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {KickerComponent} from './components/kicker/kicker.component';
import {MatchFinderComponent} from './components/kicker/match-finder/match-finder.component';
import {LoginComponent} from './components/login/login.component';
import {RegisterComponent} from './components/register/register.component';
import {
  AngularFireAuthGuard,
  redirectLoggedInTo,
  emailVerified,
  canActivate,
} from '@angular/fire/auth-guard';
import {pipe} from 'rxjs';
import {map} from 'rxjs/operators';
import {NotVerifiedComponent} from './components/not-verified/not-verified.component';
import {InteractiveMapComponent} from './components/interactive-map/interactive-map.component';

const redirectUnauthorized = () => {
  return pipe(
    emailVerified,
    map(user => {
        return user ? user : ['verified']
      }
    ));
};
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['dashboard']);

const routes: Routes = [
  {
    path: 'kicker',
    component: KickerComponent,
    children: [
      {
        path: 'statistics',
        component: StatisticComponent,
        ...canActivate(redirectUnauthorized),
      },
      {
        path: 'tournaments',
        component: TournamentsComponent,
        ...canActivate(redirectUnauthorized),
      },
      {
        path: 'matches',
        component: MatchesComponent,
        ...canActivate(redirectUnauthorized),
      },
      {
        path: 'matchmaking',
        component: MatchFinderComponent,
        ...canActivate(redirectUnauthorized),
      },
      {path: '', pathMatch: 'full', redirectTo: 'matches',}
    ]
  },
  {
    path: 'map',
    component: InteractiveMapComponent,
    ...canActivate(redirectUnauthorized),
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorized }
  },
  {
    path: 'login',
    component: LoginComponent,
    ...canActivate(redirectLoggedInToDashboard),
  },
  {path: 'register', component: RegisterComponent},
  {path: 'verified', component: NotVerifiedComponent},
  {path: '**', pathMatch: 'full', redirectTo: 'login'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
