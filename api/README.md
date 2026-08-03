# Kicker Portal API

NestJS-Backend, das Firebase (Firestore, Realtime Database, Cloud Functions)
für das Kicker-Portal ersetzt. PostgreSQL über Drizzle ORM, Auth-Tokens werden
vorerst weiter über Firebase Auth verifiziert (siehe `src/auth/`), bis die
Migration auf Microsoft Entra ID abgeschlossen ist.

## Setup

```sh
npm install
cp .env.example .env   # ausfüllen: DATABASE_URL, KICKER_API_KEY,
                        # GOOGLE_APPLICATION_CREDENTIALS
```

Eine PostgreSQL-Instanz wird benötigt (lokal per Docker: siehe
`docker-compose.yml` im Projekt-Root, folgt in Phase 8; bis dahin z.B.
`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine`).

Migrationen anwenden:

```sh
npm run db:migrate
```

Entwicklung starten:

```sh
npm run start:dev
```

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

| Methode | Pfad               | Auth                   | Zweck                                                                                                      |
| ------- | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| GET     | /users             | Firebase-Token         | Nutzerliste                                                                                                |
| DELETE  | /users/:id         | Firebase-Token + Admin | Nutzer löschen                                                                                             |
| GET     | /teams             | Firebase-Token         | Teamliste inkl. Spieler                                                                                    |
| DELETE  | /teams/:id         | Firebase-Token + Admin | Team löschen                                                                                               |
| GET     | /matches           | Firebase-Token         | Matchhistorie                                                                                              |
| POST    | /matches           | Firebase-Token         | Match anlegen (transaktional)                                                                              |
| DELETE  | /matches/:id       | Firebase-Token + Admin | Match löschen                                                                                              |
| GET     | /playtime          | Firebase-Token         | Spielzeiten                                                                                                |
| GET     | /leaderboard/teams | Firebase-Token         | Team-Aggregate                                                                                             |
| GET     | /leaderboard/users | Firebase-Token         | Nutzer-Aggregate (Team- + Einzelspiele)                                                                    |
| POST    | /kicker/status     | `x-api-key`-Header     | Vom Kickertisch aufgerufen, pusht Status per WebSocket und schreibt bei Sessionende einen Playtime-Eintrag |
| GET     | /health            | -                      | Healthcheck für Docker (Phase 8)                                                                           |

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
  Account-JSON. Der Happy Path von `FirebaseAuthGuard` ist ohne ein solches
  Projekt nicht end-to-end testbar; die Guard-Logik selbst wurde mit
  ungültigen/fehlenden Tokens gegen eine echte Postgres-Instanz verifiziert.
  Aus demselben Grund konnten die Migrationsskripte nur gegen synthetische
  Fixtures getestet werden, nicht gegen echte Firestore-Daten - das muss
  einmalig gegen die echten Test- (`T-`) Collections nachgeholt werden,
  bevor die Produktivmigration läuft.
- Dockerfile, docker-compose.yml und der Entrypoint für
  `GOOGLE_APPLICATION_CREDENTIALS`/`DATABASE_URL` folgen in Phase 8.
- Die Umstellung des Frontends auf diese API (Phase 5) ist ein eigener
  Schritt.
