# Mise en ligne sur Vercel + Supabase

**Supabase** = base de données et photos. **Vercel** = héberge le site (le serveur tourne en « fonction » Vercel, via `api/index.js` et `vercel.json`). Ce guide remplace la partie Render de `DEPLOIEMENT.md` ; les étapes 1 à 3 (Supabase, migration, GitHub) restent identiques.

## 1. Supabase (une seule fois)
1. Créez un projet sur supabase.com. **SQL Editor** → collez `supabase/schema.sql` → **Run**.
2. **Project Settings → API** : notez l'URL du projet et la clé **secrète** (« service_role » ou « secret »). Elle ne doit jamais être publiée.

## 2. Reprendre vos données locales (depuis votre PC, une seule fois)
`.env.example` → `.env` (renseignez `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`), puis :
```
npm run migrate -- ./data --dry     # aperçu, n'envoie rien
npm run migrate -- ./data           # produits, réglages, photos, demandes
```
Sans données locales : sautez cette étape, le site crée l'admin et le catalogue de départ au premier appel (`ADMIN_PASSWORD` de 10 caractères min.).

## 3. GitHub
Remplacez les fichiers de votre dépôt par ceux de ce projet, puis `git add . && git commit -m "Vercel + Supabase" && git push`. Le `.env` n'est pas envoyé (`.gitignore`).

## 4. Vercel
1. vercel.com → **Add New → Project** → importez le dépôt GitHub. Framework : **Other**. Laissez Build/Output vides.
2. **Settings → Environment Variables** (Production) :
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
   - `SESSION_SECRET` (texte aléatoire de 32+ caractères)
   - `SITE_URL` = adresse finale (ex. `https://votre-domaine.sn`)
   - `TRUST_PROXY` = `1`
   - `ADMIN_USER` / `ADMIN_PASSWORD` (seulement si vous n'avez pas migré)
   - `NOTIFY_URL` (optionnel)
3. **Deploy**. Ouvrez l'adresse `xxx.vercel.app`, puis `/admin`.
4. Domaine : **Settings → Domains**, puis l'enregistrement DNS indiqué. Mettez `SITE_URL` à jour et redéployez.

## 5. À vérifier au premier déploiement (je n'ai pas pu tester Vercel)
- Les pages `/sucres`, `/jus`, `/contact`, `/admin` s'ouvrent (sinon : onglet **Logs** du déploiement).
- `/api/public` renvoie le catalogue en JSON ; `/healthz` répond `ok`.
- Une demande de test apparaît dans `/admin` → Demandes.
- Si les pages donnent 404 ou « Introuvable » : envoyez-moi le message des Logs.

## 6. Limites propres à Vercel
- **Corps des requêtes limité à environ 4,5 Mo** : photos de 3 Mo maximum (l'admin les réduit déjà automatiquement).
- **Anti-abus** : la limitation de débit est en mémoire et propre à chaque instance ; sur Vercel elle est donc moins fiable. Le champ piège anti-robots et la validation restent actifs ; pour un vrai blocage, ajoutez la protection de Vercel (Firewall / Attack Challenge Mode).
- **Démarrage à froid** : après une période sans visite, la première requête est un peu plus lente.
- **Supabase gratuit** : pause après 7 jours d'inactivité, pas de sauvegarde automatique (voir `DEPLOIEMENT.md` §5). Faites `npm run backup` chaque semaine ou passez à l'offre Pro.
