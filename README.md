# HP-Ord

HP-Ord är en svensk ordtränare inför högskoleprovet med vändbara ordkort, repetition, inloggning och sparade framsteg i Supabase.

## Webbplats
Webbplatsen består av en statisk `index.html` och använder Supabase för användarkonton och orddata. Den senaste färdiga versionen är HP-Ord v11 (Hem, Bemästrat och progressbar).

## Första installationen
1. Lägg senaste `index.html` i repositoryts rot via GitHub Desktop.
2. Publicera ändringen med **Commit to main** och **Push origin**.
3. Aktivera Pages i GitHub → **Settings → Pages → Deploy from a branch → main / (root) → Save**.
4. Webbplatsen får adressen https://ttckjwpy9c-star.github.io/Sebbe-HP-Org/ när Pages är aktiverat och första publiceringen är klar.

**OBS:** GitHub Free kräver normalt ett offentligt repository för GitHub Pages. Ändra inte repositoryts synlighet utan ett medvetet beslut. Själva Pages-webbplatsen blir publik. Lägg aldrig Supabase `service_role`-nyckel, lösenord eller en lokal `.env`-fil i GitHub. Den publika `sb_publishable_`-nyckeln kan finnas i klientkoden när rätt RLS-skydd används.

## Fortsatt utveckling
Filerna uppdateras i det här repositoryt. Varje uppdatering av `main` publiceras automatiskt av GitHub Pages när publiceringen är aktiverad.

## Datakällor
LEXIN / Språkbanken (CC BY 4.0) för importerade ord. Befintliga äldre definitioner kan ha annan proveniens.
