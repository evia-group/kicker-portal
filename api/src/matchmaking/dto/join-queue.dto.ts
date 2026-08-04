import { IsIn, IsOptional, IsString } from 'class-validator';

export class JoinQueueDto {
  /** Schluessel der Spielart, etwa `kicker` oder `darts`. */
  @IsString()
  gameTypeKey: string;

  /**
   * Gesuchte Mannschaftsgroesse. Ob die Spielart sie zulaesst, prueft der
   * Service gegen `game_types.team_sizes`.
   */
  @IsIn([1, 2])
  teamSize: 1 | 2;
}

export class RespondProposalDto {
  @IsIn(['accepted', 'declined'])
  response: 'accepted' | 'declined';
}

export class QueueQueryDto {
  @IsOptional()
  @IsString()
  gameType?: string;
}
