import { describe, expect, it } from 'vitest';
import { chartTheme } from './chart-theme';
import { resultKeys } from './game-rules';

/**
 * Ohne angelegtes Stylesheet greifen die Fallbacks im Modul, die Farbwerte hier
 * sind also die Brand-Werte aus `FALLBACKS`. Genau das soll auch geprueft
 * werden: dass ein Diagramm auch ohne aufgeloeste Custom Properties nicht in
 * fremden Farben rendert.
 */
describe('chartTheme.resultScale', () => {
  it('hat so viele Farben wie es Ergebnisse gibt', () => {
    for (const roundsToWin of [1, 2, 3, 5]) {
      expect(chartTheme.resultScale(roundsToWin)).toHaveLength(
        resultKeys(roundsToWin).length
      );
    }
  });

  it('reproduziert die vier bisherigen Kicker-Farben', () => {
    expect(chartTheme.resultScale(2)).toEqual([
      '#bee600',
      '#97b800',
      '#ff8a7b',
      '#ef3f33',
    ]);
  });

  it('verankert die Enden bei Brand-Gruen und Signalrot', () => {
    for (const roundsToWin of [2, 3, 5]) {
      const scale = chartTheme.resultScale(roundsToWin);
      expect(scale[0]).toBe('#bee600');
      expect(scale[scale.length - 1]).toBe('#ef3f33');
    }
  });

  it('liefert bei einem Rundensieg nur die beiden Anker', () => {
    expect(chartTheme.resultScale(1)).toEqual(['#bee600', '#ef3f33']);
  });

  it('gibt ausschliesslich sechsstellige Hexwerte zurueck', () => {
    for (const color of chartTheme.resultScale(3)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('chartTheme.area', () => {
  it('macht aus einem Hexwert eine rgba-Angabe', () => {
    expect(chartTheme.area('#bee600')).toBe('rgba(190, 230, 0, 0.7)');
  });

  it('laesst eine unbekannte Notation unveraendert', () => {
    // Ein abweichender Token-Wert darf das Diagramm nicht zum Absturz bringen.
    expect(chartTheme.area('rgb(1,2,3)')).toBe('rgb(1,2,3)');
    expect(chartTheme.area('')).toBe('');
  });

  it('behaelt bei areas die Reihenfolge', () => {
    const scale = chartTheme.resultScale(2);
    const areas = chartTheme.areas(scale);
    expect(areas).toHaveLength(scale.length);
    expect(areas[0]).toBe('rgba(190, 230, 0, 0.7)');
  });
});

describe('chartTheme Achsen und Legende', () => {
  it('nutzt den Sekundaertext fuer Beschriftungen', () => {
    expect(chartTheme.tickColor).toBe('#eeeeee');
  });

  it('zeichnet Gitterlinien teiltransparent, damit sie dezent bleiben', () => {
    expect(chartTheme.gridColor).toBe('rgba(238, 238, 238, 0.16)');
  });

  it('gibt eine Legende mit gesetzter Textfarbe zurueck', () => {
    expect(chartTheme.legend()).toEqual({
      labels: { color: '#eeeeee', boxWidth: 20 },
    });
  });

  it('haelt die Rollen auseinander', () => {
    expect(chartTheme.positive).toBe('#bee600');
    expect(chartTheme.negative).toBe('#ef3f33');
    expect(chartTheme.neutral).toBe('#00e7ff');
    expect(chartTheme.emphasis).toBe('#ff00ac');
  });
});
