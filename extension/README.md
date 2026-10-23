# Ordtoppen Läsassistent (Chrome / Edge) – prototyp 0.1

Ett fristående **Manifest V3-tillägg**. På vanliga webbsidor kan användaren markera ett svenskt ord för att få en svensk Wiktionary-betydelse i en liten ruta, utan att lämna texten.

## Funktioner
- Markera ett enskilt ord med musen eller tangentbordet.
- Definitionsrutan stängs med × eller Escape.
- Endast markerade uppslagsord skickas till **sv.wiktionary.org**.
- På/av i tilläggets egen meny och på Ordtoppen-hemsidans meny (när tillägget är installerat).
- Ingen inloggning, inga ord eller träningsresultat skrivs till Supabase i denna första version.
- Om ordet inte finns, eller Wiktionarys formatering är svårtolkad, visas länk till källan.

## Installera i Chrome
1. Öppna `chrome://extensions`
2. Aktivera **Utvecklarläge**.
3. Klicka **Läs in okomprimerat / Load unpacked**.
4. Välj den nedladdade mappen `extension` (den som innehåller `manifest.json`).
5. Öppna en vanlig nyhetsartikel, ladda om artikeln och markera ett enskilt svenskt ord.

## Installera i Edge
1. Öppna `edge://extensions`.
2. Aktivera **Utvecklarläge**.
3. Klicka **Load unpacked / Läs in uppackat** och välj `extension`-mappen.

### Installera från GitHub
På kodprojektets sida välj **Code → Download ZIP**, extrahera och välj **extension**-mappen i stegen ovan. Att lägga koden på GitHub installerar **inte** webbläsartillägget automatiskt.

## Slå på/av från Ordtoppen
Öppna Ordtoppen i samma webbläsarprofil där tillägget installerats. När tillägget är aktivt kan hemsidan skicka användarens på/av-val till webbläsartillägget. När tillägget saknas förblir inställningen inaktiv och visar installationsinformation.

## Begränsningar och integritet
- Endast vanliga `http(s)`-sidor, inte interna browser-sidor eller skyddade PDF-vyer.
- Enkel uppslagning av grundform: böjningar saknas ibland.
- Ordförklaringar tolkas ur **svenska** Wiktionarys öppna uppslagsmaterial; vissa sidor kan sakna maskinläsbar förklaring. Uppslagen är inte kvalitetssäkrade av Ordtoppen.
- Wiktionary-material kräver korrekt källa och licenshantering (CC BY-SA).
- Detta är en lokal prototyp; den är inte granskad av Chrome Web Store eller publicerad där.
- Content script körs på vanliga webbplatser för att kunna reagera på markering. Det tar inte emot och skickar inte hela artikeltexter eller lösenord.

Källor: https://sv.wiktionary.org och https://creativecommons.org/licenses/by-sa/4.0/


## GPT-pilot 0.2 – frivillig funktion

Läsassistenten fortsätter att visa svenska Wiktionary som vanligt. Under definitionen finns en knapp **Förklara enklare med GPT**. Klicka bara när du vill ha en kort AI-förklaring. Om du vill kan den skickade texten innehålla en kort mening kring ordet (högst 260 tecken); ingen hel artikel skickas.

### Aktivera som projektägare
1. Skapa en separat **OpenAI API key** på https://platform.openai.com/api-keys med fakturering aktiverad och en låg användningsbudget i OpenAI-projektet.
2. Öppna Supabase-projektets **Edge Functions → Secrets**: https://supabase.com/dashboard/project/hkijnyhmpcczihmnepww/functions/secrets .
3. Lägg till secret med namnet **OPENAI_API_KEY** och nyckeln som värde. *Nyckeln får aldrig finnas i index.html, GitHub eller själva tillägget.* Dela inte nyckeln i chatten.
4. Edge-funktionen `ordtoppen-gpt-pilot` är redan driftsatt men ger ett tydligt 503-svar innan secret finns.
5. Hämta den uppdaterade koden från GitHub på nytt, ersätt din lokala extension-mapp, och klicka **Reload/Uppdatera** på kortet för Ordtoppen Läsassistent under chrome://extensions eller edge://extensions. Om du flyttar mappen kan du behöva välja **Läs in okomprimerat** igen.
6. Klicka på tilläggets ikon och logga in med ditt befintliga Ordtoppen-konto. Lösenordet skickas till Supabase Auth, inte till OpenAI, och sparas inte i tillägget. När du markerar ett ord kan du klicka **Förklara enklare med GPT**.

### Kostnadsskydd
- 5 GPT-anrop per inloggat konto och dag.
- Totalt högst 50 GPT-anrop/dag för piloten.
- Ett anrop får högst 180 utmatningstoken; modellen är `gpt-6-luna`.
- Det här begränsar antal möjliga anrop; sätt också en separat budget/utgiftsgräns hos OpenAI. Budgeten kan bero på projektets faktureringsfunktioner och är inte samma sak som anropsbegränsningen.
- API-kostnader debiteras separat från ChatGPT-abonnemanget.

### Kvalitet och integritet
GPT-svaren är AI-genererade och kan innehålla fel, särskilt om ordet har flera betydelser. Wiktionarys definition och källänk visas separat. Funktionens lösenordsautentisering och access-token hanteras av Supabase Auth. Login-token sparas lokalt av Chrome/Edge-tillägget; ingen GPT-nyckel sparas där.

Denna pilot är kodad och driftsatt men behöver verkliga användartester med en riktig API-nyckel innan vi betraktar den som färdig.
