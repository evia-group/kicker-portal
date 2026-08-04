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
 * Endpunkte der Ergebnisskala auf der Verlierer-Seite. Die Gewinner-Seite
 * verankert das Brand-Gruen, die Verlierer-Seite das Signalrot; dazwischen wird
 * interpoliert. Die Zwischenwerte entsprechen fuer die vierstufige
 * Kicker-Skala den Tonwerten 70 der generierten M3-Paletten in
 * `src/styles/_theme-colors.scss`.
 */
const RESULT_SCALE_INNER = {
  win: '#97b800',
  loss: '#ff8a7b',
} as const;

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) {
    return null;
  }
  const int = parseInt(match[1], 16);
  return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Lineare Interpolation zwischen zwei Hexfarben. */
function mix(from: string, to: string, ratio: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) {
    return from;
  }
  return toHex([
    a[0] + (b[0] - a[0]) * ratio,
    a[1] + (b[1] - a[1]) * ratio,
    a[2] + (b[2] - a[2]) * ratio,
  ]);
}

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

  /**
   * Ergebnisskala als Verlauf vom klarsten Sieg zur klarsten Niederlage, passend
   * zur Reihenfolge aus `resultKeys()`. `winCount` ist die Zahl der
   * Siegergebnisse, also `roundsToWin`: 2 beim Kicker (vier Stufen), 3 beim Dart
   * (sechs Stufen). Vorher waren es vier festverdrahtete Farben, womit eine
   * Spielart mit mehr Ergebnissen ohne Farben dagestanden haette.
   */
  resultScale(winCount: number): string[] {
    const green = cssVar('--evia-green');
    const error = cssVar('--evia-error');
    const wins: string[] = [];
    const losses: string[] = [];
    for (let step = 0; step < winCount; step++) {
      // Bei nur einer Stufe je Seite bleibt es beim reinen Ankerwert.
      const ratio = winCount === 1 ? 0 : step / (winCount - 1);
      wins.push(mix(green, RESULT_SCALE_INNER.win, ratio));
      losses.unshift(mix(error, RESULT_SCALE_INNER.loss, ratio));
    }
    return [...wins, ...losses];
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
