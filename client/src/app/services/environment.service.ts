import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  get adminRoleName(): string {
    return environment.adminRoleName;
  }

  get userRoleName(): string {
    return environment.userRoleName;
  }

  get apiUrl(): string {
    return environment.apiUrl;
  }

  get isDevEnv(): boolean {
    return environment.isDevEnv;
  }
}
