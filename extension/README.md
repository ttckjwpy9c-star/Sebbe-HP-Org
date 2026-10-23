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
