import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { AuthService } from './auth.service';
import { IUser } from '../interfaces/user.interface';

/**
 * Postgres user.id (UUID) is no longer the same value as the Firebase UID
 * (which used to double as the Firestore document id). GET /users/me
 * resolves "who am I" via the bearer token, so the frontend can find its own
 * leaderboard row and gate admin-only UI (delete buttons) without assuming
 * authService.user.uid is a valid entity id.
 */
@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private currentUserSubject = new BehaviorSubject<IUser | undefined>(
    undefined
  );

  public currentUser$: Observable<IUser | undefined> =
    this.currentUserSubject.asObservable();

  public isAdmin$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user?.isAdmin ?? false)
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    this.authService.isLoggedIn.subscribe((loggedIn) => {
      if (loggedIn) {
        this.http.get<IUser>(`${this.config.apiUrl}/users/me`).subscribe({
          next: (user) => this.currentUserSubject.next(user),
          error: (err) => console.log(err),
        });
      } else {
        this.currentUserSubject.next(undefined);
      }
    });
  }

  get id(): string | undefined {
    return this.currentUserSubject.value?.id;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.isAdmin ?? false;
  }
}
