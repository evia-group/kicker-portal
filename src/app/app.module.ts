import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {
  provideAuth,
  StsConfigLoader,
  StsConfigStaticLoader,
} from 'angular-auth-oidc-client';
import { APP_CONFIG, AppConfig } from './core/app-config';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './shared/modules/material.module';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { StatisticComponent } from './components/kicker/statistic/statistic.component';
import { MatchesComponent } from './components/kicker/matches/matches.component';
import { TournamentsComponent } from './components/kicker/tournaments/tournaments.component';
import { provideTranslateService } from '@ngx-translate/core';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from './core/auth.interceptor';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AddMatchComponent } from './shared/components/add-match/add-match.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoundResultComponent } from './shared/components/add-match/round-result/round-result.component';
import { SelectPlayersComponent } from './shared/components/add-match/select-players/select-players.component';
import { InfoBarComponent } from './shared/components/info-bar/info-bar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { KickerComponent } from './components/kicker/kicker.component';
import { MatchFinderComponent } from './components/kicker/match-finder/match-finder.component';
import { InteractiveMapComponent } from './components/interactive-map/interactive-map.component';
import { RoomMapComponent } from './shared/components/room-map/room-map.component';
import { RoomInformationComponent } from './shared/components/room-information/room-information.component';
import { CreateTeamDialogComponent } from './shared/components/add-match/create-team-dialog/create-team-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { LeaderboardComponent } from './components/kicker/statistic/leaderboard/leaderboard.component';
import { BarLineChartComponent } from './components/kicker/statistic/bar-line-chart/bar-line-chart.component';
import { ResultDoughnutChartComponent } from './components/kicker/statistic/result-doughnut-chart/result-doughnut-chart.component';
import { MatchesChartComponent } from './components/kicker/statistic/matches-chart/matches-chart.component';
import { PlaytimeChartComponent } from './components/kicker/statistic/playtime-chart/playtime-chart.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorIntlService } from './shared/services/mat-paginator-intl.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
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
import { MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SelectionWithSearchComponent } from './shared/components/selection-with-search/selection-with-search.component';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDateFnsModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
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
    SelectionWithSearchComponent,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlService,
    },
    provideAuth({
      loader: {
        provide: StsConfigLoader,
        useFactory: (config: AppConfig) =>
          new StsConfigStaticLoader({
            authority: `https://login.microsoftonline.com/${config.ms.tenant}/v2.0`,
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: config.ms.clientId,
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
          }),
        deps: [APP_CONFIG],
      },
    }),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideTranslateService({ fallbackLang: 'de' }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
    provideCharts(withDefaultRegisterables()),
  ],
})
export class AppModule {}
