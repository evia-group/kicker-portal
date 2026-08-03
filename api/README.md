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

## Nicht in diesem Schritt

- `GOOGLE_APPLICATION_CREDENTIALS` erfordert ein echtes Firebase-Service-
  Account-JSON. Der Happy Path von `FirebaseAuthGuard` ist ohne ein solches
  Projekt nicht end-to-end testbar; die Guard-Logik selbst wurde mit
  ungültigen/fehlenden Tokens gegen eine echte Postgres-Instanz verifiziert.
- Dockerfile, docker-compose.yml und der Entrypoint für
  `GOOGLE_APPLICATION_CREDENTIALS`/`DATABASE_URL` folgen in Phase 8.
- Die Datenmigration aus Firestore/RTDB (Phase 4) und die Umstellung des
  Frontends auf diese API (Phase 5) sind eigene Schritte.
