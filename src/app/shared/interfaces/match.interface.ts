import { UntypedFormControl } from '@angular/forms';
import { IGameType } from './game-type.interface';

export interface IRounds {
  win: boolean;
  loos: boolean;
  domination: boolean;
}

export interface IPlayers {
  id: string;
  name: string;
}

export interface ITeamForm {
  players: IPlayers[];
  wins: number;
  teamId?: string;
  rounds?: IRounds[];
}

export interface IMatchForm {
  teams: ITeamForm[];
}

/** One row per match side (0 or 1). teamId XOR userId is set, depending on isSingle. */
export interface IMatchParticipant {
  id: string;
  matchId: string;
  side: 0 | 1;
  teamId: string | null;
  userId: string | null;
  roundsWon: number;
}

export interface IMatchRound {
  id: string;
  matchId: string;
  roundNo: number;
  winnerSide: 0 | 1;
  domination: boolean;
}

/** Response shape of GET /matches - covers both team and 1v1 matches. */
export interface IMatch {
  id: string;
  playedAt: string;
  /** Abgeleitet aus `teamSize === 1`. Bleibt fuer Kompatibilitaet erhalten. */
  isSingle: boolean;
  /** Spieler pro Seite: 1 im Einzel, 2 im Doppel. */
  teamSize: number;
  gameTypeId: string;
  /** Regelwerk der Spielart. Null nur, wenn ein Datensatz auf eine geloeschte
   *  Spielart zeigt. */
  gameType: IGameType | null;
  participants: IMatchParticipant[];
  rounds: IMatchRound[];
}

export interface ISelectionsData {
  firstPlayerControl: UntypedFormControl;
  secondPlayerControl: UntypedFormControl;
  firstPlayerOptions: any[];
  secondPlayerOptions: any[];
  displayWithFunction;
  placeholderText: string;
  labelText: string;
  teamName: string;
  singleMode: boolean;
}

export interface LastMatches {
  team1: string;
  team2: string;
  result: string;
  date: Date;
}
