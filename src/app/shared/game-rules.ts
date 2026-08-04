/**
 * Ableitungen aus dem Regelwerk einer Spielart.
 *
 * Spiegelt `api/src/game-types/ruleset.ts`. Bewusst als reine Funktionen ohne
 * Angular-Abhaengigkeit, damit die Regeln direkt testbar sind.
 */

/**
 * Alle moeglichen Endergebnisse einer Spielart als `eigene:fremde` Schluessel,
 * als durchgehender Verlauf vom klarsten Sieg bis zur klarsten Niederlage.
 *
 * Kicker (roundsToWin 2): 2:0, 2:1, 1:2, 0:2
 * Dart   (roundsToWin 3): 3:0, 3:1, 3:2, 2:3, 1:3, 0:3
 *
 * Vorher standen diese vier Schluessel als Konstanten in
 * `shared/global-variables.ts` und wurden dreimal getrennt aufgezaehlt: fuer
 * die Tabellenspalten, fuer die Kopfzeilen und fuer das Doughnut-Diagramm.
 * Tabelle und Doughnut verwendeten dabei zwei unterschiedliche Reihenfolgen,
 * und die Kopfzeilen der Tabelle folgten der Doughnut-Reihenfolge. Dadurch
 * trug die Spalte "0:2" die Ueberschrift "1:2" und umgekehrt. Aus einer Liste
 * abgeleitet kann das nicht mehr auseinanderlaufen, und die Verlaufsreihenfolge
 * passt zugleich zur Farbskala der Diagramme.
 */
export function resultKeys(roundsToWin: number): string[] {
  const wins: string[] = [];
  const losses: string[] = [];
  for (let loserRounds = 0; loserRounds < roundsToWin; loserRounds++) {
    wins.push(`${roundsToWin}:${loserRounds}`);
    // unshift, damit die knappste Niederlage direkt auf den knappsten Sieg
    // folgt und die Reihenfolge ein Verlauf bleibt.
    losses.unshift(`${loserRounds}:${roundsToWin}`);
  }
  return [...wins, ...losses];
}

/**
 * ELO-Gewicht einer Rundendifferenz.
 *
 * Ersetzt die Fallunterscheidung in `charts.service.ts:convertValue`, die die
 * Werte 1.5 und 1.0 fest verdrahtet hatte und damit nur fuer Best of 3 galt.
 * Mit `step` 0,5 liefert die Formel fuer Kicker genau dieselben Werte wie
 * bisher, bestehende ELO-Zahlen aendern sich also nicht.
 */
export function eloMarginWeight(step: number, difference: number): number {
  const magnitude = Math.abs(difference);
  if (magnitude < 1) {
    return 0;
  }
  const weight = 1 + (magnitude - 1) * step;
  return difference > 0 ? weight : -weight;
}
