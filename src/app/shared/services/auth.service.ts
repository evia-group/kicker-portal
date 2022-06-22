import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import type { User, Auth } from '@angular/fire/auth';
import {
  authState,
  signOut,
  signInWithPopup,
  OAuthProvider,
} from '@angular/fire/auth';
import type { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import type { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User;
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    private afAuth: Auth,
    public userSerice: UsersService,
    public router: Router
  ) {
    authState(afAuth).subscribe((user) => {
      if (user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.loggedIn.next(true);
        this.router.navigate(['/dashboard']);
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
    await this.router.navigate(['/dashboard']);
  }
}
