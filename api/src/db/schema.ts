import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Eine spielbare Disziplin samt Regelwerk. Vorher war Kicker fest verdrahtet:
 * Best-of-3 stand in `@ArrayMaxSize(3)`, in `round1/2/3` und in einer
 * ELO-Umrechnung mit den Konstanten 1.5 und 1.0. Damit kostete jede weitere
 * Spielart eine Kopie dieser Logik.
 *
 * Das Regelwerk steht deshalb als Daten hier, nicht als Code. Eine dritte
 * Disziplin ist danach eine Zeile in dieser Tabelle und keine Schemaaenderung.
 */
export const gameTypes = pgTable('game_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Stabiler Schluessel fuer Routen, API-Parameter und i18n. */
  key: text('key').notNull().unique(),
  displayName: text('display_name').notNull(),
  /** Material-Symbol-Name, damit das Icon nicht im Frontend haengt. */
  icon: text('icon').notNull(),
  /**
   * Erste Seite mit so vielen gewonnenen Runden gewinnt das Spiel. Kicker 2
   * (Best of 3), Dart 3 (Best of 5 Legs). Aus diesem einen Wert folgen
   * Mindest- und Hoechstrundenzahl, deshalb werden sie nicht zusaetzlich
   * gespeichert und koennen nicht widerspruechlich werden.
   */
  roundsToWin: smallint('rounds_to_win').notNull(),
  /** i18n-Key fuer die Rundenbezeichnung: Runde beim Kicker, Leg beim Dart. */
  roundLabelKey: text('round_label_key').notNull(),
  /**
   * Kennt die Spielart eine Sonderwertung dafuer, dass der Verlierer einer
   * Runde ohne Punkt bleibt (Kicker "zu Null", Dart Whitewash).
   */
  supportsDomination: boolean('supports_domination').notNull().default(false),
  /** Erlaubte Mannschaftsgroessen, etwa {1,2} fuer Einzel und Doppel. */
  teamSizes: smallint('team_sizes').array().notNull(),
  /**
   * Zuschlag je zusaetzlicher Rundendifferenz in der ELO-Gewichtung. Das
   * Gewicht ist `1 + (|Differenz| - 1) * step`, mit 0,5 ergibt das fuer Kicker
   * genau die bisherigen Werte (2:0 -> 1,5 und 2:1 -> 1,0) und skaliert
   * gleichzeitig auf jede andere Rundenzahl.
   */
  eloMarginStep: real('elo_margin_step').notNull().default(0.5),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: smallint('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyFirebaseUid: text('legacy_firebase_uid').unique(),
  entraOid: text('entra_oid').unique(),
  name: text('name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const teamPlayers = pgTable(
  'team_players',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.userId] })],
);

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playedAt: timestamp('played_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    gameTypeId: uuid('game_type_id')
      .notNull()
      .references(() => gameTypes.id),
    /**
     * Spieler pro Seite: 1 ist ein Einzelspiel, 2 ein Doppel. Ersetzt das
     * bisherige `is_single`, das nur zwei Zustaende kannte und den Fall
     * "Dart im Doppel" nicht von "Kicker im Doppel" unterscheiden konnte.
     * Die API liefert `isSingle` weiterhin abgeleitet mit, damit bestehende
     * Clients nicht brechen.
     */
    teamSize: smallint('team_size').notNull().default(2),
  },
  (table) => [
    // Jede Auswertung filtert nach Spielart und sortiert nach Datum.
    index('matches_game_type_played_at_idx').on(
      table.gameTypeId,
      table.playedAt,
    ),
  ],
);

/** side 0 or 1. Exactly two rows per match. team_id XOR user_id is set,
 *  depending on whether matches.team_size is 1. */
export const matchParticipants = pgTable('match_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  side: smallint('side').notNull(),
  teamId: uuid('team_id').references(() => teams.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  roundsWon: smallint('rounds_won').notNull().default(0),
  /**
   * Spielartspezifische Kennzahlen dieser Seite, etwa 180er, Checkout-Quote
   * und Average beim Dart. Absichtlich schemalos: solche Kennzahlen
   * unterscheiden sich je Disziplin vollstaendig, und eine Spalte je Kennzahl
   * wuerde die Tabelle mit Spalten fuellen, die fuer Kicker immer leer sind.
   */
  stats: jsonb('stats'),
});

/** Eine Zeile je gespielter Runde. Wie viele es hoechstens sein duerfen, ergibt
 *  sich aus `game_types.rounds_to_win` der jeweiligen Spielart. */
export const matchRounds = pgTable('match_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  roundNo: smallint('round_no').notNull(),
  winnerSide: smallint('winner_side').notNull(),
  /** Verlierer der Runde blieb ohne Punkt. Nur sinnvoll, wenn die Spielart
   *  `supports_domination` gesetzt hat. */
  domination: boolean('domination').notNull().default(false),
  /** Feinere Rundendaten, etwa der Legstand oder geworfene Aufnahmen. */
  detail: jsonb('detail'),
});

/**
 * Wer gerade auf Mitspieler wartet.
 *
 * Bewusst eine Tabelle und nicht nur Zustand im Gateway: eine Warteschlange nur
 * im Speicher waere nach jedem Neustart des Backends leer, und wer sein Telefon
 * weglegt, verliert seinen Platz beim ersten Verbindungsabbruch.
 */
export const queueEntries = pgTable(
  'queue_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameTypeId: uuid('game_type_id')
      .notNull()
      .references(() => gameTypes.id),
    /** Gesuchte Mannschaftsgroesse: 1 fuer Einzel, 2 fuer Doppel. */
    teamSize: smallint('team_size').notNull(),
    /** waiting, matched, cancelled oder expired. */
    status: text('status').notNull().default('waiting'),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Danach zaehlt der Eintrag nicht mehr, siehe Aufraeumlauf. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    proposalId: uuid('proposal_id'),
  },
  (table) => [
    // Hoechstens ein wartender Eintrag je Nutzer und Spielart. Als partieller
    // Index, damit abgelaufene und abgesagte Eintraege als Historie liegen
    // bleiben duerfen.
    uniqueIndex('queue_entries_one_waiting_per_user_and_game_type')
      .on(table.userId, table.gameTypeId)
      .where(sql`status = 'waiting'`),
    index('queue_entries_lookup_idx').on(
      table.gameTypeId,
      table.teamSize,
      table.status,
      table.joinedAt,
    ),
  ],
);

/**
 * Eine gefundene Paarung, die noch bestaetigt werden muss.
 *
 * Ohne diesen Zwischenschritt wuerde die Queue Leute in Spiele stecken, die
 * inzwischen nicht mehr koennen. Ein Vorschlag laeuft ab, wenn nicht alle
 * zustimmen, und die Zusagenden gehen zurueck in die Warteschlange.
 */
export const matchProposals = pgTable('match_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameTypeId: uuid('game_type_id')
    .notNull()
    .references(() => gameTypes.id),
  teamSize: smallint('team_size').notNull(),
  /** pending, accepted, declined oder expired. */
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const matchProposalPlayers = pgTable(
  'match_proposal_players',
  {
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => matchProposals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** pending, accepted oder declined. */
    response: text('response').notNull().default('pending'),
  },
  (table) => [primaryKey({ columns: [table.proposalId, table.userId] })],
);

/**
 * Ein Endgeraet, das Push-Benachrichtigungen empfangen kann.
 *
 * Ein Nutzer hat oft mehrere: Telefon, Arbeitsrechner, Tablet. Deshalb je
 * Endpunkt eine Zeile und nicht ein Feld am Nutzer. `endpoint` ist die vom
 * Browser vergebene, eindeutige Adresse und damit der natuerliche Schluessel.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    /** Oeffentlicher Schluessel des Geraets, aus der PushSubscription. */
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    /** Nur zur Wiedererkennung in einer Geraeteliste, nicht funktional. */
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Letzter erfolgreicher Versand, damit tote Geraete auffallen. */
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  },
  (table) => [index('push_subscriptions_user_idx').on(table.userId)],
);

/**
 * Welche Benachrichtigungen ein Nutzer will.
 *
 * Standardmaessig alles an: wer sich in eine Warteschlange eintraegt, will
 * offensichtlich Bescheid bekommen. Abschalten muss aber je Anlass moeglich
 * sein, sonst schaltet man am Ende alles ab.
 */
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** Eine Paarung wurde vorgeschlagen und wartet auf Bestaetigung. */
  proposalReceived: boolean('proposal_received').notNull().default(true),
  /** Der Tisch ist frei geworden, waehrend ich warte. */
  tableFree: boolean('table_free').notNull().default(true),
});

export const playtime = pgTable('playtime', {
  id: uuid('id').primaryKey().defaultRandom(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
});
