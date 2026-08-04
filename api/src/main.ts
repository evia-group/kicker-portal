import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * `CORS_ORIGIN` darf mehrere Herkunfte enthalten, getrennt durch Komma.
 *
 * Vorher wurde der Wert direkt durchgereicht, also war genau eine moeglich.
 * Gebraucht werden aber mehrere: eine Umgebung kann unter einer eigenen Domain
 * und zusaetzlich unter dem Host-Namen erreichbar sein, und lokal laeuft der
 * Dev-Server auf 4200 waehrend das Produktions-Image auf 8080 antwortet.
 */
function corsOrigin(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) {
    // Ohne Angabe alles erlauben. Nur fuer lokale Entwicklung gedacht, im
    // Container ist die Variable verpflichtend (docker-compose.yml).
    return true;
  }
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: corsOrigin() });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
