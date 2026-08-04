import { IPlayers } from './match.interface';

export interface IUser {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface ITeam {
  id: string;
  name: string;
  players: IPlayers[];
}
