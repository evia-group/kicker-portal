import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {StatisticComponent} from './components/statistic/statistic.component';
import {TournamentsComponent} from './components/tournaments/tournaments.component';
import {MatchesComponent} from './components/matches/matches.component';

const routes: Routes = [
  { path: 'statistic', component: StatisticComponent },
  { path: 'tournament', component: TournamentsComponent },
  { path: '',  pathMatch: 'full', component: MatchesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
