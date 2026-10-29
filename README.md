# AdultScript - Sök bland filmerna =)

<img width="700" height="380" alt="57687c" src="https://github.com/user-attachments/assets/16c183d9-c309-47cb-b862-36d31a82a30a" />

---

Node.js videoportal för cPanel. Importören hämtar metadata från Pornhubs Webmasters API och visar filmer med Pornhubs inbäddade spelare. Den laddar inte ned eller lagrar videofiler.

## Snabbstart för många sajter

1. Skapa **en egen Node.js-app per domän** i cPanel. Välj Git-källan `https://github.com/vinberg88/adultscript.git` och Node.js 22 eller senare.
2. Sätt ett **unikt långt `ADMIN_PASSWORD` per app** i Advanced vid skapandet eller i appens **App Env** efteråt. `ADMIN_USER` är valfritt och är `admin` som standard. Spara lösenorden i din lösenordshanterare, aldrig i Git eller sajtplansfilen.
3. Välj **Deploy** eller **Redeploy**. Öppna domänen och adminpanelen på `/secret-admin-panel-777`. `/install` behövs inte med den här metoden.

Namnet hämtas automatiskt från domänens rad i `links.json`. För andra domäner används första delen av domännamnet, till exempel **Snusk** för `snusk.eu`. Du kan ändra namnet med `SITE_NAME` och accentfärgen med `SITE_ACCENT` (format `#RRGGBB`) i App Env. `PORN_HUB_IMPORT_PAGES` (1–5) och `PORN_HUB_SEARCH` styr varje apps egen filmimport. Ändringar i App Env kräver **Redeploy**.

Varje app använder sin egen `data/videos.json`. Vid första starten kopieras en eventuell äldre `videos.json` dit utan att originalet tas bort. Innan du uppdaterar en befintlig sajt, ta ändå en separat säkerhetskopia av `videos.json` och `data/site.json` och kontrollera filmantalet efteråt. cPanels hantering av appdata vid redeploy måste verifieras på en testsajt innan samma uppdatering görs på alla sajter.

Kör `npm run sites:plan -- sökväg/till/site-plan.csv` för att skapa en granskningslista av de **64 unika domänerna** i `links.json`. Fyll i status och eventuella sökord/färger i listan. Den innehåller inga lösenord och skapar inte appar i cPanel.

## Valfri webbinstaller

Vill du i stället välja adminuppgifter på en installationssida, sätt en unik `INSTALL_TOKEN` på minst 32 tecken i App Env, välj Redeploy och öppna `/install`. Efter installationen tar du bort `INSTALL_TOKEN` och väljer Redeploy igen. Installationen sparar en saltad lösenordshash i `data/site.json`. Den här metoden behövs inte för snabbstarten ovan.

## Reklamplatser

De publika sidorna har två stora reklamplatser: en under sidhuvudet eller startsidans introduktion och en före sidfoten. Båda är märkta **Annons** och visar en platshållare tills annonskod har lagts till. Övre och nedre annonsen kan ändras var för sig i `views/partials/ad-top.ejs` respektive `views/partials/ad-bottom.ejs`. Mallarna används av startsidan, videosidan och länksidan. Lägg aldrig in privata nycklar eller lösenord i annonskoden.

## GitHub-repo

För det publika repot används `https://github.com/vinberg88/adultscript.git` i cPanel utan SSH-nyckel. Om repot senare blir privat igen behöver servern en separat SSH-nyckel; lägg då endast den publika delen som en skrivskyddad deploy key i GitHub. Spara aldrig `ADMIN_PASSWORD`, `INSTALL_TOKEN`, SSH-nycklar eller `.env` i repot.

## Tester

`npm test` kör tester utan att kontakta Pornhub.

