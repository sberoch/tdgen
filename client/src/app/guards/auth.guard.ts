import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserJwt } from '../types/user';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.http.get<UserJwt>('/api/auth/profile', { withCredentials: true }).pipe(
      map((user) => {
        // Check if user has admin group
        if (!user.groups.includes('admin')) {
          this.router.navigate(['/denied']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        // Redirect to SAML login if no valid auth
        window.location.href = '/api/auth/saml/login';
        return of(false);
      })
    );
  }
}