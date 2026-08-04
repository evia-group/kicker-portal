import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { ILeaderboardEntry } from '../interfaces/statistic.interface';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  public teamLeaderboard$: Observable<ILeaderboardEntry[]> = this.refresh$.pipe(
    switchMap(() =>
      this.http.get<ILeaderboardEntry[]>(
        `${this.config.apiUrl}/leaderboard/teams`
      )
    ),
    shareReplay(1)
  );

  public userTeamLeaderboard$: Observable<ILeaderboardEntry[]> =
    this.refresh$.pipe(
      switchMap(() => this.getUserLeaderboard('team')),
      shareReplay(1)
    );

  public userSingleLeaderboard$: Observable<ILeaderboardEntry[]> =
    this.refresh$.pipe(
      switchMap(() => this.getUserLeaderboard('single')),
      shareReplay(1)
    );

  constructor(
    protected http: HttpClient,
    @Inject(APP_CONFIG) protected config: AppConfig
  ) {}

  refresh() {
    this.refresh$.next();
  }

  private getUserLeaderboard(
    mode: 'team' | 'single'
  ): Observable<ILeaderboardEntry[]> {
    return this.http.get<ILeaderboardEntry[]>(
      `${this.config.apiUrl}/leaderboard/users`,
      { params: new HttpParams().set('mode', mode) }
    );
  }
}
