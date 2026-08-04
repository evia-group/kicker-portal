import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, AppConfig } from './app-config';

export interface INotificationPreferences {
  proposalReceived: boolean;
  tableFree: boolean;
}

/** Warum Benachrichtigungen hier nicht moeglich sind. */
export type PushUnavailableReason =
  | 'notConfigured'
  | 'noServiceWorker'
  | 'denied'
  | 'needsInstall';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.followNotificationClicks();
  }

  /**
   * Ist Push hier ueberhaupt moeglich, und wenn nicht, warum.
   *
   * Die Reihenfolge ist bewusst so: erst Konfiguration, dann technische
   * Voraussetzung, dann die iOS-Besonderheit, zuletzt eine frueher erteilte
   * Ablehnung. So bekommt der Nutzer den Grund genannt, der ihn betrifft.
   */
  unavailableReason(): PushUnavailableReason | null {
    if (!this.config.vapidPublicKey) {
      return 'notConfigured';
    }
    if (!this.swPush.isEnabled) {
      return 'noServiceWorker';
    }
    // Auf iOS gibt es die Notification-API nur in der installierten PWA. Im
    // Safari-Tab fehlt sie ganz, deshalb hier und nicht bei 'denied'.
    if (typeof Notification === 'undefined') {
      return 'needsInstall';
    }
    if (Notification.permission === 'denied') {
      return 'denied';
    }
    return null;
  }

  /** Hat dieses Geraet schon eine Registrierung. */
  async isSubscribed(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }
    const subscription = await firstValueFrom(this.swPush.subscription);
    return !!subscription;
  }

  /**
   * Fragt die Berechtigung an und meldet das Geraet beim Backend an.
   *
   * Wird bewusst erst im Moment des Queue-Beitritts aufgerufen und nicht beim
   * Laden der Anwendung: eine Berechtigungsabfrage ohne erkennbaren Anlass wird
   * verlaesslich abgelehnt, und eine Ablehnung laesst sich nicht zurueckholen.
   *
   * Gibt zurueck, ob am Ende eine Registrierung besteht. Ein Fehlschlag ist
   * kein Grund, den Beitritt abzubrechen.
   */
  async enable(): Promise<boolean> {
    if (this.unavailableReason()) {
      return false;
    }
    if (await this.isSubscribed()) {
      return true;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.config.vapidPublicKey,
      });
      await firstValueFrom(
        this.http.post(`${this.config.apiUrl}/push/subscriptions`, {
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        })
      );
      return true;
    } catch {
      // Abgelehnt oder der Push-Dienst war nicht erreichbar. Beides ist eine
      // gueltige Antwort des Nutzers beziehungsweise der Umgebung.
      return false;
    }
  }

  /** Meldet dieses Geraet ab, auf beiden Seiten. */
  async disable(): Promise<void> {
    const subscription = await firstValueFrom(this.swPush.subscription);
    if (!subscription) {
      return;
    }
    // Erst das Backend, dann lokal: schlaegt der Aufruf fehl, bleibt die
    // Registrierung bestehen und der Nutzer kann es erneut versuchen.
    await firstValueFrom(
      this.http.request('delete', `${this.config.apiUrl}/push/subscriptions`, {
        body: { endpoint: subscription.endpoint },
      })
    );
    await this.swPush.unsubscribe();
  }

  getPreferences() {
    return this.http.get<INotificationPreferences>(
      `${this.config.apiUrl}/push/preferences`
    );
  }

  updatePreferences(patch: Partial<INotificationPreferences>) {
    return this.http.patch<INotificationPreferences>(
      `${this.config.apiUrl}/push/preferences`,
      patch
    );
  }

  /**
   * Ein Klick auf eine Benachrichtigung soll dorthin fuehren, wovon sie
   * handelt. Das Ziel steht in `data.url`, gesetzt vom Backend.
   */
  private followNotificationClicks(): void {
    if (!this.swPush.isEnabled) {
      return;
    }
    this.swPush.notificationClicks.subscribe(({ notification }) => {
      const url = (notification.data as { url?: string } | undefined)?.url;
      if (url) {
        void this.router.navigateByUrl(url);
      }
    });
  }
}
