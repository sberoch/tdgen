import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User, UserJwt } from '../types/user';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<UserJwt | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
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
}
