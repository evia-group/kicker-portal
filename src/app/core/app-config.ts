import { InjectionToken } from '@angular/core';

export interface AppConfig {
  production: boolean;
  versionNumber: string;
  prefix: string;
  useEmulators?: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  ms: {
    tenant: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
