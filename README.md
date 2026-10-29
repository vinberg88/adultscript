# AdultScript - Sök bland filmerna =)

<img width="700" height="380" alt="57687c" src="https://github.com/user-attachments/assets/16c183d9-c309-47cb-b862-36d31a82a30a" />

---

Node.js videoportal för cPanel. Importören hämtar metadata från Pornhubs Webmasters API och visar filmer med Pornhubs inbäddade spelare. Den laddar inte ned eller lagrar videofiler.

Startsidan visar högst 100 filmer per sida med numrerade sidor och Föregående/Nästa. Sorteringen följer med när man byter sida; miniatyrbilder laddas först när de behövs.

`/kategorier` visar kategorier som faktiskt finns i Pornhubs videometadata. Välj en kategori för att filtrera filmerna; sortering och sidbyte behåller filtret. Nya importerade filmer får kategorier direkt. Vid nästa import fylls kategorier även på för befintliga Pornhub-filmer som fortfarande finns i de hämtade importsidorna. Filmer utan kategoridata visas fortfarande under Alla.

## Snabbstart för många sajter

1. Skapa **en egen Node.js-app per domän** i cPanel. Välj Git-källan `https://github.com/vinberg88/adultscript.git` och Node.js 22 eller senare.
2. Sätt ett **unikt långt `ADMIN_PASSWORD` per app** i Advanced vid skapandet eller i appens **App Env** efteråt. `ADMIN_USER` är valfritt och är `admin` som standard. Spara lösenorden i din lösenordshanterare, aldrig i Git eller sajtplansfilen.
3. Välj **Deploy** eller **Redeploy**. Öppna domänen och adminpanelen på `/secret-admin-panel-777`. `/install` behövs inte med den här metoden.

Namnet hämtas automatiskt från domänens rad i `links.json`. För andra domäner används första delen av domännamnet, till exempel **Snusk** för `snusk.eu`. Du kan ändra namnet med `SITE_NAME` och accentfärgen med `SITE_ACCENT` (format `#RRGGBB`) i App Env. `PORN_HUB_IMPORT_PAGES` (1–5) och `PORN_HUB_SEARCH` styr varje apps egen filmimport. Ändringar i App Env kräver **Redeploy**.

## Admin: teman, import och AI-förslag

I adminpanelen kan du välja mellan fyra teman, ställa in accentfärg, slå av eller på automatisk import, välja daglig timme enligt serverns tidszon, antal importsidor och sökord. Inställningarna sparas per app i `data/admin-settings.json`. Utan sparade inställningar gäller fortfarande tidigare App Env eller webbinstallerns importval; automatisk import sker vid start och dagligen omkring klockan 00 enligt serverns tidszon. Den manuella importknappen fungerar även när automatisk import är avstängd.

Två AI-knappar ger förslag om importen och tre utkast till neutral sajttext. Förslagen visas bara i admin och ändrar eller publicerar inget. Om du vill aktivera dem sätter du `OPENAI_API_KEY` i appens **servermiljö**, aldrig i GitHub eller webbsidan. Standardmodellen är `gpt-6-luna`; `OPENAI_MODEL` kan användas för att välja en annan tillgänglig modell. API-anropen skickar bara aggregerat filmantal och källor samt sajtens namn/domän för textförslag; filmtitlar och lösenord skickas inte. Funktionen använder OpenAI API och kan medföra API-kostnad; eventuella API-krediter beror på ditt konto. Utan nyckel fungerar resten av adminpanelen som vanligt.

Varje app använder sin egen `data/videos.json`. Vid första starten kopieras en eventuell äldre `videos.json` dit utan att originalet tas bort. Innan du uppdaterar en befintlig sajt, ta ändå en separat säkerhetskopia av `videos.json` och `data/site.json` och kontrollera filmantalet efteråt. cPanels hantering av appdata vid redeploy måste verifieras på en testsajt innan samma uppdatering görs på alla sajter.

Kör `npm run sites:plan -- sökväg/till/site-plan.csv` för att skapa en granskningslista av de **64 unika domänerna** i `links.json`. Fyll i status och eventuella sökord/färger i listan. Den innehåller inga lösenord och skapar inte appar i cPanel.

## Valfri webbinstaller

Vill du i stället välja adminuppgifter på en installationssida, sätt en unik `INSTALL_TOKEN` på minst 32 tecken i App Env, välj Redeploy och öppna `/install`. Efter installationen tar du bort `INSTALL_TOKEN` och väljer Redeploy igen. Installationen sparar en saltad lösenordshash i `data/site.json`. Den här metoden behövs inte för snabbstarten ovan.

## Reklamplatser

De publika sidorna har två stora reklamplatser: en under sidhuvudet eller startsidans introduktion och en före sidfoten. Båda är märkta **Annons** och visar en platshållare tills de aktiveras. Öppna `/secret-admin-panel-777`, fyll i **Reklam** med bildadress och klickadress för övre och nedre banner och välj **Publicera annonser**. Bilderna ska ha publika HTTPS-adresser. Varje app sparar sina annonser separat i `data/ads.json`; en ändring syns direkt utan Redeploy. Filen är inte med i Git. Vid första uppsättningen kan cPanels App Env användas med `AD_TOP_IMAGE_URL`, `AD_TOP_TARGET_URL`, `AD_BOTTOM_IMAGE_URL` och `AD_BOTTOM_TARGET_URL`; de gäller tills annonser sparas i admin. Kontrollera att cPanel bevarar `data/` när du senare kör Redeploy.

## GitHub-repo

För det publika repot används `https://github.com/vinberg88/adultscript.git` i cPanel utan SSH-nyckel. Om repot senare blir privat igen behöver servern en separat SSH-nyckel; lägg då endast den publika delen som en skrivskyddad deploy key i GitHub. Spara aldrig `ADMIN_PASSWORD`, `INSTALL_TOKEN`, SSH-nycklar eller `.env` i repot.

## Tester

`npm test` kör tester utan att kontakta Pornhub.

