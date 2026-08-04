import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class MatchSideDto {
  /** One player id for a single (1v1) match, two for a team match. */
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  playerIds: string[];
}

export class MatchRoundDto {
  @IsIn([0, 1])
  winnerSide: 0 | 1;

  @IsBoolean()
  domination: boolean;
}

export class CreateMatchDto {
  @ValidateNested()
  @Type(() => MatchSideDto)
  side0: MatchSideDto;

  @ValidateNested()
  @Type(() => MatchSideDto)
  side1: MatchSideDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => MatchRoundDto)
  rounds: MatchRoundDto[];
}
