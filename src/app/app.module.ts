import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './shared/modules/material.module';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { StatisticComponent } from './components/kicker/statistic/statistic.component';
import { MatchesComponent } from './components/kicker/matches/matches.component';
import { TournamentsComponent } from './components/kicker/tournaments/tournaments.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AddMatchComponent } from './shared/components/add-match/add-match.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoundResultComponent } from './shared/components/add-match/round-result/round-result.component';
import { SelectPlayersComponent } from './shared/components/add-match/select-players/select-players.component';
import { InfoBarComponent } from './shared/components/info-bar/info-bar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { KickerComponent } from './components/kicker/kicker.component';
import { MatchFinderComponent } from './components/kicker/match-finder/match-finder.component';
import { NotVerifiedComponent } from './components/not-verified/not-verified.component';
import { InteractiveMapComponent } from './components/interactive-map/interactive-map.component';
import { RoomMapComponent } from './shared/components/room-map/room-map.component';
import { RoomInformationComponent } from './shared/components/room-information/room-information.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import { CreateTeamDialogComponent } from './shared/components/add-match/create-team-dialog/create-team-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { NgChartsModule } from 'ng2-charts';
import { LeaderboardComponent } from './components/kicker/statistic/leaderboard/leaderboard.component';
import { BarLineChartComponent } from './components/kicker/statistic/bar-line-chart/bar-line-chart.component';
import { ResultDoughnutChartComponent } from './components/kicker/statistic/result-doughnut-chart/result-doughnut-chart.component';
import { MatchesChartComponent } from './components/kicker/statistic/matches-chart/matches-chart.component';
import { PlaytimeChartComponent } from './components/kicker/statistic/playtime-chart/playtime-chart.component';
import { MomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorIntlService } from './shared/services/mat-paginator-intl.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  connectDatabaseEmulator,
  getDatabase,
  provideDatabase,
} from '@angular/fire/database';
import { DatepickerComponent } from './shared/components/datepicker/datepicker.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AutocompleteSelectionComponent } from './shared/components/autocomplete-selection/autocomplete-selection.component';
import { TwoSelectionsComponent } from './shared/components/add-match/select-players/two-selections/two-selections.component';
import { ResponsiveSelectorComponent } from './shared/components/add-match/select-players/responsive-selector/responsive-selector.component';
import { TwoSelectionsDialogComponent } from './shared/components/add-match/select-players/two-selections-dialog/two-selections-dialog.component';
import { LastAddedMatchesComponent } from './shared/components/last-added-matches/last-added-matches.component';
import { LocalizedDatePipe } from './shared/pipes/localized-date.pipe';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { MatTabScrollDirective } from './shared/directives/mat-tab-scroll.directive';
import { LoadingDataComponent } from './shared/components/loading-data/loading-data.component';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    StatisticComponent,
    MatchesComponent,
    TournamentsComponent,
    AddMatchComponent,
    RoundResultComponent,
    SelectPlayersComponent,
    InfoBarComponent,
    DashboardComponent,
    LoginComponent,
    KickerComponent,
    MatchFinderComponent,
    NotVerifiedComponent,
    InteractiveMapComponent,
    RoomMapComponent,
    RoomInformationComponent,
    CreateTeamDialogComponent,
    LeaderboardComponent,
    BarLineChartComponent,
    ResultDoughnutChartComponent,
    MatchesChartComponent,
    PlaytimeChartComponent,
    DatepickerComponent,
    AutocompleteSelectionComponent,
    TwoSelectionsComponent,
    ResponsiveSelectorComponent,
    TwoSelectionsDialogComponent,
    LastAddedMatchesComponent,
    LocalizedDatePipe,
    SpinnerComponent,
    MatTabScrollDirective,
    LoadingDataComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment['useEmulators']) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (environment['useEmulators']) {
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true,
        });
      }
      return auth;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment['useEmulators']) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideDatabase(() => {
      const database = getDatabase();
      if (environment['useEmulators']) {
        connectDatabaseEmulator(database, 'localhost', 9000);
      }
      return database;
    }),
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgChartsModule,
    MomentDateModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatAutocompleteModule,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlService,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
