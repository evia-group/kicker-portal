import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class KickerStatusDto {
  @IsBoolean()
  status: boolean;

  /** Unix seconds, matches the physical kicker table's existing payload. */
  @IsNumber()
  startTime: number;

  /** Present when a session just ended; triggers a playtime entry. */
  @IsOptional()
  @IsNumber()
  endTime?: number;
}
