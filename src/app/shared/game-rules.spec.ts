import { describe, expect, it } from 'vitest';
import { eloMarginWeight, resultKeys } from './game-rules';

describe('resultKeys', () => {
  it('liefert fuer Kicker die vier Ergebnisse als Verlauf', () => {
    // Reihenfolge ist Teil des Vertrags: Tabellenspalten, Kopfzeilen und die
    // Farbskala der Diagramme leiten sich alle daraus ab.
    expect(resultKeys(2)).toEqual(['2:0', '2:1', '1:2', '0:2']);
  });

  it('liefert fuer Dart sechs Ergebnisse in derselben Ordnung', () => {
    expect(resultKeys(3)).toEqual(['3:0', '3:1', '3:2', '2:3', '1:3', '0:3']);
  });

  it('beginnt mit dem klarsten Sieg und endet mit der klarsten Niederlage', () => {
    for (const roundsToWin of [1, 2, 3, 4, 5]) {
      const keys = resultKeys(roundsToWin);
      expect(keys[0]).toBe(`${roundsToWin}:0`);
      expect(keys[keys.length - 1]).toBe(`0:${roundsToWin}`);
    }
  });

  it('hat je Seite genau so viele Ergebnisse wie Rundensiege', () => {
    for (const roundsToWin of [1, 2, 3, 5]) {
      const keys = resultKeys(roundsToWin);
      expect(keys).toHaveLength(roundsToWin * 2);
      const wins = keys.filter((k) => k.startsWith(`${roundsToWin}:`));
      expect(wins).toHaveLength(roundsToWin);
    }
  });

  it('enthaelt keine Ergebnisse doppelt', () => {
    const keys = resultKeys(3);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('eloMarginWeight', () => {
  it('reproduziert die bisherigen Kicker-Gewichte', () => {
    // Diese vier Werte standen vorher als Fallunterscheidung in
    // charts.service.ts. Wenn sie sich aendern, aendern sich alle
    // angezeigten ELO-Zahlen, deshalb festgenagelt.
    expect(eloMarginWeight(0.5, 2)).toBe(1.5);
    expect(eloMarginWeight(0.5, 1)).toBe(1);
    expect(eloMarginWeight(0.5, -1)).toBe(-1);
    expect(eloMarginWeight(0.5, -2)).toBe(-1.5);
  });

  it('wertet ein Unentschieden mit null', () => {
    expect(eloMarginWeight(0.5, 0)).toBe(0);
  });

  it('skaliert auf hoehere Rundenzahlen', () => {
    // Dart, best of 5: 3:0 ist eine Differenz von 3.
    expect(eloMarginWeight(0.5, 3)).toBe(2);
    expect(eloMarginWeight(0.5, -3)).toBe(-2);
  });

  it('ist punktsymmetrisch', () => {
    for (const difference of [1, 2, 3, 7]) {
      expect(eloMarginWeight(0.5, difference)).toBe(
        -eloMarginWeight(0.5, -difference)
      );
    }
  });

  it('beachtet einen abweichenden Zuschlag', () => {
    expect(eloMarginWeight(0, 3)).toBe(1);
    expect(eloMarginWeight(1, 3)).toBe(3);
  });
});
