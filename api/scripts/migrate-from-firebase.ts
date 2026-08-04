/**
 * One-time migration: Firestore -> Postgres. Safe to re-run before cutover -
 * it truncates the target tables first, so every run is a full, idempotent
 * refresh rather than an incremental sync. Do NOT run this against a
 * Postgres database that already holds real production writes from the new
 * backend.
 *
 * Reads directly from Firestore via the Admin SDK (not from a raw
 * `gcloud firestore export` archive, which is an internal LevelDB format
 * that isn't meant to be parsed directly). Point it at the emulator by
 * setting FIRESTORE_EMULATOR_HOST before running, or at production by
 * providing GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Realtime Database is intentionally not read here: `/Kicker` only ever
 * holds live, transient table status (see kicker-status.ts), no history.
 * Historical playtime already lives in the Firestore `Playtime` collection
 * and is migrated below like everything else.
 *
 * Usage:
 *   DATABASE_URL=... FIRESTORE_PREFIX= npx ts-node scripts/migrate-from-firebase.ts
 *
 * FIRESTORE_PREFIX selects which environment's collections to read (''
 * for production, 'T-' for the test collections) - matches the `prefix`
 * used throughout the old Firestore-based app.
 *
 * FIREBASE_UID_MAPPING_FILE optionally points at a JSON file
 * ({ [firebaseUid]: { entraOid } }) produced in Phase 0, so entra_oid gets
 * populated alongside legacy_firebase_uid where already known.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { FirebaseUidMapping, runMigration } from './migrate-core';
import { fetchCollections } from './fetch-firestore';

async function loadUidMapping(
  path: string | undefined,
): Promise<FirebaseUidMapping> {
  if (!path) {
    return {};
  }
  const fs = await import('fs/promises');
  const raw = await fs.readFile(path, 'utf-8');
  return JSON.parse(raw) as FirebaseUidMapping;
}

async function main() {
  const prefix = process.env.FIRESTORE_PREFIX ?? '';
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const uidMapping = await loadUidMapping(
    process.env.FIREBASE_UID_MAPPING_FILE,
  );

  const firebaseApp = initializeApp();
  const firestore = getFirestore(firebaseApp);

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log(`Reading Firestore collections with prefix "${prefix}"...`);
  const collections = await fetchCollections(firestore, prefix);

  console.log('Truncating target tables and migrating...');
  const result = await runMigration(db, collections, uidMapping);

  console.log(
    `Done. Skipped ${result.skippedMatches} team matches and ` +
      `${result.skippedSingleMatches} single matches due to unresolved references. ` +
      `${result.matchesWithoutDate} match(es) had no 'date' field and defaulted to the run time.`,
  );

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
