/** Antwortform von `GET /game-types`. Das Regelwerk einer Disziplin. */
export interface IGameType {
  id: string;
  /** Stabiler Schluessel, wird auch in Routen und API-Parametern verwendet. */
  key: string;
  displayName: string;
  /** Name eines Material-Symbols. */
  icon: string;
  /** Erste Seite mit so vielen gewonnenen Runden gewinnt. */
  roundsToWin: number;
  /** Vom Backend abgeleitet, damit die Rechnung nicht doppelt existiert. */
  minRounds: number;
  maxRounds: number;
  /** i18n-Key fuer die Rundenbezeichnung (Runde beim Kicker, Leg beim Dart). */
  roundLabelKey: string;
  supportsDomination: boolean;
  teamSizes: number[];
  eloMarginStep: number;
  sortOrder: number;
}
