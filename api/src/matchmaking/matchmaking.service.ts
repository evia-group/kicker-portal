import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, asc, eq, inArray, lt } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import {
  gameTypes,
  matchProposalPlayers,
  matchProposals,
  queueEntries,
  users,
} from '../db/schema';
import { GameTypesService } from '../game-types/game-types.service';
import { validateTeamSize } from '../game-types/ruleset';
import { MatchmakingGateway } from './matchmaking.gateway';

/**
 * Wie lange ein Eintrag in der Warteschlange gilt. Lang genug fuer eine
 * Mittagspause, kurz genug, dass niemand von gestern noch drinsteht.
 */
const QUEUE_TTL_MINUTES = 90;

/**
 * Wie lange ein Vorschlag auf Antworten wartet. Kurz, weil die anderen
 * Wartenden in dieser Zeit blockiert sind.
 */
const PROPOSAL_TTL_SECONDS = 120;

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gameTypesService: GameTypesService,
    private readonly gateway: MatchmakingGateway,
  ) {}

  async join(userId: string, gameTypeKey: string, teamSize: number) {
    const gameType = await this.gameTypesService.requireByKey(gameTypeKey);

    const error = validateTeamSize(gameType, teamSize);
    if (error) {
      throw new BadRequestException(error);
    }

    const expiresAt = new Date(Date.now() + QUEUE_TTL_MINUTES * 60_000);

    // Der partielle Unique-Index laesst nur einen wartenden Eintrag je Nutzer
    // und Spielart zu. Ein erneuter Beitritt aktualisiert deshalb den
    // bestehenden Eintrag, statt zu scheitern: wer die gesuchte
    // Mannschaftsgroesse aendert, will nicht erst austreten muessen.
    const existing = await this.db
      .select()
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.userId, userId),
          eq(queueEntries.gameTypeId, gameType.id),
          eq(queueEntries.status, 'waiting'),
        ),
      );

    if (existing.length > 0) {
      await this.db
        .update(queueEntries)
        .set({ teamSize, expiresAt, joinedAt: existing[0].joinedAt })
        .where(eq(queueEntries.id, existing[0].id));
    } else {
      await this.db
        .insert(queueEntries)
        .values({ userId, gameTypeId: gameType.id, teamSize, expiresAt });
    }

    await this.publishQueue(gameType.key, gameType.id);
    await this.tryMatch(gameType.key, gameType.id, teamSize);
    return { status: 'waiting' as const };
  }

  async leave(userId: string, gameTypeKey?: string) {
    const conditions = [
      eq(queueEntries.userId, userId),
      eq(queueEntries.status, 'waiting'),
    ];
    let gameType: { id: string; key: string } | undefined;
    if (gameTypeKey) {
      gameType = await this.gameTypesService.requireByKey(gameTypeKey);
      conditions.push(eq(queueEntries.gameTypeId, gameType.id));
    }

    await this.db
      .update(queueEntries)
      .set({ status: 'cancelled' })
      .where(and(...conditions));

    if (gameType) {
      await this.publishQueue(gameType.key, gameType.id);
    } else {
      await this.publishAllQueues();
    }
    return { status: 'cancelled' as const };
  }

  /** Wartende einer Spielart, oder aller Spielarten ohne Angabe. */
  async list(gameTypeKey?: string) {
    if (gameTypeKey) {
      const gameType = await this.gameTypesService.requireByKey(gameTypeKey);
      return [await this.snapshot(gameType.key, gameType.id)];
    }
    const all = await this.db.select().from(gameTypes);
    return Promise.all(all.map((g) => this.snapshot(g.key, g.id)));
  }

  async respond(
    proposalId: string,
    userId: string,
    response: 'accepted' | 'declined',
  ) {
    const [proposal] = await this.db
      .select()
      .from(matchProposals)
      .where(eq(matchProposals.id, proposalId));
    if (!proposal) {
      throw new NotFoundException('Unknown proposal');
    }
    if (proposal.status !== 'pending') {
      throw new BadRequestException(
        `Proposal is already ${proposal.status}, cannot respond`,
      );
    }

    const players = await this.db
      .select()
      .from(matchProposalPlayers)
      .where(eq(matchProposalPlayers.proposalId, proposalId));

    // Hier liegt die Sicherheitsgrenze: der WebSocket verteilt Vorschlaege an
    // alle, aber antworten darf nur, wer selbst darin steht.
    if (!players.some((p) => p.userId === userId)) {
      throw new BadRequestException('You are not part of this proposal');
    }

    await this.db
      .update(matchProposalPlayers)
      .set({ response })
      .where(
        and(
          eq(matchProposalPlayers.proposalId, proposalId),
          eq(matchProposalPlayers.userId, userId),
        ),
      );

    const updated = players.map((p) =>
      p.userId === userId ? { ...p, response } : p,
    );

    if (response === 'declined') {
      await this.resolveProposal(proposal, updated, 'declined');
      return { status: 'declined' as const };
    }

    if (updated.every((p) => p.response === 'accepted')) {
      await this.resolveProposal(proposal, updated, 'accepted');
      return { status: 'accepted' as const };
    }

    return { status: 'pending' as const };
  }

  /**
   * Der Tisch ist frei geworden. Wird vom Kicker-Modul aufgerufen, sobald eine
   * Sitzung endet, und ist damit der natuerliche Anlass, die Wartenden zu
   * erinnern.
   */
  announceTableFree(gameTypeKey: string): void {
    this.gateway.broadcastTableFree(gameTypeKey);
  }

  /**
   * Raeumt abgelaufene Eintraege und Vorschlaege auf. Ohne diesen Lauf wuerde
   * ein unbeantworteter Vorschlag die Wartenden dauerhaft blockieren.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireStale() {
    const now = new Date();

    const expiredProposals = await this.db
      .select()
      .from(matchProposals)
      .where(
        and(
          eq(matchProposals.status, 'pending'),
          lt(matchProposals.expiresAt, now),
        ),
      );

    for (const proposal of expiredProposals) {
      const players = await this.db
        .select()
        .from(matchProposalPlayers)
        .where(eq(matchProposalPlayers.proposalId, proposal.id));
      await this.resolveProposal(proposal, players, 'expired');
    }

    const expiredEntries = await this.db
      .update(queueEntries)
      .set({ status: 'expired' })
      .where(
        and(
          eq(queueEntries.status, 'waiting'),
          lt(queueEntries.expiresAt, now),
        ),
      )
      .returning({ id: queueEntries.id });

    if (expiredEntries.length > 0) {
      this.logger.log(`${expiredEntries.length} queue entries expired`);
      await this.publishAllQueues();
    }
  }

  /**
   * Sucht eine Paarung nach dem Prinzip "wer am laengsten wartet, zuerst".
   *
   * Bewusst kein Ausgleich nach Spielstaerke in dieser Fassung: dafuer braeuchte
   * es eine Vorstellung davon, was eine faire Paarung ist, und die waere ohne
   * Nutzungsdaten geraten. FIFO ist nachvollziehbar und fuehlt sich gerecht an.
   */
  private async tryMatch(
    gameTypeKey: string,
    gameTypeId: string,
    teamSize: number,
  ) {
    const needed = teamSize * 2;

    const waiting = await this.db
      .select()
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.gameTypeId, gameTypeId),
          eq(queueEntries.teamSize, teamSize),
          eq(queueEntries.status, 'waiting'),
        ),
      )
      .orderBy(asc(queueEntries.joinedAt));

    if (waiting.length < needed) {
      return;
    }

    const chosen = waiting.slice(0, needed);
    const expiresAt = new Date(Date.now() + PROPOSAL_TTL_SECONDS * 1000);

    const proposal = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(matchProposals)
        .values({ gameTypeId, teamSize, expiresAt })
        .returning();

      await tx.insert(matchProposalPlayers).values(
        chosen.map((entry) => ({
          proposalId: created.id,
          userId: entry.userId,
        })),
      );

      // Die Ausgewaehlten sind aus der Warteschlange heraus, solange der
      // Vorschlag laeuft. Sonst koennten sie parallel in einen zweiten geraten.
      await tx
        .update(queueEntries)
        .set({ status: 'matched', proposalId: created.id })
        .where(
          inArray(
            queueEntries.id,
            chosen.map((entry) => entry.id),
          ),
        );

      return created;
    });

    const names = await this.namesFor(chosen.map((entry) => entry.userId));

    this.gateway.broadcastProposal({
      proposalId: proposal.id,
      gameTypeKey,
      teamSize,
      expiresAt: expiresAt.toISOString(),
      players: chosen.map((entry) => ({
        userId: entry.userId,
        userName: names.get(entry.userId) ?? entry.userId,
        response: 'pending',
      })),
    });

    await this.publishQueue(gameTypeKey, gameTypeId);
  }

  /**
   * Schliesst einen Vorschlag ab. Bei Ablehnung oder Ablauf kommen alle, die
   * nicht selbst abgelehnt haben, zurueck in die Warteschlange: sie haben ihren
   * Platz nicht verspielt, nur weil jemand anderes nicht kann.
   */
  private async resolveProposal(
    proposal: typeof matchProposals.$inferSelect,
    players: typeof matchProposalPlayers.$inferSelect[],
    status: 'accepted' | 'declined' | 'expired',
  ) {
    const [gameType] = await this.db
      .select()
      .from(gameTypes)
      .where(eq(gameTypes.id, proposal.gameTypeId));

    await this.db.transaction(async (tx) => {
      await tx
        .update(matchProposals)
        .set({ status })
        .where(eq(matchProposals.id, proposal.id));

      if (status === 'accepted') {
        // Die Eintraege bleiben auf `matched`. Das Spiel selbst entsteht erst,
        // wenn das Ergebnis eingetragen wird, deshalb wird hier kein Match
        // angelegt.
        return;
      }

      const returning = players
        .filter((p) => p.response !== 'declined')
        .map((p) => p.userId);
      const decliners = players
        .filter((p) => p.response === 'declined')
        .map((p) => p.userId);

      if (returning.length > 0) {
        await tx
          .update(queueEntries)
          .set({ status: 'waiting', proposalId: null })
          .where(
            and(
              eq(queueEntries.proposalId, proposal.id),
              inArray(queueEntries.userId, returning),
            ),
          );
      }
      if (decliners.length > 0) {
        await tx
          .update(queueEntries)
          .set({ status: 'cancelled' })
          .where(
            and(
              eq(queueEntries.proposalId, proposal.id),
              inArray(queueEntries.userId, decliners),
            ),
          );
      }
    });

    this.gateway.broadcastProposalResolved(proposal.id, status);

    if (gameType) {
      await this.publishQueue(gameType.key, gameType.id);
      if (status !== 'accepted') {
        // Nach dem Zurueckstellen kann sofort eine neue Paarung moeglich sein.
        await this.tryMatch(gameType.key, gameType.id, proposal.teamSize);
      }
    }
  }

  private async snapshot(gameTypeKey: string, gameTypeId: string) {
    const rows = await this.db
      .select({
        userId: queueEntries.userId,
        userName: users.name,
        teamSize: queueEntries.teamSize,
        joinedAt: queueEntries.joinedAt,
      })
      .from(queueEntries)
      .innerJoin(users, eq(users.id, queueEntries.userId))
      .where(
        and(
          eq(queueEntries.gameTypeId, gameTypeId),
          eq(queueEntries.status, 'waiting'),
        ),
      )
      .orderBy(asc(queueEntries.joinedAt));

    return {
      gameTypeKey,
      entries: rows.map((row) => ({
        userId: row.userId,
        userName: row.userName,
        teamSize: row.teamSize,
        joinedAt: row.joinedAt.toISOString(),
      })),
    };
  }

  private async publishQueue(gameTypeKey: string, gameTypeId: string) {
    this.gateway.broadcastQueue(await this.snapshot(gameTypeKey, gameTypeId));
  }

  private async publishAllQueues() {
    for (const snapshot of await this.list()) {
      this.gateway.broadcastQueue(snapshot);
    }
  }

  private async namesFor(userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, string>();
    }
    const rows = await this.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, userIds));
    return new Map(rows.map((row) => [row.id, row.name]));
  }
}
