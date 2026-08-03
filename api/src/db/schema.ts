import {
  boolean,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

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

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  playedAt: timestamp('played_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  isSingle: boolean('is_single').notNull().default(false),
});

/** side 0 or 1. Exactly two rows per match. team_id XOR user_id is set,
 *  depending on matches.is_single. */
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
});

/** One row per played round (best of 3, so up to 3 rows per match). */
export const matchRounds = pgTable('match_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  roundNo: smallint('round_no').notNull(),
  winnerSide: smallint('winner_side').notNull(),
  domination: boolean('domination').notNull().default(false),
});

export const playtime = pgTable('playtime', {
  id: uuid('id').primaryKey().defaultRandom(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
});
