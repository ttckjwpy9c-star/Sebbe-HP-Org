# Ordtoppen Läsassistent – Chrome/Edge (v0.3)

Markera **ett svenskt ord** på en vanlig webbsida, så visas automatiskt en kort **AI-genererad förklaring** på svenska i en liten ruta. Inget extra knapptryck behövs. Wiktionary används inte längre.

## Användning och begränsningar
1. Installera tillägget som beskrivet nedan och logga in via tilläggets ikon med ditt befintliga Ordtoppen-konto.
2. Markera ett enskilt ord i en artikel. Efter en kort fördröjning (350 ms) visas Ordtoppen-rutan. Förklaringen laddas automatiskt.
3. Stäng med × eller Escape, eller avaktivera läsassistenten i tilläggets meny eller på Ordtoppen-hemsidan.

- 20 GPT-anrop per konto och dag, och ett separat totalt pilottak på 50 anrop per dag på servern.
- Tidigare lyckade svar hålls i en tillfällig minnescache inom webbläsartilläggets bakgrundsprocess, max 120 poster. Minnescachen kan tömmas om webbläsaren stänger ned processen; den sparas inte permanent.
- Enbart det markerade ordet samt högst 260 tecken av närliggande text skickas till Ordtoppen/Supabase och därifrån OpenAI när uppslagningen startas. Ingen hel artikel skickas. **Eftersom anropet görs automatiskt bör användaren bara markera text som den vill skicka till AI:n.**
- AI-svar kan vara felaktiga. Ord och text används inte för att ändra Ordtoppens ordlista.
- Fungerar inte på `chrome://` / `edge://`-sidor, skyddade PDF-vyer eller de flesta webbläsarens egna gränssnitt.
- OpenAI API-nyckeln ligger i Supabase Secrets, inte i tillägget eller GitHub. Inloggning hanteras av Supabase Auth.

## Installera i Chrome eller Edge
1. Ladda ner repo-arkivet på https://github.com/ttckjwpy9c-star/Sebbe-HP-Org via **Code → Download ZIP** och extrahera.
2. Öppna `chrome://extensions` i Chrome eller `edge://extensions` i Edge.
3. Aktivera **Utvecklarläge**, välj **Läs in okomprimerat / Load unpacked** och välj `extension`-mappen som innehåller `manifest.json`.
4. Klicka på tilläggets ikon och logga in. Ladda om webbsidor som redan var öppna.

### Om du redan har installerat en äldre version
Ladda ner och extrahera senaste repo-filerna. Ersätt innehållet i **den mapp som ditt installerade tillägg pekar på** med de nya filerna från `extension`, och klicka **Uppdatera/Reload** på tillägget under `chrome://extensions` eller `edge://extensions`. Alternativt: ta bort det gamla tillägget och läs in den nya `extension`-mappen. I det senare fallet behöver du logga in igen.

Du behöver uppdatera det lokalt installerade tillägget manuellt tills det publiceras i en webbläsarbutik. **Att ändra GitHub uppdaterar inte automatiskt lokalt installerade tillägg.**

## Källor och ansvar
AI-genererade förklaringar från OpenAI via Supabase Edge Function `ordtoppen-gpt-pilot`. Svaret är avsett som pedagogiskt stöd och kan innehålla fel. För aktuell API-fakturering, se OpenAI Platform.

## Mina ord – personlig ordsamling (v0.4)

Efter en lyckad GPT-förklaring syns knappen **＋ Spara i Mina ord**. Du måste vara inloggad i tillägget med samma Supabase-konto som du använder på Ordtoppen. Sparade ord och deras AI-förklaringar lagras i `public.personal_words`, skyddat av RLS för den inloggade användaren. Det påverkar varken `public.words` eller `public.user_word_progress`.

På Ordtoppen öppnar du fliken **Mina ord**. Där finns sökbar ordlista, borttagning, och separat repetition med vändbara ordkort. Rätt svar schemaläggs enligt 1/3/7/14/30 dagar och sex rätt markerar ordet som bemästrat. Fel svar återkommer efter cirka tio minuter. Läget **Alla mina ord** ger möjlighet att träna på samtliga sparade ord, inklusive bemästrade.

Om ett ord redan är sparat ändras inte tidigare förklaring eller repetitionsstatus automatiskt. AI-betydelser kan vara felaktiga och bör tolkas som studiestöd.
