import 'hammerjs';
import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { APP_CONFIG, AppConfig } from './app/core/app-config';

fetch('config.json')
  .then((response) => response.json())
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
  .catch((err) => console.error(err));
