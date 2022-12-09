import { DocumentReference, Timestamp } from '@angular/fire/firestore';

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

export interface IMatch {
  defeats: DocumentReference[];
  dominations: DocumentReference[];
  players: DocumentReference[];
  result: {
    [teamId: string]: number;
  };
  teams: DocumentReference[];
  type: string;
  date: Timestamp;
}
