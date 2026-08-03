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

As a second step, copy `.env.example` to `.env` and fill in the Firebase and Microsoft
parameters. `.env` is never committed.

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

## Run the Local Emulator Suite

Instead of using your Firebase backend, you can use Emulators that run locally.

### Install the Local Emulator Suite

To install the Emulator Suite, run this command

```sh
firebase init emulators
```

and choose the Emulators you need.

### Configure the Emulator Suite

If you want to use different ports, you can rerun `firebase init emulators` or edit the
`firebase.json` file. To change the paths to the Security Rules, you can also edit the
`firebase.json` file.

Without configuration, the emulators will use the default ports and run with open data security.

### Connecting the App to the Emulator

In the file `app.module.ts` you have to set the ports for the connections to the ports of the Emulator.
You also have to set `USE_EMULATORS=true` in your `.env` and regenerate the config
(`npm start init`). You can set `PREFIX=` (empty) when using the emulator for Firestore,
because it won't affect the data in production.

If you use the Emulator for the database, you must set the `databaseURL` to URL of the Emulator,
which you can retrieve from the terminal while the emulator is running.

### Starting the Emulators

To start the Emulators, run this command.

```sh
firebase emulators:start
```

To import data into the emulator that you have previously exported, you can run this command.

```
firebase emulators:start --import <path-to-directory>
```

### Import Production Data to the Local Emulator

To import production data to the Local Emulator you have to export the data first. Follow these
instructions to export your data:

1. Login to Firebase and Google Cloud:
   ```
   firebase login
   gcloud auth login
   ```
2. List your projects and connect to the project you want to export:

   ```
   firebase projects:list
   firebase use your-project-name

   gcloud projects list
   gcloud config set project your-project-name
   ```

3. Export the production data to a Google Cloud Storage bucket, providing a name for the folder:
   ```
   gcloud firestore export gs://your-project-name.appspot.com/your-choosen-folder-name
   ```
4. Copy this folder to your local machine:
   ```
   gsutil -m cp -r gs://your-project-name.appspot.com/your-choosen-folder-name .
   ```

Now you run the Emulator with the exported production data using the command mentioned above.

For more information, see this [guide](https://medium.com/firebase-developers/how-to-import-production-data-from-cloud-firestore-to-the-local-emulator-e82ae1c6ed8).

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
