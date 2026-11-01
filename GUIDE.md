# Guide de la responsable — Le Comptoir des Belles Saveurs

## Démarrage du site

```bash
npm start
```

Le site est accessible sur : **http://localhost:3000**  
L'administration est accessible sur : **http://localhost:3000/admin**

> En ligne, le site démarre tout seul : voir `DEPLOIEMENT.md`. Les données sont dans Supabase (base en ligne).

---

## Gestion des produits

1. Aller sur `/admin` → onglet **Produits**.
2. Remplir le formulaire : catégorie, nom, description, garniture (si confirmée), prix en FCFA, unité, quantité minimale, délai de précommande → **Enregistrer**.
3. **Photo** : choisir un fichier PNG/JPEG/WebP, elle est réduite automatiquement.
4. **Prix vide** = le site affiche « Prix à confirmer ».
5. Décocher **Publié** pour masquer un produit sans le supprimer.
6. Pour modifier un prix : cliquer **Modifier**, changer le prix, **Enregistrer** — le site est à jour immédiatement.

---

## Gestion des demandes

Onglet **Demandes** : chaque demande reçue via le formulaire apparaît en statut « Demande reçue ».

Procédure :
1. Contacter le client (WhatsApp / téléphone).
2. Confirmer disponibilité, prix final, délai, modalités de paiement et de réception.
3. Passer le statut à **Commande confirmée** — ou **Refusée / annulée** si nécessaire.

Le client ne reçoit jamais de confirmation automatique : c'est toujours la responsable qui confirme.

---

## Réglages du site

Onglet **Réglages** — sections disponibles :

| Rubrique | Contenu |
|---|---|
| Images | Logo de l'entreprise, photo principale de l'accueil |
| Coordonnées | WhatsApp (`221XXXXXXXXX`), téléphone, e-mail, ville, retrait, horaires |
| Commandes | Paiement, livraison, frais, conditions d'annulation |
| Réseaux sociaux | Liens Facebook, Instagram, TikTok |
| À propos | Présentation, histoire, activité, valeurs, démarche, engagement |
| Mentions légales | Nom, responsable, adresse, NINEA/RCCM, hébergeur, conservation |

Tout champ vide est affiché comme « à compléter » sur le site public — jamais inventé.

---

## Sauvegardes

- **Depuis l'admin** : onglet Réglages → **Télécharger une sauvegarde** (produits, demandes et réglages en JSON).
- **Depuis votre ordinateur** : `npm run backup` crée un fichier JSON daté dans `sauvegardes/` (nécessite le fichier `.env`). Gardez-le privé : il contient des données clients.
- **Important** : l'offre gratuite de Supabase n'inclut pas de sauvegarde automatique et met le projet en pause après 7 jours d'inactivité (voir `DEPLOIEMENT.md`). Faites une sauvegarde chaque semaine.
- **Photos** : stockées dans Supabase Storage (bucket `uploads`), elles ne se perdent pas lors d'une mise à jour du site.

---

## Mise en ligne

Voir **`DEPLOIEMENT.md`** (Supabase + Render, pas à pas).
