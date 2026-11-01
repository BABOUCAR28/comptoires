# Résultats des tests réellement exécutés (version Supabase)

## 1. Tests automatiques (`npm test`)
Ils tournent contre un **faux Supabase local** (`tests/mock-supabase.js`) qui imite l'API REST et le stockage. Ils valident la logique du site, **pas** la connexion à un vrai projet Supabase.
```
OK   page /
OK   page /sucres
OK   page /sales
OK   page /fatayas
OK   page /evenements
OK   page /apropos
OK   page /contact
OK   page /legal
OK   page /admin
OK   page inconnue = 404
OK   traversal bloqué
OK   sitemap
OK   robots
OK   catalogue public (23 produits)
OK   commande valide
OK   téléphone invalide refusé
OK   date passée refusée
OK   produit inconnu refusé
OK   sans produit refusé
OK   devis sans type refusé
OK   admin sans session = 401
OK   mauvais mot de passe = 401
OK   connexion + cookie HttpOnly
OK   demande visible en admin (statut reçue)
OK   modif prix produit
OK   prix visible côté public
OK   masquer un produit
OK   statut confirmée
OK   statut invalide refusé
OK   upload image (stocké dans Storage)
OK   upload non image refusé
OK   SEO : titre propre à la page
OK   SEO : canonical + description
OK   notification envoyée
OK   garniture enregistrée et publique
OK   quantité minimale imposée
OK   réglages valides enregistrés
OK   livraison activée + frais publics
OK   WhatsApp invalide refusé
OK   lien javascript: refusé
OK   logo externe refusé
OK   logo téléversé accepté
OK   sauvegarde JSON (sans mot de passe)
OK   sauvegarde refusée sans session
OK   suppression produit
OK   cookie falsifié refusé
OK   changement de mot de passe
OK   ancienne session invalidée
OK   nouvelle session valide
OK   nouveau mot de passe accepté
OK   mot de passe jamais exposé
OK   clé Supabase absente des pages et réponses
OK   données persistées dans Supabase (produits, demandes)
OK   limitation anti-abus (429)
OK   en-têtes de sécurité

55 réussis, 0 échecs
```

## 1 bis. Adaptateur Vercel (`node tests/vercel.js`)
5 tests réussis : pages, catalogue, commande avec `req.body` déjà analysé (comportement attendu des fonctions Vercel), connexion admin. Simulé en local : **le déploiement Vercel réel n'a pas été testé**.

## 2. Migration de vos données (faux Supabase)
`scripts/migrate-from-sqlite.js` exécuté sur votre `site.db` réel : 21 produits, 11 réglages (mot de passe admin conservé), 10 photos transférées, aucune ancienne adresse `/uploads` restante ; 2e exécution refusée (tables non vides).

## 3. Navigateur réel (Chromium), site servi avec ces données
Mobile 375 px et ordinateur 1280 px, 10 pages (accueil, 4 catalogues, événements, contact, à propos, légal, admin) : aucun débordement horizontal, photos chargées depuis l'adresse de stockage, aucune erreur JavaScript.

## Non testé
Connexion à un vrai projet Supabase (clés, bucket, RLS, `fix_sequences`), Render/Docker/domaine, téléphones réels, envoi réel vers WhatsApp, performances (Lighthouse), compression d'image de l'admin.
