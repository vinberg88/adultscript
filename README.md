# AdultScript

Node.js videoportal för cPanel. Importören hämtar metadata från Pornhubs Webmasters API och visar filmer med Pornhubs inbäddade spelare. Den laddar inte ned eller lagrar videofiler.

## Installation i cPanel

1. Skapa en Node.js-app med `index.js` som startfil och Node.js 22 eller senare. Kör `npm ci` i appens katalog.
2. Skapa en unik installationskod, till exempel i WHM Terminal med `openssl rand -hex 32`. Kopiera koden till cPanels miljövariabel `INSTALL_TOKEN`. Lägg aldrig koden i GitHub eller i ett chattmeddelande.
3. Starta om appen och öppna `https://din-domän/install` i webbläsaren. Ange installationskoden, välj adminanvändare och lösenord, samt antal sidor och ett eventuellt sökord för importen.
4. Efter installationen låses `/install`. Ta bort `INSTALL_TOKEN` från cPanel och starta om appen. Adminpanelen finns på `/secret-admin-panel-777`.

Installationssidan skriver bara `data/site.json` med en saltad hash av adminlösenordet och valen för importen. Den ändrar inte `videos.json`. Första importen börjar efter installationen och därefter vid midnatt enligt serverns tidszon. Befintliga poster sparas; nya Pornhub-poster läggs till utan dubbletter. Om API:t misslyckas lämnas filen orörd.

För en befintlig sajt: kopiera `videos.json` till en plats utanför appmappen före uppdateringen. Spara även `data/site.json` efter installationen som del av din ordinarie säkerhetskopia. `data/site.json` hålls utanför Git; det befintliga `videos.json` är fortfarande en spårad fil och måste bevaras vid uppdateringar.

## Alternativ utan webbinstaller

Om `INSTALL_TOKEN` inte är satt fortsätter appen att fungera med `ADMIN_USER` (standard `admin`) och `ADMIN_PASSWORD` i cPanels miljövariabler. `PORN_HUB_IMPORT_PAGES` (1–5) och `PORN_HUB_SEARCH` styr importen tills webbinstallationen har sparat egna val.

## Privat GitHub-repo

Ge servern en separat SSH-nyckel och lägg endast den publika nyckeln som en skrivskyddad deploy key i repots inställningar. Den privata nyckeln stannar på servern. Spara aldrig `ADMIN_PASSWORD`, `INSTALL_TOKEN`, SSH-nycklar eller `.env` i repot.

## Tester

`npm test` kör tester utan att kontakta Pornhub.
