import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import webpush from 'web-push';
import type { Database } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { NotificationsService } from './notifications.service';

/**
 * Integrationstest gegen die echte Datenbank, mit gemocktem Versand.
 *
 * Der Versand selbst geht nach draussen zu einem Push-Dienst und wird deshalb
 * ersetzt; gepruefft wird, was der Service mit dem Ergebnis macht. Vor allem das
 * Aufraeumen abgelaufener Endpunkte: ohne das wachsen sie unbegrenzt und jeder
 * weitere Versand wird langsamer.
 *
 *   docker compose exec api npm test
 */

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}));

const sendNotification = webpush.sendNotification as jest.Mock;

/** Fehler, wie ihn web-push bei einem nicht mehr gueltigen Endpunkt liefert. */
function pushError(statusCode: number) {
  return Object.assign(new Error(`push failed with ${statusCode}`), {
    statusCode,
  });
}

describe('NotificationsService', () => {
  let db: Database;
  let client: ReturnType<typeof postgres>;
  let service: NotificationsService;
  let userIds: string[];

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
    sendNotification.mockReset();
    sendNotification.mockResolvedValue(undefined);

    // Ohne die drei Variablen schaltet der Service sich ab, dann wuerde jeder
    // Test nur die Abschaltung pruefen.
    process.env.VAPID_PUBLIC_KEY = 'test-public';
    process.env.VAPID_PRIVATE_KEY = 'test-private';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';
    service = new NotificationsService(db);

    const suffix = `${Date.now()}-${Math.round(process.hrtime()[1] / 1000)}`;
    const created = await db
      .insert(schema.users)
      .values(
        [1, 2].map((n) => ({
          name: `test-push-${n}`,
          entraOid: `test-push-oid-${n}-${suffix}`,
        })),
      )
      .returning({ id: schema.users.id });
    userIds = created.map((row) => row.id);
  });

  afterEach(async () => {
    // push_subscriptions und notification_preferences haengen mit
    // onDelete: cascade an users.
    await db.delete(schema.users).where(inArray(schema.users.id, userIds));
  });

  const subscribe = (userId: string, endpoint: string) =>
    service.subscribe(
      userId,
      { endpoint, keys: { p256dh: 'key', auth: 'auth' } },
      'jest',
    );

  it('meldet ein Geraet an und schickt an alle Geraete eines Nutzers', async () => {
    await subscribe(userIds[0], 'https://push.example.com/a');
    await subscribe(userIds[0], 'https://push.example.com/b');

    const result = await service.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/kicker/matchmaking',
    });

    expect(result).toEqual({ sent: 2, pruned: 0 });
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });

  it('meldet denselben Endpunkt beim Geraetewechsel auf den neuen Nutzer um', async () => {
    await subscribe(userIds[0], 'https://push.example.com/shared');
    await subscribe(userIds[1], 'https://push.example.com/shared');

    const rows = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(
        eq(
          schema.pushSubscriptions.endpoint,
          'https://push.example.com/shared',
        ),
      );

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(userIds[1]);
  });

  it('entfernt Endpunkte, die mit 410 antworten', async () => {
    await subscribe(userIds[0], 'https://push.example.com/gone');
    await subscribe(userIds[0], 'https://push.example.com/alive');

    sendNotification.mockImplementation((subscription: { endpoint: string }) =>
      subscription.endpoint.endsWith('/gone')
        ? Promise.reject(pushError(410))
        : Promise.resolve(undefined),
    );

    const result = await service.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/',
    });

    expect(result).toEqual({ sent: 1, pruned: 1 });
    const remaining = await db
      .select({ endpoint: schema.pushSubscriptions.endpoint })
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userIds[0]));
    expect(remaining.map((r) => r.endpoint)).toEqual([
      'https://push.example.com/alive',
    ]);
  });

  it('entfernt Endpunkte, die mit 404 antworten', async () => {
    await subscribe(userIds[0], 'https://push.example.com/missing');
    sendNotification.mockRejectedValue(pushError(404));

    const result = await service.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/',
    });

    expect(result.pruned).toBe(1);
    const remaining = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userIds[0]));
    expect(remaining).toHaveLength(0);
  });

  it('behaelt Endpunkte bei einem voruebergehenden Fehler', async () => {
    await subscribe(userIds[0], 'https://push.example.com/flaky');
    sendNotification.mockRejectedValue(pushError(503));

    const result = await service.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/',
    });

    // 503 heisst "gerade nicht", nicht "nie wieder".
    expect(result).toEqual({ sent: 0, pruned: 0 });
    const remaining = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userIds[0]));
    expect(remaining).toHaveLength(1);
  });

  it('respektiert einen abgeschalteten Anlass', async () => {
    await subscribe(userIds[0], 'https://push.example.com/a');
    await service.updatePreferences(userIds[0], { tableFree: false });

    const off = await service.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/',
    });
    expect(off.sent).toBe(0);
    expect(sendNotification).not.toHaveBeenCalled();

    // Der andere Anlass bleibt an, Abschalten ist je Anlass.
    const on = await service.notify([userIds[0]], 'proposalReceived', {
      title: 'T',
      body: 'B',
      url: '/',
    });
    expect(on.sent).toBe(1);
  });

  it('behandelt einen Nutzer ohne Eintrag als "alles an"', async () => {
    const preferences = await service.getPreferences(userIds[0]);
    expect(preferences.proposalReceived).toBe(true);
    expect(preferences.tableFree).toBe(true);

    // Und legt dafuer keine Zeile an.
    const rows = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userIds[0]));
    expect(rows).toHaveLength(0);
  });

  it('aendert beim Umschalten nur den genannten Anlass', async () => {
    await service.updatePreferences(userIds[0], { tableFree: false });
    const after = await service.updatePreferences(userIds[0], {
      proposalReceived: false,
    });

    expect(after.tableFree).toBe(false);
    expect(after.proposalReceived).toBe(false);
  });

  it('verschickt nichts ohne VAPID-Konfiguration', async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const unconfigured = new NotificationsService(db);
    await subscribe(userIds[0], 'https://push.example.com/a');

    const result = await unconfigured.notify([userIds[0]], 'tableFree', {
      title: 'T',
      body: 'B',
      url: '/',
    });

    expect(result).toEqual({ sent: 0, pruned: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('packt die Nutzlast in die von SwPush erwartete Form', async () => {
    await subscribe(userIds[0], 'https://push.example.com/a');
    await service.notify([userIds[0]], 'proposalReceived', {
      title: 'Paarung gefunden',
      body: 'Anna, Ben',
      url: '/kicker/matchmaking',
      tag: 'proposal-1',
      requireInteraction: true,
    });

    const [, body] = sendNotification.mock.calls[0] as [unknown, string];
    const parsed = JSON.parse(body);
    // Ohne die Verschachtelung unter `notification` reicht Angular das
    // Ereignis nicht an notificationClicks weiter.
    expect(parsed.notification.title).toBe('Paarung gefunden');
    expect(parsed.notification.data.url).toBe('/kicker/matchmaking');
    expect(parsed.notification.tag).toBe('proposal-1');
    expect(parsed.notification.requireInteraction).toBe(true);
  });
});
