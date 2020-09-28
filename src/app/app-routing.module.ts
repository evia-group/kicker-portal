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
import {AngularFireAuthGuard, redirectUnauthorizedTo, redirectLoggedInTo} from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['dashboard']);

const routes: Routes = [
  {
    path: 'kicker',
    component: KickerComponent,
    children: [
      {
        path: 'statistics',
        component: StatisticComponent,
        canActivate: [AngularFireAuthGuard],
        data: {
          authGuardPipe: redirectUnauthorizedToLogin
        },
      },
      {
        path: 'tournaments',
        component: TournamentsComponent,
        canActivate: [AngularFireAuthGuard],
        data: {
          authGuardPipe: redirectUnauthorizedToLogin
        },
      },
      {
        path: 'matches',
        component: MatchesComponent,
        canActivate: [AngularFireAuthGuard],
        data: {
          authGuardPipe: redirectUnauthorizedToLogin
        },
      },
      {
        path: 'matchmaking',
        component: MatchFinderComponent,
        canActivate: [AngularFireAuthGuard],
        data: {
          authGuardPipe: redirectUnauthorizedToLogin
        },
      },
      {path: '', pathMatch: 'full', redirectTo: 'matches',}
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    },
  },
  {
    path: 'login',
    component: LoginComponent,
    data: {
      authGuardPipe: redirectLoggedInToDashboard
    },
  },
  {path: 'register', component: RegisterComponent},
  {path: '**', pathMatch: 'full', redirectTo: 'login'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
