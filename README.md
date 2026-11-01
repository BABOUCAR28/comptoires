# Le Comptoir des Belles Saveurs — site web (Node + Supabase)

Site vitrine + catalogue (sucrés, salés, fatayas, jus) + demandes de commande/devis + administration.
**Données en ligne dans Supabase** (Postgres + stockage des photos). Serveur Node **sans dépendance** (Node 18+), donc rien à `npm install`.

- `server.js` : API, authentification admin (sessions signées, mot de passe scrypt), validation serveur, anti-abus, sitemap/robots, pages avec SEO propre.
- `public/` : pages du site et `admin.html`.
- `supabase/schema.sql` : tables + sécurité (RLS) + dossier de photos. À exécuter une fois.
- `scripts/migrate-from-sqlite.js` : reprend votre ancienne base locale (produits, réglages, photos, demandes).
- `scripts/backup.js` : sauvegarde JSON. `tests/` : tests automatiques (faux Supabase local).
- `api/index.js`, `vercel.json` : déploiement Vercel. `render.yaml`, `Dockerfile`, `deploy/Caddyfile` : déploiement.

**Mise en ligne : `DEPLOIEMENT-VERCEL.md` (Vercel + Supabase) ou `DEPLOIEMENT.md` (Render + Supabase).** Guide de la responsable : `GUIDE.md`. Tests : `TESTS.md`.

## Sécurité
La clé secrète Supabase n'existe que dans les variables d'environnement du serveur (jamais dans le navigateur ni dans GitHub). Les tables ont la sécurité par ligne (RLS) activée sans règle publique : la clé publique « anon » ne peut rien lire. Le fichier `.env` est ignoré par git.

## Limites connues
Pas de paiement en ligne (hors périmètre). Notification de commande seulement si `NOTIFY_URL` est configuré, sinon consulter `/admin`. Limitation anti-abus en mémoire (par instance). Titres de page gérés côté serveur par page.
