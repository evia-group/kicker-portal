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
  /**
   * Oeffentlicher VAPID-Schluessel fuer Web Push. Kommt aus der
   * Laufzeitkonfiguration und nicht aus dem Build, weil ein Image gegen
   * mehrere Umgebungen laeuft und jede ihr eigenes Schluesselpaar hat.
   * Leerer String heisst: keine Benachrichtigungen anbieten.
   */
  vapidPublicKey: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
