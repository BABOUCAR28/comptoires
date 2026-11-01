# Mise en ligne pas à pas (Supabase + Render)

Rôles : **Supabase** = base de données et photos en ligne. **Render** (ou Railway, Fly…) = fait tourner `server.js`. Supabase n'héberge pas ce serveur Node, et GitHub Pages non plus (il ne sert que des fichiers statiques).

## 1. Créer le projet Supabase
1. supabase.com → New project (choisissez une région proche, notez le mot de passe de la base).
2. **SQL Editor → New query** : collez tout `supabase/schema.sql` → **Run**.
3. **Project Settings → API** : copiez l'**URL** (`https://xxxx.supabase.co`) et la clé **secrète** (« service_role » ou « secret »). Ne la partagez jamais, ne la mettez pas sur GitHub.

## 2. Reprendre vos données locales (une seule fois, depuis votre PC)
1. Copiez `.env.example` en `.env` et renseignez `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`.
2. Vérifiez : `npm run migrate -- ./data --dry` (affiche ce qui sera migré, n'envoie rien).
3. Migrez : `npm run migrate -- ./data`. Produits, réglages (dont votre mot de passe admin actuel), demandes et photos passent dans Supabase. Le script refuse de s'exécuter si les tables ne sont pas vides.
   *Pas de données locales à reprendre ?* Sautez cette étape : au premier démarrage le site crée l'admin (`ADMIN_USER` / `ADMIN_PASSWORD`, 10 caractères min.) et le catalogue de départ.

## 3. Mettre le code sur GitHub
Remplacez les fichiers de votre dépôt par ceux de ce projet (le `.env` et `data/` ne doivent **pas** être envoyés : `.gitignore` s'en charge), puis `git add . && git commit -m "Supabase" && git push`. Si votre `.env` contenait un vrai mot de passe, changez-le depuis l'admin une fois en ligne.

## 4. Héberger le serveur sur Render
1. render.com → New → **Web Service** → votre dépôt GitHub (ou *Blueprint*, qui lit `render.yaml`).
2. Runtime Node, Build command : `echo ok`, Start command : `node server.js`, Health check : `/healthz`.
3. **Environment** : `NODE_ENV=production`, `TRUST_PROXY=1`, `SITE_URL=https://votre-adresse`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET` (texte aléatoire de 32+ caractères).
4. Déployez, puis ouvrez l'adresse fournie et `/admin`.
5. Domaine personnalisé : Render → Settings → Custom Domains, puis créez l'enregistrement DNS indiqué chez votre registrar. Mettez ensuite `SITE_URL` à jour (sitemap, balises).

## 5. À savoir avant de compter dessus
- **Supabase gratuit** : projet mis en **pause après 7 jours d'inactivité**, et **aucune sauvegarde automatique** (sauvegardes quotidiennes sur l'offre Pro, environ 25 $/mois, à vérifier sur supabase.com/pricing). Pour un site professionnel, prévoyez Pro, ou au minimum une sauvegarde hebdomadaire (`npm run backup`) et des visites régulières.
- **Render gratuit** : le serveur s'endort après un temps d'inactivité et le premier visiteur attend le réveil (plusieurs secondes). Une offre payante supprime ce délai (à vérifier chez l'hébergeur).
- Les données clients des demandes sont stockées dans Supabase : complétez la page « Mentions légales et confidentialité » (hébergeur, durée de conservation).

## Restaurer
Les tables sont recréées avec `schema.sql`, puis réimportez le JSON de `npm run backup` (SQL Editor ou script). Contactez-moi pour un script de restauration si besoin.
