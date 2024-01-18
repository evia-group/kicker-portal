import { Injectable, OnDestroy } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  Timestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';
import { IMatch, ISingleMatch } from '../interfaces/match.interface';
import { InfoBarService } from './info-bar.service';
import { UntypedFormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { IUser } from '../interfaces/user.interface';
import { IPlaytime } from '../interfaces/statistic.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class MatchesService implements OnDestroy {
  translateSub: Subscription;

  infoText = '';

  closeText = '';

  public matches$: Observable<IMatch[]>;

  public singleMatches$: Observable<ISingleMatch[]>;

  public playtime$: Observable<IPlaytime[]>;

  protected collection: CollectionReference;

  protected singleMatchCollection: CollectionReference;

  matchesSub$ = new BehaviorSubject<IMatch[]>(undefined);

  singleMatchesSub$ = new BehaviorSubject<ISingleMatch[]>(undefined);

  singleModeSub$ = new ReplaySubject<boolean>(1);

  subscribtions: Subscription[] = [];

  constructor(
    protected db: Firestore,
    protected infoBar: InfoBarService,
    protected translateService: TranslateService,
    protected authService: AuthService
  ) {
    this.collection = collection(
      db,
      `${environment.prefix}Matches`
    ) as CollectionReference<IMatch>;
    this.matches$ = collectionData(this.collection).pipe(
      shareReplay(1)
    ) as Observable<IMatch[]>;

    this.singleMatchCollection = collection(
      db,
      `${environment.prefix}Single-Matches`
    ) as CollectionReference<ISingleMatch>;
    this.singleMatches$ = collectionData(this.singleMatchCollection).pipe(
      shareReplay(1)
    ) as Observable<ISingleMatch[]>;

    authService.isLoggedIn.subscribe((loggedIn) => {
      if (loggedIn) {
        this.subscribeToObservables();
        this.singleModeSub$.next(false);
      } else {
        this.unsubscribeFromObservables();
      }
    });

    const playtimeCol = collection(
      db,
      `${environment.prefix}Playtime`
    ) as CollectionReference<IMatch>;
    this.playtime$ = collectionData(playtimeCol).pipe(
      shareReplay(1)
    ) as Observable<IPlaytime[]>;

    this.getText();

    this.translateSub = this.translateService.onLangChange.subscribe(
      (_event: LangChangeEvent) => {
        this.getText();
      }
    );
  }

  subscribeToObservables() {
    this.subscribtions[0] = this.matches$.subscribe({
      next: (matches) => this.matchesSub$.next(matches),
      error: (err) => console.log(err),
    });
    this.subscribtions[1] = this.singleMatches$.subscribe({
      next: (singleMatches) => this.singleMatchesSub$.next(singleMatches),
      error: (err) => console.log(err),
    });
  }

  unsubscribeFromObservables() {
    this.subscribtions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    this.translateSub.unsubscribe();
  }

  getText() {
    this.translateService
      .get('info')
      .pipe(take(1))
      .subscribe((res) => {
        this.infoText = res.saveMatch;
        this.closeText = res.close;
      });
  }

  private static getRoundInfos(
    team: string,
    form: UntypedFormGroup,
    type: 'win' | 'dominationTeamOne' | 'dominationTeamTwo'
  ): number {
    const rounds = [
      form.get(`rounds.one.${type}`).value,
      form.get(`rounds.two.${type}`).value,
      form.get(`rounds.three.${type}`).value,
    ];

    return rounds.filter((round) => {
      if (type === 'win') {
        return round === team;
      } else {
        return round;
      }
    }).length;
  }

  public async add(match: UntypedFormGroup): Promise<void> {
    const team1 = match.get('players.team1.teamId').value;
    const team2 = match.get('players.team2.teamId').value;

    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsTeam1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne'
    );
    const dominationsTeam2 = MatchesService.getRoundInfos(
      'team2',
      match,
      'dominationTeamTwo'
    );

    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];

    const teams = [
      doc(this.db, `${environment.prefix}Teams/${team1})}`),
      doc(this.db, `${environment.prefix}Teams/${team2})}`),
    ];

    const players = [
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team1.one').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team1.two').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team2.one').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team2.two').value.id}`
      ),
    ];

    const result = {
      [`${team1}`]: winTeam1,
      [`${team2}`]: winTeam2,
    };

    for (let i = 0; i < dominationsTeam1; i++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
    }

    for (let j = 0; j < dominationsTeam2; j++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
    }

    const resultMatch: IMatch = {
      defeats,
      dominations,
      players,
      result,
      teams,
      type: `${winTeam1}:${winTeam2}`,
      date: Timestamp.now(),
    };

    return await addDoc(this.collection, resultMatch)
      .then(() => {
        this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
      })
      .catch((err) => {
        this.infoBar.openComponentSnackBar(5);
        console.log('ERROR', err);
      });
  }

  public async addSingleMatch(match: UntypedFormGroup): Promise<void> {
    const player1 = (match.get('players.team1.one').value as IUser).id;
    const player2 = (match.get('players.team2.one').value as IUser).id;

    const winPlayer1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winPlayer2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsPlayer1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne'
    );
    const dominationsPlayer2 = MatchesService.getRoundInfos(
      'team2',
      match,
      'dominationTeamTwo'
    );

    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];

    const result = {
      [player1]: winPlayer1,
      [player2]: winPlayer2,
    };

    for (let i = 0; i < dominationsPlayer1; i++) {
      dominations.push(doc(this.db, `${environment.prefix}Users/${player1}`));
      defeats.push(doc(this.db, `${environment.prefix}Users/${player2}`));
    }

    for (let j = 0; j < dominationsPlayer2; j++) {
      dominations.push(doc(this.db, `${environment.prefix}Users/${player2}`));
      defeats.push(doc(this.db, `${environment.prefix}Users/${player1}`));
    }

    const resultMatch: ISingleMatch = {
      defeats,
      dominations,
      result,
      type: `${winPlayer1}:${winPlayer2}`,
      date: Timestamp.now(),
    };

    return await addDoc(this.singleMatchCollection, resultMatch)
      .then(() => {
        this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
      })
      .catch((err) => {
        this.infoBar.openComponentSnackBar(5);
        console.log('ERROR', err);
      });
  }

  async delete(matchId) {
    await deleteDoc(doc(this.db, this.collection.path, matchId));
  }
}
