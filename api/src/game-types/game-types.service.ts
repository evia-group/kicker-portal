import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { gameTypes } from '../db/schema';
import { maxRounds, minRounds } from './ruleset';

export type GameType = typeof gameTypes.$inferSelect;

/** Was das Frontend braucht: das Regelwerk plus die daraus abgeleiteten Grenzen,
 *  damit die Ableitung nicht auf beiden Seiten steht. */
export interface GameTypeResponse {
  id: string;
  key: string;
  displayName: string;
  icon: string;
  roundsToWin: number;
  minRounds: number;
  maxRounds: number;
  roundLabelKey: string;
  supportsDomination: boolean;
  teamSizes: number[];
  eloMarginStep: number;
  sortOrder: number;
}

@Injectable()
export class GameTypesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll(): Promise<GameTypeResponse[]> {
    const rows = await this.db
      .select()
      .from(gameTypes)
      .where(eq(gameTypes.isActive, true))
      .orderBy(asc(gameTypes.sortOrder));
    return rows.map((row) => GameTypesService.toResponse(row));
  }

  /** Wirft, wenn der Schluessel unbekannt ist. Ein Spiel ohne gueltige Spielart
   *  darf nicht entstehen, ein stiller Rueckfall auf Kicker waere schlimmer. */
  async requireByKey(key: string): Promise<GameType> {
    const [row] = await this.db
      .select()
      .from(gameTypes)
      .where(eq(gameTypes.key, key));
    if (!row) {
      throw new BadRequestException(`Unknown game type "${key}"`);
    }
    if (!row.isActive) {
      throw new BadRequestException(`Game type "${key}" is not active`);
    }
    return row;
  }

  static toResponse(row: GameType): GameTypeResponse {
    return {
      id: row.id,
      key: row.key,
      displayName: row.displayName,
      icon: row.icon,
      roundsToWin: row.roundsToWin,
      minRounds: minRounds(row),
      maxRounds: maxRounds(row),
      roundLabelKey: row.roundLabelKey,
      supportsDomination: row.supportsDomination,
      teamSizes: row.teamSizes,
      eloMarginStep: row.eloMarginStep,
      sortOrder: row.sortOrder,
    };
  }
}
