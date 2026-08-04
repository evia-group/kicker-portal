import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { IUser } from '../interfaces/user.interface';
import { APP_CONFIG, AppConfig } from '../../core/app-config';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  /**
   * Unlike the old Firestore snapshot listener, GET /users doesn't push
   * updates - refresh() re-fetches so mutations elsewhere (e.g. adding a
   * match, which can create a user via auto-provisioning) show up here too.
   */
  public users$: Observable<IUser[]> = this.refresh$.pipe(
    switchMap(() => this.http.get<IUser[]>(`${this.config.apiUrl}/users`)),
    shareReplay(1)
  );

  constructor(
    protected http: HttpClient,
    @Inject(APP_CONFIG) protected config: AppConfig
  ) {}

  refresh() {
    this.refresh$.next();
  }

  async delete(userId: string) {
    await firstValueFrom(
      this.http.delete(`${this.config.apiUrl}/users/${userId}`)
    );
    this.refresh();
  }
}
