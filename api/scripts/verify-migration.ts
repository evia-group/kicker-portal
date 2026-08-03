/**
 * Cross-checks the migrated Postgres data against Firestore. Deliberately
 * does NOT reuse migrate-transform.ts - verify-core.ts recomputes aggregates
 * directly from the raw Firestore docs using its own logic, so a
 * transcription bug in the migration script (wrong side, off-by-one in a
 * count, ...) shows up as a mismatch here instead of silently agreeing with
 * itself.
 *
 * Usage:
 *   DATABASE_URL=... FIRESTORE_PREFIX= npx ts-node scripts/verify-migration.ts
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { fetchCollections } from './fetch-firestore';
import { verifyMigration } from './verify-core';

async function main() {
  const prefix = process.env.FIRESTORE_PREFIX ?? '';
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const firebaseApp = initializeApp();
  const firestore = getFirestore(firebaseApp);
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  const collections = await fetchCollections(firestore, prefix);
  const report = await verifyMigration(db, collections);

  for (const error of report.errors) {
    console.error(error);
  }

  await client.end();

  if (report.mismatchCount > 0) {
    console.error(`\n${report.mismatchCount} mismatch(es) found.`);
    process.exit(1);
  }
  console.log('\nNo mismatches. Migration verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
