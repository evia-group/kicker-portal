# PWA: Service Worker und Manifest

Kurze Begruendung der Entscheidungen in `ngsw-config.json`,
`public/manifest.webmanifest` und `docker/nginx.conf`. JSON kennt keine
Kommentare, deshalb steht es hier.

## `config.json` niemals in einer `assetGroup`, immer `freshness`

`config.json` wird beim Containerstart aus den Umgebungsvariablen erzeugt
(`docker/generate-runtime-config.sh`) und enthaelt `apiUrl`, den Entra-Tenant und
die Client-ID. Landet sie in einer `assetGroup`, also im Vorrat des
Service Workers, startet ein neuer Container mit neuen Werten weiterhin gegen die
alte Konfiguration, bis der Nutzer den Cache leert. Ein Deployment waere
wirkungslos, ohne dass es auffaellt.

Sie darf aber auch nicht vollstaendig ungecacht bleiben: `src/main.ts` holt sie
**vor** dem Bootstrap und startet die Anwendung erst danach. Ohne jeden Cache
bliebe die Seite offline leer, und das gecachte App-Shell waere wertlos.

Deshalb steht sie in einer eigenen `dataGroup` mit Strategie `freshness` und 3
Sekunden Zeitlimit:

- online wird immer zuerst das Netz gefragt, ein neuer Container wirkt also beim
  naechsten Laden
- offline greift die letzte bekannte Fassung, die Anwendung startet
- gespeichert wird genau ein Eintrag (`maxSize: 1`)

In den `assetGroups` ist sie weiterhin in **keiner** Gruppe enthalten:

- `assetGroups.app` listet nur `/favicon.ico`, `/index.html`,
  `/manifest.webmanifest`, `/*.css` und `/*.js`. `/config.json` passt auf keines
  dieser Muster.
- `assetGroups.essentials` und `assetGroups.assets` verlangen ein Praefix
  `/media/`, `/assets/` oder `/icons/`.

Wer hier eine `assetGroup` erweitert, muss pruefen, dass `/config.json`
weiterhin durchfaellt.

Der nginx-Header `Cache-Control: no-store` auf `/config.json` bleibt richtig: er
betrifft den HTTP-Cache des Browsers, nicht den Service Worker, und verhindert,
dass die Datei am Service Worker vorbei veraltet ausgeliefert wird.

## Warum `dataGroups` nur `/api/**` abdeckt

`apiUrl` ist Laufzeitkonfiguration und kann je Umgebung eine andere Herkunft
haben:

- hinter Caddy (`docker/Caddyfile`) liegt die API **same-origin** unter `/api/*`,
  der Prefix wird beim Weiterleiten entfernt
- in der lokalen Entwicklung zeigt `API_URL` auf `http://localhost:3000`, also
  eine andere Herkunft

`ngsw-config.json` wird zur Build-Zeit ausgewertet und kennt `apiUrl` nicht. Ein
Muster kann also nicht beide Faelle treffen. Gewaehlt ist die same-origin-Form,
weil sie dem Produktivbetrieb entspricht. In der lokalen Entwicklung wird
dadurch nichts gecacht, was richtig ist und nicht kaputt.

Strategie ist `freshness` mit 5 Sekunden Zeitlimit: erst Netz, bei Zeitablauf der
Cache. Eine Bestenliste darf im Zweifel kurz alt sein, aber sie darf nicht
bevorzugt aus dem Cache kommen.

## Warum Schrift und Uebersetzungen `prefetch` sind

Die `assets`-Gruppe des Schematics ist `lazy`, also wird erst beim ersten Zugriff
gecacht. Fuer die selbst gehostete Icon-Schrift (`/media/**`) und die
Uebersetzungen (`/assets/i18n/*.json`) waere das zu spaet: beim ersten
Offline-Besuch haette die App weder Icons noch Texte. Beides ist klein und wird
immer gebraucht, deshalb liegen sie in einer eigenen `prefetch`-Gruppe. Die
App-Icons und die SVGs bleiben `lazy`, sie sind fuer die Darstellung nicht
notwendig.

## Manifest: `maskable` und `any` getrennt

Das Angular-Schematic vergibt beiden Zwecke an dieselbe Datei
(`"purpose": "maskable any"`). Das passt nie fuer beide: ein maskable
gestaltetes Icon hat Rand, damit der Beschnitt auf einen Kreis mit 80%
Durchmesser nichts abschneidet, und wirkt als `any` dadurch zu klein. Ein
`any`-Icon nutzt die Flaeche aus und verliert im Beschnitt seine Kanten.

Deshalb zwei Motive aus derselben Formensprache:
`src/assets/svg/app-icon.svg` und `src/assets/svg/app-icon-maskable.svg`. Die
PNGs erzeugt `tools/generate-icons.sh`, die SVGs sind die Quelle.

## nginx: der Service Worker darf nicht gecacht werden

`ngsw-worker.js` und `ngsw.json` bekommen `Cache-Control: no-cache`. `ngsw.json`
ist das Manifest, an dem der Service Worker erkennt, ob es eine neue Version
gibt. Wird es aus einem HTTP-Cache bedient, findet er die neue Version nie und
die App bleibt auf dem alten Stand stehen.

## iOS

Web Push funktioniert auf iOS erst ab 16.4 und nur in der **installierten** PWA,
nicht im Safari-Tab. Der Hinweis zum Hinzufuegen zum Home-Bildschirm
(`add-to-home-screen`-Komponente) ist deshalb keine Politur, sondern die
Voraussetzung dafuer, dass Benachrichtigungen auf iOS ueberhaupt ankommen.
