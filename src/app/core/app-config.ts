import { InjectionToken } from '@angular/core';

export interface AppConfig {
  production: boolean;
  versionNumber: string;
  apiUrl: string;
  ms: {
    tenant: string;
    clientId: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
