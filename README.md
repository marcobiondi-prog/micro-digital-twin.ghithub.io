# Micro Digital Twin

Web app (PWA installabile) per la mitigazione del calore in ambito urbano e vitivinicolo:
casi studio, Decision Lab, dashboard, camera AR con riconoscimento AI e pannello di controllo.

Stack: TanStack Start (React 19, SSR), Tailwind CSS 4, Supabase (database, login, file), Nitro per il deploy.

## 1. Crea il progetto Supabase

1. Vai su <https://supabase.com>, crea un account e un nuovo progetto (regione consigliata: Europe).
2. Applica lo schema. Due modi:
   - **SQL Editor** (più semplice): apri *SQL Editor → New query*, incolla tutto
     `supabase/migrations/20261019000000_init.sql` e premi *Run*.
   - **CLI**: `npx supabase login`, `npx supabase link --project-ref <project-ref>`, `npx supabase db push`.
3. *Authentication → URL Configuration*:
   - **Site URL**: l'indirizzo del sito (in sviluppo `http://localhost:8080`).
   - **Redirect URLs**: aggiungi `http://localhost:8080/**` e `https://<tuo-dominio>/**`.
4. Login con Google (facoltativo): *Authentication → Sign In / Providers → Google*. Crea un client OAuth
   in Google Cloud Console (tipo *Web application*) con redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback` e incolla Client ID e Secret.

## 2. Configura le variabili

L'app usa sempre il progetto Supabase indicato in `src/integrations/supabase/config.ts`
(indirizzo e chiave pubblica `sb_publishable_…`, dati pubblici per natura). Per un altro progetto
cambia quei due valori. Le chiavi segrete restano fuori dal codice:

```bash
cp .env.example .env
```

Compila `.env` (e le *Environment Variables* della piattaforma di hosting) con la chiave segreta
`SUPABASE_SERVICE_ROLE_KEY` (*Project Settings → API Keys*) e le chiavi dei servizi esterni.
Senza `OPENAI_API_KEY`, `GOOGLE_MAPS_API_KEY` o `PARALLEL_API_KEY` l'app funziona lo stesso:
le relative funzioni mostrano "non configurato". Lo stato di ogni servizio si vede nel pannello admin.

### Video della home

I video promozionale e tutorial sono in `public/videos/` (nomi in `public/videos/LEGGIMI.txt`).
Su tablet e desktop il tutorial parte da solo solo al primo accesso; su smartphone si apre a schermo intero in orizzontale.

## 3. Avvia in locale

```bash
npm install
npm run dev
```

Apri <http://localhost:8080>.

## 4. Diventa amministratore

Registrati nell'app, poi nel *SQL Editor* di Supabase esegui (con la tua email):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'tua@email.it';
```

Ricarica la pagina: nel menu account compare **Pannello di controllo** (`/admin`).
Da lì puoi nominare altri amministratori senza tornare in SQL.

### Cosa fa il pannello

| Sezione | Funzioni |
| --- | --- |
| Panoramica | Numero utenti, admin, pareri in attesa, dashboard salvate; servizi configurati |
| Utenti | Ricerca, rendi/rimuovi admin, sospendi/riattiva, elimina (con i suoi file) |
| Pareri | Richieste di parere agli enti: filtra, approva/respingi/riapri, elimina |
| Fonti casi | Stato della ricerca delle pubblicazioni; pulsante *Aggiorna ora* |
| Servizio AI | Riattiva il riconoscimento AR se è in pausa per credito o chiave non valida |
| Registro | Ogni azione degli amministratori, con autore e data |

Tutte le azioni passano da funzioni server che verificano il ruolo admin con la chiave segreta:
il browser non ha mai accesso diretto ai dati degli altri utenti.

## 5. Pubblica

```bash
npm run build
npm start          # server Node su http://localhost:3000 (PORT per cambiarla)
```

`npm run build` produce `.output/` (server + file statici). Nitro riconosce da solo Vercel, Netlify e
Cloudflare; per forzare una piattaforma: `NITRO_PRESET=cloudflare-module npm run build`.
Su Vercel imposta anche `PWA_OUT_DIR=.vercel/output/static`, così il service worker finisce nella cartella giusta.
Ricorda di impostare le stesse variabili di `.env` sulla piattaforma di hosting.

### Aggiornamento automatico delle fonti (facoltativo)

La ricerca giornaliera delle fonti dei casi studio è un endpoint protetto:

```bash
curl -X POST https://<tuo-dominio>/api/public/jobs/case-sources -H "Authorization: Bearer $CRON_SECRET"
```

Pianificalo con il cron della tua piattaforma oppure da Supabase (*Integrations → Cron*, estensioni `pg_cron` e `pg_net`):

```sql
select cron.schedule('case-sources-daily', '0 6 * * *', $$
  select net.http_post(
    url := 'https://<tuo-dominio>/api/public/jobs/case-sources',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$$);
```

## Comandi utili

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo su porta 8080 |
| `npm run build` / `npm start` | Build di produzione e avvio |
| `npm test` | Test unitari (Vitest) |
| `npm run lint` | ESLint |
