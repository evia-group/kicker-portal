import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    private oidcSecurityService: OidcSecurityService,
    public router: Router
  ) {
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
    this.oidcSecurityService.logoff().subscribe();
  }

  loginWithMicrosoft() {
    this.oidcSecurityService.authorize();
  }

  getAccessToken(): Observable<string> {
    return this.oidcSecurityService.getAccessToken();
  }
}
