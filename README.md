# Salle des Fêtes — Calendrier & Réservations

## Offline Electron licensing

The Electron build requires a signed license before it opens the reservation
interface. License verification runs in Electron's main process and uses an
Ed25519 public key; the renderer only submits a key through the restricted
preload IPC bridge. The repository and customer build contain only the public
verification key; private signing material and license-generation tools are
kept out of version control.

Run the focused signature, expiry, and persistence tests with
`npm run test:license`.

## Version Windows hors-ligne

Cette version est une application Desktop Electron autonome. Les réservations,
versements et remises sont enregistrés automatiquement dans SQLite; aucune
connexion Internet ni API externe n'est requise pour les fonctions principales.

Les données ne sont jamais placées dans le dossier d'installation ou le dossier
du projet. Sous Windows elles se trouvent dans :

```
%LOCALAPPDATA%\Salle des Fêtes\
  database\salle-des-fetes.db
  backups\
  files\
  settings\
```

Dans l'application, les boutons **Sauvegarde** et **Restaurer** permettent de
choisir un fichier local. La restauration demande une confirmation avant de
remplacer la base actuelle.

### Build Windows

```powershell
npm install
npm run build
npm run dist
npm run dist:portable
```

Le package n'est pas signé. Windows peut donc afficher un avertissement
SmartScreen tant qu'un certificat de signature de code n'a pas été configuré.

App de gestion de réservations pour salle(s) des fêtes : calendrier public de disponibilités, espace gérant (versements, remises, statuts), reporting des revenus, export `.xlsx` / `.ics`.

Stack : TanStack Start · React · TypeScript · Tailwind CSS · Supabase (auth + Postgres).

## Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com) (gratuit pour démarrer)

## Configuration

1. Copie `env` en `.env` et renseigne les valeurs de ton projet Supabase (Project Settings → API) :

   ```
   SUPABASE_PROJECT_ID="..."
   SUPABASE_PUBLISHABLE_KEY="..."
   SUPABASE_URL="https://xxxx.supabase.co"
   VITE_SUPABASE_PROJECT_ID="..."
   VITE_SUPABASE_PUBLISHABLE_KEY="..."
   VITE_SUPABASE_URL="https://xxxx.supabase.co"
   ```

   La clé publiable (`sb_publishable_...`) est faite pour être exposée côté client — ce n'est pas un secret.

2. Crée les tables suivantes dans Supabase (`profiles`, `user_roles`, `salles`, `reservations`, `versements`, `remises`) avec les colonnes utilisées dans `src/lib/booking.functions.ts` et `src/integrations/supabase/types.ts`, plus une fonction `has_role(_user_id uuid, _role text) returns boolean`.

3. **Active Row Level Security (RLS) sur chaque table** et écris des policies qui restreignent :
   - un gérant à ses propres lignes (`gerant_id = auth.uid()`) pour lecture/écriture sur `salles`, `reservations`, `versements`
   - les remises (`remises`) à l'écriture admin uniquement
   - la lecture publique (anonyme) aux colonnes non sensibles de `reservations` (date, slot, status — pas nom/téléphone client) pour le calendrier public

   Le code applicatif fait déjà les vérifications d'usage, mais RLS reste la ligne de défense qui protège vraiment les données si une requête contourne l'UI.

4. Régénère les types TypeScript exacts (recommandé, remplace l'approximation dans `src/integrations/supabase/types.ts`) :

   ```
   npx supabase login
   npx supabase gen types typescript --project-id <ton-project-id> > src/integrations/supabase/types.ts
   ```

5. Si tu veux la connexion Google, active le provider Google dans Supabase (Authentication → Providers) et configure l'URL de redirection.

## Développement

```sh
npm install
npm run dev
```

## Build & lancement en production

```sh
npm run build:web  # build SSR web pour un déploiement Node/Vercel
node .output/server/index.mjs  # lance le build web localement
```

Le build web utilise Nitro `node-server` en local et son preset Vercel pendant les builds Vercel. `vercel.json` sélectionne `npm run build:web`; le build Electron reste séparé dans `npm run build`.

### Déploiement Vercel

Importe le dépôt dans Vercel en gardant le répertoire racine à `.`. Les commandes d'installation et de build sont définies dans `vercel.json`; Vercel utilisera `npm ci --ignore-scripts` (sans les scripts natifs réservés à Electron), puis `npm run build:web`.

**Important :** sans le pont de base de données Electron, la version web utilise actuellement `localStorage` dans le navigateur. Les réservations ne sont donc ni partagées entre visiteurs ni stockées sur un serveur. Avant d'utiliser le site pour des réservations réelles, connecte un backend persistant et configure son authentification et ses règles d'accès.

## Structure

- `src/routes/index.tsx` — calendrier public + formulaire de demande de réservation
- `src/routes/auth.tsx` — connexion / inscription gérant
- `src/routes/_authenticated/dashboard.tsx` — calendrier gérant, versements, remises, exports
- `src/routes/_authenticated/revenus.tsx` — reporting mensuel/annuel
- `src/lib/booking.functions.ts` — server functions (Supabase)
- `src/lib/exports.ts` — export `.xlsx` (SheetJS) et `.ics`
- `src/lib/receipt.ts` — génération de reçu PDF
- `src/integrations/supabase/` — clients Supabase (browser + serveur, cookie-based via `@supabase/ssr`)
