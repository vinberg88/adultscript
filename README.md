# AdultScript

Node.js videoportal för cPanel. Importören hämtar metadata från Pornhubs Webmasters API och visar filmer med Pornhubs inbäddade spelare. Den laddar inte ned eller lagrar videofiler.

## Installation

1. Skapa en Node.js-app i cPanel med `index.js` som startfil. Använd Node.js 22 eller senare.
2. Kör `npm install` i appens katalog.
3. Lägg in följande miljövariabler i cPanel, med ett eget långt lösenord:

   - `ADMIN_USER=admin`
   - `ADMIN_PASSWORD=<eget långt lösenord>`
   - `PORN_HUB_IMPORT_PAGES=1` (1–5 sidor, ungefär 30 filmer per sida)
   - `PORN_HUB_SEARCH=` (valfritt sökord; tomt ger de senaste filmerna)

4. Starta om appen. Importen körs vid start och varje dag vid midnatt enligt serverns tidszon. Den kan även startas manuellt i adminpanelen på `/secret-admin-panel-777`.

Importen sparar bara nya Pornhub-ID:n. Om API:t inte svarar behålls `videos.json` som den är. Befintliga testfilmer raderas inte automatiskt. Gör en kopia av `videos.json` före ändringar på en befintlig installation.

## Privat GitHub-repo

Skapa en separat SSH-nyckel på servern och lägg **endast den publika nyckeln** som en skrivskyddad deploy key i repots inställningar. Den privata nyckeln stannar på servern. Spara inte `ADMIN_PASSWORD`, SSH-nycklar eller `.env` i GitHub; `.env` är ignorerad av Git.

## Lokal kontroll

`npm test` kör importörens tester utan att kontakta Pornhub.
