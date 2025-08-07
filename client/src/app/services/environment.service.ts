import { Injectable } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  constructor(private runtimeConfig: RuntimeConfigService) {}
  get adminRoleName(): string {
    return this.runtimeConfig.adminRoleName;
  }

  get userRoleName(): string {
    return this.runtimeConfig.userRoleName;
  }

  get apiUrl(): string {
    const base = this.runtimeConfig.apiUrl || '';
    if (!base) return '';
    return base.endsWith('/') ? base : `${base}/`;
  }

  get isDevEnv(): boolean {
    return this.runtimeConfig.isDevEnv;
  }
}
