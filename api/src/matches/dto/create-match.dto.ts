import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class MatchSideDto {
  /** Ein Spieler im Einzel, zwei im Doppel. Welche Groessen eine Spielart
   *  wirklich zulaesst, steht in `game_types.team_sizes` und wird im Service
   *  geprueft. */
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  playerIds: string[];

  /** Spielartspezifische Kennzahlen, etwa 180er oder Average beim Dart. */
  @IsOptional()
  @IsObject()
  stats?: Record<string, unknown>;
}

export class MatchRoundDto {
  @IsIn([0, 1])
  winnerSide: 0 | 1;

  @IsBoolean()
  domination: boolean;

  /** Feinere Rundendaten, etwa der Legstand. */
  @IsOptional()
  @IsObject()
  detail?: Record<string, unknown>;
}

export class CreateMatchDto {
  /**
   * Schluessel der Spielart, etwa `kicker` oder `darts`. Optional, damit
   * bestehende Clients, die noch nichts von Spielarten wissen, weiter Spiele
   * eintragen koennen; der Service faellt dann auf `kicker` zurueck.
   */
  @IsOptional()
  @IsString()
  gameTypeKey?: string;

  @ValidateNested()
  @Type(() => MatchSideDto)
  side0: MatchSideDto;

  @ValidateNested()
  @Type(() => MatchSideDto)
  side1: MatchSideDto;

  /**
   * Hier stand bisher `@ArrayMaxSize(3)`, also Best of 3 als Konstante im
   * Validator. Die tatsaechliche Grenze haengt an der Spielart im Body und ist
   * einem Dekorator nicht zugaenglich, ohne die Datenbank zu befragen. Die
   * obere Schranke hier ist deshalb nur noch ein Missbrauchsschutz; die
   * eigentliche Pruefung macht `validateRounds` im Service gegen das
   * Regelwerk und meldet praezise, was nicht stimmt.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => MatchRoundDto)
  rounds: MatchRoundDto[];
}
