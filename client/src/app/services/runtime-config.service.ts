import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  apiUrl: string;
  adminRoleName: string;
  userRoleName: string;
  isDevEnv: boolean;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config?: RuntimeConfig;

  async load(): Promise<void> {
    const response = await fetch('/api/config', { credentials: 'include' });
    this.config = (await response.json()) as RuntimeConfig;
    (window as any).ISDEVENV = this.config.isDevEnv;
  }

  get apiUrl(): string {
    return this.config?.apiUrl ?? '';
  }

  get adminRoleName(): string {
    return this.config?.adminRoleName ?? 'admin';
  }

  get userRoleName(): string {
    return this.config?.userRoleName ?? 'user';
  }

  get isDevEnv(): boolean {
    return this.config?.isDevEnv ?? false;
  }
}
