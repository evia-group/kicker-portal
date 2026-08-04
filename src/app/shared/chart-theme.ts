/**
 * Zentrale Chart-Farben und -Achsenstile im evia Corporate Design.
 *
 * Chart.js zeichnet auf ein Canvas und kann deshalb keine CSS-Variablen
 * auswerten. Statt die Brand-Hexwerte hier ein zweites Mal zu hinterlegen,
 * werden sie einmalig aus den `--evia-*` Custom Properties gelesen, die
 * `src/styles/_theme.scss` auf `:root` setzt. Das Theme bleibt damit die
 * einzige Quelle der Wahrheit.
 */

/** Fallbacks greifen nur, wenn kein Dokument existiert (Prerender, Unit-Test). */
const FALLBACKS: Record<string, string> = {
  '--evia-green': '#bee600',
  '--evia-cyan': '#00e7ff',
  '--evia-pink': '#ff00ac',
  '--evia-gray': '#eeeeee',
  '--evia-error': '#ef3f33',
};

let resolved: Map<string, string> | null = null;

function cssVar(name: string): string {
  if (!resolved) {
    resolved = new Map();
  }
  const cached = resolved.get(name);
  if (cached) {
    return cached;
  }

  let value = '';
  if (typeof document !== 'undefined' && document.documentElement) {
    value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }
  const result = value || FALLBACKS[name] || '#ffffff';
  resolved.set(name, result);
  return result;
}

/**
 * Erzeugt aus einem sechsstelligen Hexwert eine rgba-Angabe. Andere Notationen
 * werden unveraendert zurueckgegeben, damit ein abweichender Token-Wert das
 * Chart nicht zum Absturz bringt.
 */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) {
    return color;
  }
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Deckkraft der Balken- und Segmentflaechen. Rand und Hover sind voll deckend. */
const AREA_ALPHA = 0.7;

/**
 * Diverging-Skala fuer Ergebnisse, von "klar gewonnen" bis "klar verloren".
 * Die Enden sind die semantischen Anker (Brand-Gruen, Signalrot), die Mitten
 * sind Tonwerte 70 aus den generierten M3-Paletten in
 * `src/styles/_theme-colors.scss` und damit ebenfalls aus dem CD abgeleitet.
 */
const RESULT_SCALE_MIDS = {
  winNarrow: '#97b800',
  lossNarrow: '#ff8a7b',
} as const;

export const chartTheme = {
  /** Achsenbeschriftungen und Legendentext. Laut CD Sekundaertext. */
  get tickColor(): string {
    return cssVar('--evia-gray');
  },

  /**
   * Gitterlinien. Das CD sieht fuer Trennlinien #222233 vor, was auf schwarzem
   * Grund bei 1,4:1 liegt und im Chart nicht mehr wahrnehmbar waere. Deshalb
   * die Brand-Grauwert-Ableitung mit reduzierter Deckkraft: dezent, aber
   * sichtbar, und ohne fremden Farbwert.
   */
  get gridColor(): string {
    return withAlpha(cssVar('--evia-gray'), 0.16);
  },

  /** Positiv, Siege. */
  get positive(): string {
    return cssVar('--evia-green');
  },

  /** Negativ, Niederlagen. */
  get negative(): string {
    return cssVar('--evia-error');
  },

  /** Neutrale Messreihen (Spielzeit, Anzahl Spiele). Laut CD Charts = Cyan. */
  get neutral(): string {
    return cssVar('--evia-cyan');
  },

  /** Abgeleitete Kennzahlen wie die Siegquote. Laut CD Prioritaet = Pink. */
  get emphasis(): string {
    return cssVar('--evia-pink');
  },

  /** Vierstufige Ergebnisskala: 2:0, 2:1, 1:2, 0:2. */
  get resultScale(): string[] {
    return [
      cssVar('--evia-green'),
      RESULT_SCALE_MIDS.winNarrow,
      RESULT_SCALE_MIDS.lossNarrow,
      cssVar('--evia-error'),
    ];
  },

  /** Flaechenfarbe einer Serie (teiltransparent). */
  area(color: string): string {
    return withAlpha(color, AREA_ALPHA);
  },

  /** Flaechenfarben mehrerer Serien. */
  areas(colors: string[]): string[] {
    return colors.map((color) => withAlpha(color, AREA_ALPHA));
  },

  /**
   * Legenden-Grundkonfiguration fuer Chart.js. Fuer Achsen gibt es bewusst
   * keinen Helfer: `ticks` traegt je Chart eigene Callbacks, und ein Helfer mit
   * Spread-Overrides wuerde die Farbe stillschweigend verschlucken, sobald ein
   * Aufrufer `ticks` mitgibt.
   */
  legend() {
    return { labels: { color: chartTheme.tickColor, boxWidth: 20 } };
  },
};
