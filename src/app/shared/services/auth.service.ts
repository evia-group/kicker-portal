import { Injectable } from '@angular/core';
import {
  User,
  Auth,
  authState,
  signOut,
  signInWithPopup,
  OAuthProvider,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsersService } from './users.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user: User;

  public get user(): User {
    return this._user;
  }
  public set user(value: User) {
    this._user = value;
  }
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    private afAuth: Auth,
    public usersService: UsersService,
    public router: Router
  ) {
    authState(afAuth).subscribe((user) => {
      if (user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.loggedIn.next(true);
        this.router.navigate(['/kicker']);
      } else {
        localStorage.setItem('user', null);
        this.loggedIn.next(false);
        this.router.navigate(['/login']);
      }
    });
  }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  async logout() {
    await signOut(this.afAuth);
    localStorage.removeItem('user');
    this.loggedIn.next(false);
    await this.router.navigate(['/login']);
  }

  async loginWithMicrosoft() {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      tenant: environment.ms.tenant,
    });
    await signInWithPopup(this.afAuth, provider);
    this.loggedIn.next(true);
    await this.router.navigate(['/kicker']);
  }
}
