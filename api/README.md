# Kicker Portal API

NestJS-Backend, das Firebase (Firestore, Realtime Database, Cloud Functions)
für das Kicker-Portal ersetzt. PostgreSQL über Drizzle ORM, Auth-Tokens werden
über Microsoft Entra ID verifiziert (`src/auth/entra-auth.guard.ts`, JWKS-
basiert). `firebase-admin` wird nur noch von den Migrationsskripten in
`scripts/` gebraucht, die weiterhin aus Firestore lesen.

## Setup

Am einfachsten über `docker compose up` im Projekt-Root (siehe
[README.md](../README.md#docker-full-stack)) - das baut API, Postgres, führt
die Migration aus und startet alles zusammen mit dem Frontend.

Für die Arbeit isoliert an der API ohne Docker:

```sh
npm install
cp .env.example .env   # ausfüllen: DATABASE_URL, KICKER_API_KEY,
                        # ENTRA_TENANT_ID, ENTRA_AUDIENCE
```

Eine PostgreSQL-Instanz wird benötigt, z.B.
`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine`.

Migrationen anwenden:

```sh
npm run db:migrate
```

Entwicklung starten:

```sh
npm run start:dev
```

`Dockerfile` hat vier Stages (`build`, `dev`, `migrate`, `runtime`) -
`docker-compose.override.yml` im Projekt-Root nutzt `dev` mit Bind-Mount für
lokale Entwicklung, `docker-compose.yml` nutzt `runtime`/`migrate` für den
eigentlichen Betrieb.

## Datenmodell

Siehe `src/db/schema.ts`. Aggregate (Siege, Niederlagen, Dominations,
Ergebnisverteilung) werden nicht gespeichert, sondern bei jedem
`GET /leaderboard/*`-Aufruf aus den Rohdaten (`matches`, `match_participants`,
`match_rounds`) berechnet - siehe `src/leaderboard/leaderboard.service.ts`.
Das eliminiert die Drift-Anfälligkeit, die die alten Firestore-Trigger
(`functions/src/update-users-teams.ts`) hatten.

Teams haben keine eigenständige Identität in der Anwendung - sie ergeben
sich aus der exakten Spielerpaarung. `MatchesService.findOrCreateTeam`
sucht ein Team mit exakt dieser (ordnungsunabhängigen) Spielerkombination
oder legt es an, transaktional zusammen mit dem Match.

## Endpunkte

| Methode | Pfad                     | Auth                | Zweck                                                                                                      |
| ------- | ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| GET     | /users                   | Entra-Token         | Nutzerliste                                                                                                |
| GET     | /users/me                | Entra-Token         | Aufgelöster eigener Nutzer (`{id, name, isAdmin}`)                                                         |
| DELETE  | /users/:id               | Entra-Token + Admin | Nutzer löschen                                                                                             |
| GET     | /teams                   | Entra-Token         | Teamliste inkl. Spieler                                                                                    |
| DELETE  | /teams/:id               | Entra-Token + Admin | Team löschen                                                                                               |
| GET     | /matches                 | Entra-Token         | Matchhistorie                                                                                              |
| POST    | /matches                 | Entra-Token         | Match anlegen (transaktional)                                                                              |
| DELETE  | /matches/:id             | Entra-Token + Admin | Match löschen                                                                                              |
| GET     | /playtime                | Entra-Token         | Spielzeiten                                                                                                |
| GET     | /leaderboard/teams       | Entra-Token         | Team-Aggregate                                                                                             |
| GET     | /leaderboard/users?mode= | Entra-Token         | Nutzer-Aggregate, getrennt nach `team` oder `single`                                                       |
| POST    | /kicker/status           | `x-api-key`-Header  | Vom Kickertisch aufgerufen, pusht Status per WebSocket und schreibt bei Sessionende einen Playtime-Eintrag |
| GET     | /health                  | -                   | Healthcheck für Docker (Phase 8)                                                                           |

WebSocket-Namespace `/kicker` broadcastet `status`-Events an alle
verbundenen Clients (ersetzt die beiden `onValue('/Kicker')`-Aufrufe im
Frontend).

## Datenmigration aus Firestore (Phase 4)

`scripts/migrate-from-firebase.ts` liest die bestehenden Firestore-Collections
über die Admin SDK und schreibt sie nach Postgres. Sicher mehrfach ausführbar
vor dem eigentlichen Cutover - jeder Lauf leert vorher die Zieltabellen
(volle Neu-Synchronisierung, kein inkrementeller Abgleich). Realtime Database
wird bewusst nicht gelesen: `/Kicker` enthält nur den flüchtigen Live-Status
des Tisches, keine Historie - die Spielzeit-Historie liegt bereits in der
Firestore-Collection `Playtime`.

```sh
DATABASE_URL=... FIRESTORE_PREFIX= npm run migrate:from-firebase
DATABASE_URL=... FIRESTORE_PREFIX= npm run migrate:verify
```

`FIRESTORE_PREFIX` wählt die Umgebung (`''` für Produktivdaten, `T-` für die
Testdaten), genau wie das bisherige `prefix` im Frontend. Optional zeigt
`FIREBASE_UID_MAPPING_FILE` auf eine in Phase 0 erstellte JSON-Datei
(`{ [firebaseUid]: { entraOid } }`), damit `entra_oid` gleich mitbefüllt wird,
wo schon bekannt.

Zwei Eigenheiten der alten Daten, die das Skript behandelt:

- `Matches`-Dokumente referenzieren ihre beiden Teams über ein `teams`-Feld,
  dessen Pfad durch einen Tippfehler in `matches.service.ts` immer ein
  überzähliges `)}` trägt (`Teams/${team1})}`). Das Skript ignoriert dieses
  Feld vollständig und ermittelt die Team-IDs stattdessen aus den Schlüsseln
  von `result`, die korrekt sind.
- `match_rounds` (welche Runde wer wie gewonnen hat) existierte in Firestore
  nie explizit, nur `result` (Rundenstand) und die Zählung der
  `dominations`/`defeats`-Einträge. `scripts/migrate-transform.ts` rekonstruiert
  daraus eine plausible Rundenfolge; welche konkrete Runde die Domination war,
  ist nicht mehr feststellbar und für die Aggregation auch nicht nötig.

`scripts/verify-migration.ts` rechnet die Aggregate unabhängig aus denselben
Firestore-Rohdaten nach (bewusst ohne die Migrationslogik wiederzuverwenden)
und vergleicht sie mit dem, was `LeaderboardService` aus Postgres liefert.
Mit synthetischen Testdaten verifiziert (siehe Commit-Historie): exakte
Übereinstimmung bei Team- und Nutzer-Aggregaten für gemischte Team- und
Einzelspiele, inklusive der oben genannten Bugs.

## Nicht in diesem Schritt

- `GOOGLE_APPLICATION_CREDENTIALS` erfordert ein echtes Firebase-Service-
  Account-JSON, nur für die Migrationsskripte relevant. Diese konnten daher
  nur gegen synthetische Fixtures getestet werden, nicht gegen echte
  Firestore-Daten - das muss einmalig gegen die echten Test- (`T-`)
  Collections nachgeholt werden, bevor die Produktivmigration läuft.
- `EntraAuthGuard` ist ohne echte App-Registrierung (Client-ID/Audience) im
  evia-Tenant nicht end-to-end testbar; die Guard-Logik selbst wurde mit
  ungültigen/fehlenden Tokens gegen eine echte Postgres-Instanz verifiziert.

## Frontend-Anbindung (Phase 5)

Das Angular-Frontend spricht für Nutzer/Teams/Matches/Playtime/Leaderboard nur
noch mit dieser API, nicht mehr mit Firestore/Realtime Database/Cloud
Functions (siehe `src/app/shared/services/`).

Zwei kleine Ergänzungen gegenüber Phase 4 waren dafür nötig:

- `GET /users/me` (`users.controller.ts`) gibt den durch den Auth-Guard
  aufgelösten Nutzer zurück (`{id, name, isAdmin}`) - notwendig, weil
  `users.id` (Postgres-UUID) nicht mehr mit der Firebase-UID/Entra-`oid`
  übereinstimmt, die früher direkt als Firestore-Dokument-ID diente.
- `GET /leaderboard/users?mode=team|single` liefert Team- und 1v1-Aggregate
  pro Nutzer getrennt (`leaderboard.service.ts`), da die Statistik-Seite
  beide Modi separat anzeigt.

WebSocket-Namespace `/kicker` wird über `socket.io-client`
(`src/app/shared/services/kicker-socket.service.ts`) konsumiert.

## Auth: Microsoft Entra ID (Phase 6)

Auth-Tokens werden nicht mehr über Firebase, sondern direkt über Microsoft
Entra ID verifiziert (`src/auth/entra-auth.guard.ts`): JWKS-Verifikation via
`jose` gegen `https://login.microsoftonline.com/<ENTRA_TENANT_ID>/discovery/v2.0/keys`,
geprüft werden `iss` und `aud` (`ENTRA_AUDIENCE`). Nutzer werden über den
`oid`-Claim aufgelöst/provisioniert (`users.entra_oid`), analog zum
bisherigen `legacy_firebase_uid`-Mechanismus.

Das Frontend nutzt `angular-auth-oidc-client` (Auth Code Flow + PKCE) statt
`@angular/fire/auth` - `firebase`/`@angular/fire` sind komplett aus dem
Frontend-`package.json` entfernt. `firebase-admin` bleibt im Backend nur für
die Migrationsskripte.

**Nicht Teil dieses Schritts:**

- Die eigentliche App-Registrierung im evia-Tenant (SPA-Plattform,
  Redirect-URIs, Client-ID) - `MS_CLIENT_ID`/`ENTRA_AUDIENCE` sind Platzhalter,
  bis die echten Werte per CI/CD bereitgestellt werden.
- Backfill von `entra_oid` für bereits migrierte Bestandsnutzer. Ohne das
  optionale UID-Mapping aus Phase 0 legt die Auto-Provisionierung beim ersten
  Entra-Login neue, von der migrierten Historie getrennte Nutzer-Zeilen an -
  vor dem Produktiv-Cutover per einmaligem SQL-Update zu klären.
- `is_admin`-Rollen initial setzen (manuelles SQL-Update, keine Codeänderung).

## Containerisierung (Phase 8)

`Dockerfile` (vier Stages: `build`, `dev`, `migrate`, `runtime`) baut ein
Non-Root-Produktions-Image; `HEALTHCHECK` ruft `GET /health` direkt über
Node auf, kein zusätzliches Binary (curl/wget) nötig. `migrate` ist eine
eigene Stage mit vollem `npm ci` (kein `--omit=dev`), weil `drizzle-kit` ein
Dev-Dependency ist und in der schlanken `runtime`-Stage nicht existiert.

Im Root-`docker-compose.yml` läuft `migrate` einmalig vor `api`
(`depends_on: service_completed_successfully`) - ein frischer
`docker compose up` legt das Schema also automatisch an, ohne dass jemand
`npm run db:migrate` von Hand ausführen muss. Details und der volle Stack
(inklusive Frontend, Backup-Cron, optionaler Caddy-TLS-Overlay) stehen in
[README.md](../README.md#docker-full-stack).
