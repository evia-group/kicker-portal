/** Response shape of GET /leaderboard/teams and GET /leaderboard/users. */
export interface ILeaderboardEntry {
  id: string;
  wins: number;
  losses: number;
  dominations: number;
  defeats: number;
  stats: Record<string, number>;
  totalMatches: number;
}

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

export interface IPlaytime {
  /** ISO-8601-Zeitstempel, so wie `GET /playtime` sie liefert. Bewusst kein
   *  Epochenwert: die Firestore-Variante speicherte Sekunden, das Backend
   *  liefert seit der Umstellung Zeitstempel. */
  startTime: string;
  endTime: string;
}
