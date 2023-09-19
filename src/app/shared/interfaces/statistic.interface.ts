export interface ILeaderboard {
  name: string;
  wins: number;
  losses: number;
  dominations: number;
  defeats: number;
  '2:0': number;
  '2:1': number;
  '1:2': number;
  '0:2': number;
  totalMatches: number;
  diff: number;
  elo: number;
  rank: number;
  winsTimeline: Map<number, number[]>;
  lossesTimeline: Map<number, number[]>;
}
