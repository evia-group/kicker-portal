import { Inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  ReplaySubject,
  Subscription,
} from 'rxjs';
import { map, shareReplay, switchMap, take } from 'rxjs/operators';
import { IMatch } from '../interfaces/match.interface';
import { InfoBarService } from './info-bar.service';
import { UntypedFormGroup } from '@angular/forms';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { IUser } from '../interfaces/user.interface';
import { IPlaytime } from '../interfaces/statistic.interface';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { TeamsService } from './teams.service';
import { LeaderboardService } from './leaderboard.service';

interface MatchSideDto {
  playerIds: string[];
}

interface MatchRoundDto {
  winnerSide: 0 | 1;
  domination: boolean;
}

interface CreateMatchDto {
  side0: MatchSideDto;
  side1: MatchSideDto;
  rounds: MatchRoundDto[];
}

@Injectable({
  providedIn: 'root',
})
export class MatchesService implements OnDestroy {
  translateSub: Subscription;

  infoText = '';

  closeText = '';

  private refresh$ = new BehaviorSubject<void>(undefined);

  private allMatches$: Observable<IMatch[]> = this.refresh$.pipe(
    switchMap(() => this.http.get<IMatch[]>(`${this.config.apiUrl}/matches`)),
    shareReplay(1)
  );

  public matches$: Observable<IMatch[]> = this.allMatches$.pipe(
    map((matches) => matches.filter((match) => !match.isSingle))
  );

  public singleMatches$: Observable<IMatch[]> = this.allMatches$.pipe(
    map((matches) => matches.filter((match) => match.isSingle))
  );

  public playtime$: Observable<IPlaytime[]> = this.refresh$.pipe(
    switchMap(() =>
      this.http.get<IPlaytime[]>(`${this.config.apiUrl}/playtime`)
    ),
    shareReplay(1)
  );

  matchesSub$ = new BehaviorSubject<IMatch[]>(undefined);

  singleMatchesSub$ = new BehaviorSubject<IMatch[]>(undefined);

  singleModeSub$ = new ReplaySubject<boolean>(1);

  subscribtions: Subscription[] = [];

  constructor(
    protected http: HttpClient,
    protected infoBar: InfoBarService,
    protected translateService: TranslateService,
    protected authService: AuthService,
    protected usersService: UsersService,
    protected teamsService: TeamsService,
    protected leaderboardService: LeaderboardService,
    @Inject(APP_CONFIG) protected config: AppConfig
  ) {
    authService.isLoggedIn.subscribe((loggedIn) => {
      if (loggedIn) {
        this.subscribeToObservables();
        this.singleModeSub$.next(false);
      } else {
        this.unsubscribeFromObservables();
      }
    });

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

  /** Only rounds that were actually played (rounds.three.win can be null). */
  private static buildRounds(form: UntypedFormGroup): MatchRoundDto[] {
    const rounds: MatchRoundDto[] = [];
    for (const key of ['one', 'two', 'three']) {
      const win = form.get(`rounds.${key}.win`).value;
      if (win === null || win === undefined) {
        continue;
      }
      const dominationTeamOne = form.get(
        `rounds.${key}.dominationTeamOne`
      ).value;
      const dominationTeamTwo = form.get(
        `rounds.${key}.dominationTeamTwo`
      ).value;
      rounds.push({
        winnerSide: win === 'team1' ? 0 : 1,
        domination: !!(dominationTeamOne || dominationTeamTwo),
      });
    }
    return rounds;
  }

  public async add(match: UntypedFormGroup): Promise<void> {
    const dto: CreateMatchDto = {
      side0: {
        playerIds: [
          match.get('players.team1.one').value.id,
          match.get('players.team1.two').value.id,
        ],
      },
      side1: {
        playerIds: [
          match.get('players.team2.one').value.id,
          match.get('players.team2.two').value.id,
        ],
      },
      rounds: MatchesService.buildRounds(match),
    };

    return this.submit(dto);
  }

  public async addSingleMatch(match: UntypedFormGroup): Promise<void> {
    const player1 = (match.get('players.team1.one').value as IUser).id;
    const player2 = (match.get('players.team2.one').value as IUser).id;

    const dto: CreateMatchDto = {
      side0: { playerIds: [player1] },
      side1: { playerIds: [player2] },
      rounds: MatchesService.buildRounds(match),
    };

    return this.submit(dto);
  }

  private async submit(dto: CreateMatchDto): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.config.apiUrl}/matches`, dto)
      );
      this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
      this.refreshAffectedData();
    } catch (err) {
      this.infoBar.openComponentSnackBar(5);
      console.log('ERROR', err);
    }
  }

  async delete(matchId: string) {
    await firstValueFrom(
      this.http.delete(`${this.config.apiUrl}/matches/${matchId}`)
    );
    this.refreshAffectedData();
  }

  /** A match mutation can affect users (auto-provisioning), teams (auto-creation) and leaderboards. */
  private refreshAffectedData() {
    this.refresh$.next();
    this.usersService.refresh();
    this.teamsService.refresh();
    this.leaderboardService.refresh();
  }
}
