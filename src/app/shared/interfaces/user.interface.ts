import {DocumentReference} from '@angular/fire/firestore';

export interface IUser {
  name: string;
  id: string;
  wins: number;
  losses: number;
  stats: {
    '0:2': number;
    '2:0': number;
    '1:2': number;
    '2:1': number;
  };
  dominations: number;
  defeats: number;
}

export interface ITeam {
  id?: string;
  name: string;
  players: DocumentReference[];
  wins: number;
  losses: number;
  stats: {
    '0:2': number;
    '2:0': number;
    '1:2': number;
    '2:1': number;
  };
  dominations: number;
  defeats: number;
}

export interface IUserIncrement {
  win: boolean;
  loss: boolean;
  defeat: boolean;
  domination: boolean;
  userId: string;
  statsType: string;
}

export interface ITeamIncrement {
  win: boolean;
  loss: boolean;
  defeat: boolean;
  domination: boolean;
  teamId: string;
  statsType: string;
}
