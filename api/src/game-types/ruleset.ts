/**
 * Regelwerk einer Spielart als reine Funktionen.
 *
 * Alles leitet sich aus `roundsToWin` ab, damit es keine zwei Zahlen gibt, die
 * einander widersprechen koennen. Ohne Abhaengigkeit auf Nest oder die
 * Datenbank, damit die Regeln direkt testbar sind.
 */

export interface Ruleset {
  key: string;
  roundsToWin: number;
  supportsDomination: boolean;
  teamSizes: number[];
  eloMarginStep: number;
}

/** Wer gewinnt, braucht mindestens so viele Runden. */
export function minRounds(ruleset: Pick<Ruleset, 'roundsToWin'>): number {
  return ruleset.roundsToWin;
}

/** Mehr Runden als das kann kein Spiel haben: Best of 3 sind hoechstens 3. */
export function maxRounds(ruleset: Pick<Ruleset, 'roundsToWin'>): number {
  return ruleset.roundsToWin * 2 - 1;
}

export interface RoundLike {
  winnerSide: 0 | 1;
  domination?: boolean;
}

/**
 * Prueft eine Rundenfolge gegen das Regelwerk und liefert die Fehlermeldung
 * oder null. Absichtlich strenger als eine reine Laengenpruefung: eine Folge
 * wie 2:0 mit drei Runden ist nicht "zu lang", sie ist unmoeglich, weil nach
 * dem zweiten Sieg nicht weitergespielt wird.
 */
export function validateRounds(
  ruleset: Ruleset,
  rounds: RoundLike[],
): string | null {
  const needed = ruleset.roundsToWin;
  const limit = maxRounds(ruleset);

  if (rounds.length < needed || rounds.length > limit) {
    return `${ruleset.key} needs between ${needed} and ${limit} rounds, got ${rounds.length}`;
  }

  const won: [number, number] = [0, 0];
  for (const round of rounds) {
    won[round.winnerSide]++;
  }

  const winner = won[0] > won[1] ? 0 : 1;
  const loser = 1 - winner;

  if (won[winner] !== needed) {
    return `${ruleset.key} is decided at ${needed} rounds, but the winning side has ${won[winner]}`;
  }
  if (won[loser] >= needed) {
    return `both sides cannot reach ${needed} rounds in the same match`;
  }
  if (rounds.length !== needed + won[loser]) {
    return `a ${won[winner]}:${won[loser]} result is ${
      needed + won[loser]
    } rounds, got ${rounds.length}`;
  }
  if (!ruleset.supportsDomination && rounds.some((r) => r.domination)) {
    return `${ruleset.key} has no domination scoring`;
  }

  return null;
}

/** Prueft die Mannschaftsgroesse gegen das Regelwerk. */
export function validateTeamSize(
  ruleset: Ruleset,
  teamSize: number,
): string | null {
  if (!ruleset.teamSizes.includes(teamSize)) {
    return `${ruleset.key} supports team sizes ${ruleset.teamSizes.join(
      ', ',
    )}, got ${teamSize}`;
  }
  return null;
}

/**
 * ELO-Gewicht einer Rundendifferenz.
 *
 * Vorher war das eine Fallunterscheidung mit den festen Werten 1.5 und 1.0 im
 * Frontend (`charts.service.ts:convertValue`), also nur fuer Best of 3 gueltig.
 * Die Formel `1 + (|Differenz| - 1) * step` liefert mit step 0,5 fuer Kicker
 * genau dieselben Werte wie bisher (2:0 -> 1,5 und 2:1 -> 1,0), gilt aber fuer
 * jede Rundenzahl. Bestehende ELO-Werte aendern sich dadurch nicht.
 */
export function eloMarginWeight(ruleset: Ruleset, difference: number): number {
  const magnitude = Math.abs(difference);
  if (magnitude < 1) {
    return 0;
  }
  const weight = 1 + (magnitude - 1) * ruleset.eloMarginStep;
  return difference > 0 ? weight : -weight;
}
