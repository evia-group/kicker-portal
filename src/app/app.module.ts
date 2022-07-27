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
        connectFirestoreEmulator(firestore, 'localhost', 8082);
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (environment['useEmulators']) {
        connectAuthEmulator(auth, 'http://localhost:9098', {
          disableWarnings: true,
        });
      }
      return auth;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment['useEmulators']) {
        connectFunctionsEmulator(functions, 'localhost', 5022);
      }
      return functions;
    }),
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [InfoBarComponent],
})
export class AppModule {}
