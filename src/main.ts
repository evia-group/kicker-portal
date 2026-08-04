import 'hammerjs';
import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { APP_CONFIG, AppConfig } from './app/core/app-config';

fetch('config.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`config.json: HTTP ${response.status}`);
    }
    return response.json();
  })
  .then((config: AppConfig) => {
    if (config.production) {
      enableProdMode();
    }

    return platformBrowserDynamic([
      { provide: APP_CONFIG, useValue: config },
    ]).bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection()],
    });
  })
  .catch((err) => {
    console.error(err);
    // Ohne Konfiguration startet die Anwendung nicht. Vorher blieb dann eine
    // weisse Seite zurueck und nur die Konsole wusste warum. Der Service Worker
    // haelt die letzte bekannte Fassung vor (dataGroup "runtime-config"), dieser
    // Fall tritt also nur beim allerersten Start ohne Netz ein.
    showStartupFailure();
  });

function showStartupFailure(): void {
  const root = document.querySelector('app-root');
  if (!root) {
    return;
  }
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = [
    'font-family:Arial,Helvetica,sans-serif',
    'color:#ffffff',
    'background:#05060a',
    'padding:24px',
    'max-width:36rem',
    'margin:15vh auto 0',
    'text-align:center',
    'line-height:1.5',
  ].join(';');
  // Bewusst ohne ngx-translate: die Uebersetzungen kommen erst mit der
  // Anwendung, die hier gerade nicht startet.
  box.innerHTML =
    '<p style="color:#bee600;font-weight:700;margin:0 0 8px">' +
    'Die Anwendung konnte nicht geladen werden.</p>' +
    '<p style="color:#eeeeee;margin:0">Bitte Netzwerkverbindung pruefen und ' +
    'neu laden. / Please check your connection and reload.</p>';
  root.appendChild(box);
}
