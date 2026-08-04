import { Inject, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../core/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private router: Router,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    if (this.config.disableSso) {
      this.loggedIn.next(true);
      this.router.navigate(['/kicker']);
      return;
    }

    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      if (isAuthenticated) {
        this.loggedIn.next(true);
        this.router.navigate(['/kicker']);
      } else {
        this.loggedIn.next(false);
        this.router.navigate(['/login']);
      }
    });
  }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  logout() {
    if (this.config.disableSso) {
      return;
    }
    this.oidcSecurityService.logoff().subscribe();
  }

  loginWithMicrosoft() {
    if (this.config.disableSso) {
      return;
    }
    this.oidcSecurityService.authorize();
  }

  getAccessToken(): Observable<string> {
    if (this.config.disableSso) {
      return of('');
    }
    return this.oidcSecurityService.getAccessToken();
  }
}
