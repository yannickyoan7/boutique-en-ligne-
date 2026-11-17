# SAMIRA — Boutique cosmétique (prototype)

## Lancer le site
- Décompressez le ZIP.
- Ouvrez `index.html` dans un navigateur, ou déployez le dossier sur Vercel.

## Contenu
- `index.html` : structure de la boutique.
- `styles.css` : design responsive.
- `app.js` : catalogue de démonstration, filtres, panier et formulaire de commande.
- `vercel.json` : configuration de déploiement statique.

## Important : état actuel
Cette version est un prototype front-end. Le panier et les commandes de démonstration sont stockés dans le navigateur (`localStorage`) et ne sont pas partagés entre appareils. Aucune transaction réelle n'est déclenchée. Le formulaire ne collecte pas de paiement.

Avant toute mise en production, il faut :
1. Remplacer les produits, prix et photos de démonstration par les données réelles.
2. Ajouter une base de données et un backend sécurisé pour les clients, stocks et commandes.
3. Créer un compte marchand chez un prestataire compatible Gabon et obtenir ses clés API.
4. Implémenter le paiement côté serveur, avec vérification serveur-à-serveur/webhook du statut de transaction. Ne jamais se fier à une simple redirection du navigateur.
5. Définir les frais, délais et pays desservis pour les livraisons internationales.
6. Ajouter les pages légales : conditions de vente, confidentialité, retours/remboursements et politique de livraison.

## Déploiement Vercel
Importer ce dossier comme projet sur Vercel. Aucun build command n'est nécessaire pour ce prototype statique.
