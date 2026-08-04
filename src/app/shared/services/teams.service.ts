import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { ITeam } from '../interfaces/user.interface';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { IPlayers } from '../interfaces/match.interface';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  public teams$: Observable<ITeam[]> = this.refresh$.pipe(
    switchMap(() => this.http.get<ITeam[]>(`${this.config.apiUrl}/teams`)),
    shareReplay(1)
  );

  constructor(
    protected http: HttpClient,
    @Inject(APP_CONFIG) protected config: AppConfig
  ) {}

  refresh() {
    this.refresh$.next();
  }

  public createTeamId(team: IPlayers[]): string {
    const sortetTeam: IPlayers[] = team.sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    const teamId = sortetTeam.map((player) => player.id).join('');

    return teamId;
  }

  public createTeamName(teamPlayers: IPlayers[]) {
    const sortedTeam = teamPlayers.sort((a, b) => a.id.localeCompare(b.id));
    const teamName = sortedTeam.map((player) => player.name).join(' - ');

    return teamName;
  }

  public async delete(teamId: string) {
    await firstValueFrom(
      this.http.delete(`${this.config.apiUrl}/teams/${teamId}`)
    );
    this.refresh();
  }
}
