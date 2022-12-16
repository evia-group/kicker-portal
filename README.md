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

As a second step the dev environment must be set

```sh
export const environment = {
  production: false,
  versionNumber: 'v2.0.0',
  prefix: 'T-',
  #Firebase Config
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
  globals: {
    team1: 0,
    team2: 1,
    round1: 0,
    round2: 1,
    round3: 2,
  },
  #MS Auth
  ms: {
    tenant: '',
  },
};
```

## Usage

```sh
npm run start
```

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

Copyright © 2022 [evia innovation GmbH](https://github.com/Evia-Academy).<br />
This project is [MIT](https://github.com/Evia-Academy/kicker-portal/blob/production/LICENSE) licensed.
