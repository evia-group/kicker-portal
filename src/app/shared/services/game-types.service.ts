import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { IGameType } from '../interfaces/game-type.interface';

/** Schluessel der Spielart, mit der die Anwendung gestartet ist. */
export const DEFAULT_GAME_TYPE_KEY = 'kicker';

/**
 * Laedt die Spielarten samt Regelwerk vom Backend.
 *
 * Die Regeln stehen absichtlich nicht im Frontend: Rundenzahl,
 * Rundenbezeichnung, Sonderwertung und ELO-Gewichtung kommen aus
 * `game_types`, damit eine weitere Disziplin ohne Frontend-Aenderung
 * hinzukommen kann. `shareReplay` haelt das Ergebnis, die Liste aendert sich
 * innerhalb einer Sitzung nicht.
 */
@Injectable({ providedIn: 'root' })
export class GameTypesService {
  public gameTypes$: Observable<IGameType[]> = this.http
    .get<IGameType[]>(`${this.config.apiUrl}/game-types`)
    .pipe(shareReplay(1));

  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  /** Regelwerk zu einem Schluessel. Fehlt der Schluessel, kommt undefined. */
  byKey(key: string): Observable<IGameType | undefined> {
    return this.gameTypes$.pipe(
      map((types) => types.find((type) => type.key === key))
    );
  }
}
