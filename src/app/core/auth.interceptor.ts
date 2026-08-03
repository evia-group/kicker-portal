import { Inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../shared/services/auth.service';
import { APP_CONFIG, AppConfig } from './app-config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(this.config.apiUrl)) {
      return next.handle(req);
    }

    return this.authService
      .getAccessToken()
      .pipe(
        switchMap((token) =>
          next.handle(
            token
              ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
              : req
          )
        )
      );
  }
}
