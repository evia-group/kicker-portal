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
import { RegisterComponent } from './components/register/register.component';
import { NotVerifiedComponent } from './components/not-verified/not-verified.component';
import { InteractiveMapComponent } from './components/interactive-map/interactive-map.component';
import { RoomMapComponent } from './shared/components/room-map/room-map.component';
import { RoomInformationComponent } from './shared/components/room-information/room-information.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

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
    RegisterComponent,
    NotVerifiedComponent,
    InteractiveMapComponent,
    RoomMapComponent,
    RoomInformationComponent,
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
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [InfoBarComponent],
})
export class AppModule {}
