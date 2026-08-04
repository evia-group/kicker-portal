import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { IQueueSnapshot } from './matchmaking-socket.service';

/** Schreibende Zugriffe auf die Warteschlange. Live-Updates kommen ueber
 *  `MatchmakingSocketService`. */
@Injectable({ providedIn: 'root' })
export class MatchmakingService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  /** Einmaliger Abruf, etwa beim Betreten der Seite. */
  list(gameTypeKey: string): Observable<IQueueSnapshot[]> {
    return this.http.get<IQueueSnapshot[]>(
      `${this.config.apiUrl}/matchmaking/queue`,
      { params: new HttpParams().set('gameType', gameTypeKey) }
    );
  }

  join(gameTypeKey: string, teamSize: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.config.apiUrl}/matchmaking/queue`,
      { gameTypeKey, teamSize }
    );
  }

  leave(gameTypeKey: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(
      `${this.config.apiUrl}/matchmaking/queue/me`,
      { params: new HttpParams().set('gameType', gameTypeKey) }
    );
  }

  respond(
    proposalId: string,
    response: 'accepted' | 'declined'
  ): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.config.apiUrl}/matchmaking/proposals/${proposalId}/respond`,
      { response }
    );
  }
}
