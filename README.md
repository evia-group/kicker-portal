<h1>Welcome to Kicker Portal ⚽</h1>

![GitHub](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/Evia-Academy/kicker-portal?style=for-the-badge)

<!-- ### 🏠 [Homepage](homepage) -->

<!-- ### ✨ [Demo](demo) -->

## Prerequisites

- node >= 22.12 (Angular 22 requirement) or Docker, see [Docker](#docker-full-stack) below

## Install

Install the dependencies

```sh
npm install
```

As a second step, copy `.env.example` to `.env` and fill in the Microsoft
Entra ID parameters. `.env` is never committed.

```sh
cp .env.example .env
```

Then generate the runtime configuration the app loads at startup:

```sh
npm start init
```

This writes `src/config.json` from your `.env` (regenerate it whenever `.env` changes).
Unlike the old build-time `environment.ts`, this file is read by the browser at runtime,
so the same build works across dev, test and production - only the served `config.json`
differs.

## Usage

```sh
npm run start
```

## Backend

Data (users/teams/matches/playtime/leaderboard) is served by the NestJS API
in `api/` over PostgreSQL, not Firebase - see [api/README.md](api/README.md)
for setup. Set `API_URL` in `.env` to point at it (defaults to
`http://localhost:3000`) and regenerate the config (`npm run init`).

Login goes directly through Microsoft Entra ID (Auth Code Flow + PKCE via
`angular-auth-oidc-client`). Set `MS_TENANT` and `MS_CLIENT_ID` in `.env` to
the App Registration's tenant and client ID and regenerate the config
(`npm run init`).

## Docker (full stack)

```sh
cp .env.example .env   # fill in MS_TENANT/MS_CLIENT_ID/ENTRA_AUDIENCE once
                        # the App Registration exists, and KICKER_API_KEY
                        # (also needed on the physical kicker table). The
                        # rest already has working local-dev defaults.
docker compose up -d
docker compose ps      # everything should end up "healthy"
```

**`docker compose up` defaults to local-dev mode** - `docker-compose.override.yml`
is loaded automatically (standard Docker Compose behaviour) and runs
`web`/`api` via `ng serve`/`nest start --watch` against the live source
instead of a built image. In this mode the frontend is on
**`http://localhost:4200`**, not 8080.

To run the actual production build instead (nginx + compiled API, no
bind-mounts, no watch mode), explicitly exclude the override:

```sh
docker compose -f docker-compose.yml up -d --build
```

That's the mode where the frontend is on **`http://localhost:8080`**.

For a real deployment behind TLS, add the Caddy overlay on top of that:

```sh
DOMAIN=kicker.example.com docker compose -f docker-compose.yml -f compose.prod.yml up -d
```

See [api/README.md](api/README.md) for the API's own env vars and
`docker/` for the Dockerfiles, nginx config and backup cron job.

## Linting

With prettier, eslint and husky we set up the linting process.
To check linting manuel, you can use this command

```sh
npm run p:check
npm run p:write
```

<!--
## Run tests

```sh
npm run test
```
-->

## Author

👤 **evia solution GmbH**

- Website: https://www.evia.de/
- Github: [@evia Academy](https://github.com/Evia-Academy)
- LinkedIn: [@evia Gruppe](https://www.linkedin.com/company/evia-stuttgart/mycompany/)

<!-- ## 🤝 Contributing
***

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](issue page). You can also take a look at the [contributing guide](contributing guid).
-->

## 📝 License

Copyright © 2023 [evia innovation GmbH](https://github.com/Evia-Academy).<br />
This project is [MIT](https://github.com/Evia-Academy/kicker-portal/blob/production/LICENSE) licensed.
