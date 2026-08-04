/**
 * Breakpoints fuer `BreakpointObserver`, abgeleitet aus denselben Werten wie
 * die Styles.
 *
 * Die Grenzen stehen in `src/styles/_breakpoints.scss` und werden von dort als
 * `--evia-bp-*` Custom Properties emittiert. Diese Datei liest sie aus, damit
 * es keine zweite Liste von Zahlen gibt, die auseinanderlaufen kann.
 *
 * Die CDK-Konstanten `Breakpoints.XSmall` und `Breakpoints.Handset` werden
 * bewusst nicht verwendet: sie folgen dem alten Material-2-Raster (600/960 px
 * plus Orientierungsabfragen) und passen nicht zu den Window Size Classes.
 */

/** Greift nur, wenn noch kein Stylesheet anliegt (Unit-Test, Prerender). */
const FALLBACKS: Record<string, number> = {
  medium: 600,
  expanded: 840,
  large: 1200,
  'extra-large': 1600,
};

const cache = new Map<string, number>();

function boundary(name: string): number {
  const cached = cache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  let value = NaN;
  if (typeof document !== 'undefined' && document.documentElement) {
    value = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        `--evia-bp-${name}`
      )
    );
  }
  const result = Number.isFinite(value) ? value : FALLBACKS[name];
  cache.set(name, result);
  return result;
}

/**
 * Dieselben 0,02px Abstand wie im SCSS, damit sich `from` und `until` bei
 * gebrochenen Viewport-Breiten nicht ueberlappen.
 */
const EPSILON = 0.02;

/** Ab dieser Klasse aufwaerts. */
export function from(name: keyof typeof FALLBACKS): string {
  return `(min-width: ${boundary(name)}px)`;
}

/** Unterhalb dieser Klasse. */
export function until(name: keyof typeof FALLBACKS): string {
  return `(max-width: ${boundary(name) - EPSILON}px)`;
}

/** Telefon hochkant: die kleinste Window Size Class. */
export function isCompact(): string {
  return until('medium');
}

/**
 * Kein praeziser Zeiger vorhanden. Das ist die Frage, die bei Touch-Bedienung
 * tatsaechlich zaehlt, und nicht "welcher UserAgent".
 */
export const COARSE_POINTER = '(hover: none) and (pointer: coarse)';
