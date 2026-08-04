import { defineConfig } from 'vitest/config';

/**
 * Vitest laeuft hier direkt und nicht ueber `ng test`.
 *
 * Grund: der `@angular/build:unit-test`-Builder erzeugt ein Test-Setup mit
 * Top-Level-await (`await import('zone.js/testing')`), und esbuild lehnt das im
 * Format ab, in dem der Builder das Testbundle schreibt. Der Lauf bricht
 * deshalb ab, bevor ein einziger Test ausgefuehrt wird. Der Aufruf bleibt als
 * `npm run test:ng` erhalten, damit das nach einem Angular-Update leicht
 * nachgeprueft werden kann.
 *
 * Fuer die vorhandenen Tests ist das kein Verlust: sie pruefen reine Funktionen
 * und brauchen kein Angular-Test-Bed. Sobald Komponententests dazukommen, muss
 * der Builder wieder funktionieren, dafuer steht ein eigener Vorgang.
 *
 * Umgebung `node`, also ohne DOM. Das ist bei `chart-theme` sogar der
 * interessantere Fall: ohne aufgeloeste Custom Properties muessen die
 * Brand-Fallbacks greifen, und genau das pruefen die Tests.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    reporters: ['default'],
  },
});
