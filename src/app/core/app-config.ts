import { InjectionToken } from '@angular/core';

export interface AppConfig {
  production: boolean;
  versionNumber: string;
  apiUrl: string;
  /** Local-dev-only escape hatch - skips the Entra ID login flow entirely. */
  disableSso: boolean;
  ms: {
    tenant: string;
    clientId: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
