# YepNope

Web App mobile-first (PWA) realtime per decisioni di gruppo in stile swipe: crea una stanza privata senza login, condividi il link su WhatsApp/Telegram e fai swipe con gli amici fino al primo **match unanime**.

## Funzionalità MVP

- **Zero Login / Zero Attrito:** accesso immediato tramite codice stanza a 6 caratteri (`/room/X7K9P2`) e solo un nickname opzionale.
- **4 Modalità:**
  1. **Cosa si mangia:** 35 cucine e piatti curati con CTA dirette **Google Maps** e **Deliveroo** sul match.
  2. **Cosa guardiamo:** integrazione server-side con **TMDB** (`/api/tmdb/discover`) filtrabile per Film/Serie TV, piattaforme IT (Netflix, Prime Video, Disney+, Apple TV+, NOW/Sky) e genere, con fallback automatico a un mazzo mock di 15 titoli se `TMDB_API_KEY` non è impostata.
  3. **Cosa facciamo:** 32 attività concrete con filtri rapidi (*In casa*, *Fuori città / All'aperto*, *Serata low-cost*) e fascia budget (`€` / `€€` / `€€€`).
  4. **Liste libere:** creazione da zero (voce singola o *Incolla elenco* multilinea) + 3 modelli modificabili (*Meta del prossimo viaggio*, *Nome per il cane/gatto*, *Che gioco facciamo*), con card tipografiche e sfumature generate deterministicamente dal testo.
- **Realtime & Modalità Demo:** sincronizzazione via **Supabase Realtime** (PostgreSQL + RPC atomica anti race-condition), con fallback automatico a **Modalità Demo locale** (`localStorage` + `BroadcastChannel` multi-tab + simulatore amico demo) quando le credenziali Supabase non sono configurate.
- **Schermata Match & Top 3:** card celebrativa verticale 9:16 ottimizzata per screenshot/Storie + classifica Top 3 con percentuale di accordo se il mazzo finisce senza match unanime.
- **PWA & i18n:** `manifest.json` pronto per "Aggiungi alla schermata Home", UI in italiano di default con switch rapido IT/EN e tema Light/Dark.

## Avvio rapido in locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apri `http://localhost:3000`. Anche lasciando `.env.local` vuoto puoi testare subito l'intera app in **Modalità Demo locale** (puoi cliccare **"Simula amico (Demo)"** in lobby oppure aprire il link della stanza in una seconda scheda del browser).

## Collegamento Supabase

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri **SQL Editor** nella dashboard Supabase ed esegui tutto il file [`supabase/schema.sql`](./supabase/schema.sql) (crea tabelle `rooms`, `participants`, `votes`, indici, RPC atomica `cast_vote_and_check_match`, policy RLS, pubblicazione Realtime e funzione di pulizia stanze >24h).
3. Copia `Project URL` e `anon public key` da **Project Settings → API** dentro `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Collegamento TMDB

1. Registrati su [themoviedb.org](https://www.themoviedb.org/settings/api) e genera una API Key (v3) oppure un Read Access Token (v4).
2. Aggiungila in `.env.local` **senza** prefisso `NEXT_PUBLIC_` (resta esclusivamente lato server in `/api/tmdb/discover`):

```env
TMDB_API_KEY=la-tua-chiave-tmdb
```
