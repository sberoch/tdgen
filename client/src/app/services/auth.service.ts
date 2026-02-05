import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User, UserJwt } from '../types/user';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<UserJwt | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {
    this.loadUserFromProfile();
  }

  private loadUserFromProfile(): void {
    this.http
      .get<UserJwt>('/api/auth/profile', { withCredentials: true })
      .subscribe({
        next: (user) => {
          this.userSubject.next(user);
        },
        error: (error) => {
          console.error('Error fetching user profile:', error);
          this.userSubject.next(null);
          
          // Handle SAML-specific errors
          if (error.status === 401 && error.error?.message?.includes('SAML')) {
            window.location.href = '/denied';
            return;
          }
          
          // Handle server errors that might indicate SAML service issues
          if (error.status >= 500) {
            window.location.href = '/denied';
            return;
          }
        },
      });
  }

  getCurrentUser(): UserJwt | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return user.exp > currentTime;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    const adminRoleName = this.runtimeConfig.adminRoleName;
    return user?.groups?.some(g => g.toLowerCase().includes(adminRoleName.toLowerCase())) || false;
  }
}
