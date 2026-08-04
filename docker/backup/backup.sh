#!/bin/sh
set -eu

timestamp=$(date +%Y%m%d-%H%M%S)
target="/backups/kicker-${timestamp}.sql.gz"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  --host="${POSTGRES_HOST:-db}" \
  --username="${POSTGRES_USER}" \
  --dbname=kicker \
  | gzip > "${target}"

echo "wrote ${target}"

# Keep two weeks of nightly backups.
find /backups -name 'kicker-*.sql.gz' -mtime +14 -delete
