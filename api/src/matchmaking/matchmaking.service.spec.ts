import { BadRequestException } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import type { Database } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { GameTypesService } from '../game-types/game-types.service';
import {
  MatchmakingGateway,
  ProposalNotification,
  QueueSnapshot,
} from './matchmaking.gateway';
import { MatchmakingService } from './matchmaking.service';

/**
 * Integrationstest gegen die echte Datenbank.
 *
 * Absichtlich nicht mit einer nachgebauten Datenbank: gepruefst werden soll
 * gerade das Zusammenspiel mit dem partiellen Unique-Index und den
 * Transaktionen, und beides gibt es in einem Mock nicht. Laeuft im
 * api-Container, weil Postgres nur im Docker-Netz erreichbar ist:
 *
 *   docker compose exec api npm test
 *
 * Jeder Lauf legt eigene Nutzer **und eine eigene Spielart** an und raeumt sie
 * hinterher weg. Die eigene Spielart ist wichtig fuer die Isolation:
 * `tryMatch` betrachtet alle Wartenden einer Spielart, ein Test gegen `kicker`
 * wuerde also von fremden Zeilen in der Datenbank abhaengen und je nach
 * Datenstand bestehen oder scheitern. Bestandsdaten werden nicht angefasst.
 */

/** Sammelt, was das Gateway senden wuerde, statt einen Socket zu brauchen. */
class RecordingGateway {
  queues: QueueSnapshot[] = [];
  proposals: ProposalNotification[] = [];
  resolved: { proposalId: string; status: string }[] = [];
  tableFree: string[] = [];

  broadcastQueue(snapshot: QueueSnapshot) {
    this.queues.push(snapshot);
  }
  broadcastProposal(proposal: ProposalNotification) {
    this.proposals.push(proposal);
  }
  broadcastProposalResolved(proposalId: string, status: string) {
    this.resolved.push({ proposalId, status });
  }
  broadcastTableFree(gameTypeKey: string) {
    this.tableFree.push(gameTypeKey);
  }
}

describe('MatchmakingService', () => {
  let db: Database;
  let client: ReturnType<typeof postgres>;
  let service: MatchmakingService;
  let gateway: RecordingGateway;
  let userIds: string[];
  /** Eigene Spielart je Lauf, damit die Warteschlange nur Testdaten enthaelt. */
  let gameTypeId: string;
  let gameTypeKey: string;

  beforeAll(() => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set - run this inside the api container',
      );
    }
    client = postgres(url);
    db = drizzle(client, { schema });
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    gateway = new RecordingGateway();
    service = new MatchmakingService(
      db,
      new GameTypesService(db),
      gateway as unknown as MatchmakingGateway,
    );

    const suffix = `${Date.now()}-${Math.round(process.hrtime()[1] / 1000)}`;

    const created = await db
      .insert(schema.users)
      .values(
        [1, 2, 3, 4, 5].map((n) => ({
          name: `test-mm-${n}`,
          entraOid: `test-mm-oid-${n}-${suffix}`,
        })),
      )
      .returning({ id: schema.users.id });
    userIds = created.map((row) => row.id);

    gameTypeKey = `test-mm-${suffix}`;
    const [gameType] = await db
      .insert(schema.gameTypes)
      .values({
        key: gameTypeKey,
        displayName: 'Test-Spielart',
        icon: 'science',
        roundsToWin: 2,
        roundLabelKey: 'gameType.round',
        supportsDomination: true,
        teamSizes: [1, 2],
        isActive: true,
      })
      .returning({ id: schema.gameTypes.id });
    gameTypeId = gameType.id;
  });

  afterEach(async () => {
    // Reihenfolge nach den Fremdschluesseln, von innen nach aussen.
    //
    // Die Vorschlaege werden ueber die Spielart geloescht und nicht ueber die
    // proposal_id der Queue-Eintraege: nach einem Ablauf entsteht ein zweiter
    // Vorschlag, die Eintraege zeigen dann auf den neuen, und der alte waere
    // ueber sie nicht mehr auffindbar. Er blockiert dann das Loeschen der
    // Spielart.
    await db
      .delete(schema.queueEntries)
      .where(inArray(schema.queueEntries.userId, userIds));
    // match_proposal_players haengt mit onDelete: cascade daran.
    await db
      .delete(schema.matchProposals)
      .where(eq(schema.matchProposals.gameTypeId, gameTypeId));
    await db.delete(schema.users).where(inArray(schema.users.id, userIds));
    await db
      .delete(schema.gameTypes)
      .where(eq(schema.gameTypes.id, gameTypeId));
  });

  it('haelt einen Wartenden ohne Gegner in der Warteschlange', async () => {
    await service.join(userIds[0], gameTypeKey, 1);

    const [snapshot] = await service.list(gameTypeKey);
    const mine = snapshot.entries.filter((e) => userIds.includes(e.userId));
    expect(mine).toHaveLength(1);
    expect(gateway.proposals).toHaveLength(0);
  });

  it('erzeugt einen Vorschlag, sobald genug Spieler warten', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[1], gameTypeKey, 1);

    expect(gateway.proposals).toHaveLength(1);
    expect(gateway.proposals[0].players.map((p) => p.userId).sort()).toEqual(
      [userIds[0], userIds[1]].sort(),
    );

    // Die Ausgewaehlten sind aus der Warteschlange heraus, solange der
    // Vorschlag laeuft.
    const [snapshot] = await service.list(gameTypeKey);
    expect(snapshot.entries.filter((e) => userIds.includes(e.userId))).toEqual(
      [],
    );
  });

  it('braucht vier Spieler fuer ein Doppel, nicht zwei', async () => {
    await service.join(userIds[0], gameTypeKey, 2);
    await service.join(userIds[1], gameTypeKey, 2);
    expect(gateway.proposals).toHaveLength(0);

    await service.join(userIds[2], gameTypeKey, 2);
    await service.join(userIds[3], gameTypeKey, 2);
    expect(gateway.proposals).toHaveLength(1);
    expect(gateway.proposals[0].players).toHaveLength(4);
  });

  it('bedient den laenger Wartenden zuerst', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    // joinedAt hat Zeitstempelaufloesung, deshalb explizit aelter setzen statt
    // auf die Ausfuehrungsreihenfolge zu hoffen.
    await db
      .update(schema.queueEntries)
      .set({ joinedAt: new Date(Date.now() - 60_000) })
      .where(eq(schema.queueEntries.userId, userIds[0]));
    await service.join(userIds[1], gameTypeKey, 1);
    await db
      .update(schema.queueEntries)
      .set({ joinedAt: new Date(Date.now() - 30_000) })
      .where(eq(schema.queueEntries.userId, userIds[1]));
    await service.join(userIds[2], gameTypeKey, 1);

    expect(gateway.proposals).toHaveLength(1);
    const chosen = gateway.proposals[0].players.map((p) => p.userId);
    expect(chosen).toContain(userIds[0]);
    expect(chosen).toContain(userIds[1]);
    expect(chosen).not.toContain(userIds[2]);
  });

  it('legt keinen zweiten wartenden Eintrag an, sondern aktualisiert', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[0], gameTypeKey, 2);

    const rows = await db
      .select()
      .from(schema.queueEntries)
      .where(eq(schema.queueEntries.userId, userIds[0]));
    expect(rows).toHaveLength(1);
    expect(rows[0].teamSize).toBe(2);
  });

  it('stellt bei Ablehnung die Zusagenden zurueck und wirft den Ablehnenden raus', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[1], gameTypeKey, 1);
    const proposalId = gateway.proposals[0].proposalId;

    await service.respond(proposalId, userIds[1], 'declined');

    expect(gateway.resolved).toEqual([{ proposalId, status: 'declined' }]);

    const rows = await db
      .select()
      .from(schema.queueEntries)
      .where(inArray(schema.queueEntries.userId, userIds));
    const byUser = new Map(rows.map((r) => [r.userId, r.status]));
    expect(byUser.get(userIds[0])).toBe('waiting');
    expect(byUser.get(userIds[1])).toBe('cancelled');
  });

  it('gilt erst als angenommen, wenn alle zugestimmt haben', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[1], gameTypeKey, 1);
    const proposalId = gateway.proposals[0].proposalId;

    const first = await service.respond(proposalId, userIds[0], 'accepted');
    expect(first.status).toBe('pending');
    expect(gateway.resolved).toHaveLength(0);

    const second = await service.respond(proposalId, userIds[1], 'accepted');
    expect(second.status).toBe('accepted');
    expect(gateway.resolved).toEqual([{ proposalId, status: 'accepted' }]);
  });

  it('laesst nur Beteiligte antworten', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[1], gameTypeKey, 1);
    const proposalId = gateway.proposals[0].proposalId;

    await expect(
      service.respond(proposalId, userIds[4], 'accepted'),
    ).rejects.toThrow(BadRequestException);
  });

  it('weist eine Mannschaftsgroesse ab, die die Spielart nicht kennt', async () => {
    await db
      .update(schema.gameTypes)
      .set({ teamSizes: [2] })
      .where(eq(schema.gameTypes.id, gameTypeId));

    await expect(service.join(userIds[0], gameTypeKey, 1)).rejects.toThrow(
      BadRequestException,
    );

    await db
      .update(schema.gameTypes)
      .set({ teamSizes: [1, 2] })
      .where(eq(schema.gameTypes.id, gameTypeId));
  });

  it('laeuft ab und gibt die Wartenden frei', async () => {
    await service.join(userIds[0], gameTypeKey, 1);
    await service.join(userIds[1], gameTypeKey, 1);
    const proposalId = gateway.proposals[0].proposalId;

    await db
      .update(schema.matchProposals)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.matchProposals.id, proposalId));

    await service.expireStale();

    expect(gateway.resolved).toEqual([{ proposalId, status: 'expired' }]);
    const rows = await db
      .select()
      .from(schema.queueEntries)
      .where(inArray(schema.queueEntries.userId, userIds));
    // Beide haben nicht abgelehnt, stehen also wieder in der Warteschlange -
    // und damit entsteht sofort ein neuer Vorschlag.
    expect(gateway.proposals).toHaveLength(2);
    expect(rows.every((r) => r.status === 'matched')).toBe(true);
  });
});
