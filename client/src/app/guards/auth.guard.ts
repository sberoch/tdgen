import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserJwt } from '../types/user';
import { EnvironmentService } from '../services/environment.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    private environmentService: EnvironmentService
  ) {}

  canActivate(): Observable<boolean> {
    return this.http
      .get<UserJwt>('/api/auth/profile', { withCredentials: true })
      .pipe(
        map(() => true),
        catchError((error) => {
          // Check if it's a SAML-related error (401 with specific message)
          if (error.status === 401 && error.error?.message?.includes('SAML')) {
            this.router.navigate(['/denied']);
            return of(false);
          }

          // Check for server errors that might indicate SAML service issues
          if (error.status >= 500) {
            this.router.navigate(['/denied']);
            return of(false);
          }

          // Regular auth failure - redirect to SAML login
          window.location.href = '/api/auth/saml/login';
          return of(false);
        })
      );
  }
}
