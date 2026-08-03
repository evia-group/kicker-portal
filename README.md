<h1>Welcome to Kicker Portal ⚽</h1>

![GitHub](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/Evia-Academy/kicker-portal?style=for-the-badge)

<!-- ### 🏠 [Homepage](homepage) -->

<!-- ### ✨ [Demo](demo) -->

## Prerequisites

- npm >= 8.1.2
- node >= 16.13.1

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
