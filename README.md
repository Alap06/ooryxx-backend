# Ooryxx Backend - API E-commerce Multi-Vendeurs

Backend complet d'une plateforme e-commerce marketplace multi-vendeurs (type Cdiscount) développé avec la stack MERN.

## 🚀 Fonctionnalités Principales

### Authentification & Autorisation
- ✅ Inscription/Connexion avec JWT (Access & Refresh tokens)
- ✅ Hashage bcrypt des mots de passe
- ✅ Réinitialisation de mot de passe par email
- ✅ Verrouillage de compte après tentatives échouées
- ✅ Gestion des rôles (client, vendeur, admin)
- ✅ Niveaux utilisateur (normal, VIP)
- ✅ Connexion sociale (Google/Facebook) - structure prête

### Gestion Utilisateurs
- ✅ Profils utilisateurs complets avec adresses multiples
- ✅ Historique des commandes
- ✅ Liste de souhaits (wishlist)
- ✅ Panier d'achat persistant

### Gestion Vendeurs
- ✅ Inscription vendeur avec documents (SIRET, etc.)
- ✅ Système d'approbation admin
- ✅ Profil entreprise complet
- ✅ Statistiques de vente
- ✅ Gestion des commissions
- ✅ Politiques de retour et expédition

### Gestion Produits
- ✅ CRUD complet avec images
- ✅ Catégorisation et tags
- ✅ Gestion du stock
- ✅ Variantes de produits
- ✅ Système de notation
- ✅ Priorité pour référencement
- ✅ SEO (slug, meta, keywords)
- ✅ Réductions et promotions

### Gestion Commandes
- ✅ **Anonymat client-vendeur** (code client)
- ✅ **Code de livraison** pour livreur
- ✅ Multiples statuts de commande
- ✅ Historique des changements
- ✅ Tracking de livraison
- ✅ Système de retour/annulation

### Système de Paiement
- ✅ Stripe
- ✅ PayPal
- ✅ USDT (crypto)
- ✅ Poste Tunisienne
- ✅ Paiement à la livraison
- ✅ Système de remboursement

### Avis & Notation
- ✅ Système d'avis clients
- ✅ **Modération admin** (modification/suppression)
- ✅ Réponses vendeurs
- ✅ Vote "utile"
- ✅ Signalement d'avis

### Coupons & Promotions
- ✅ Codes promo (pourcentage/fixe)
- ✅ Conditions d'utilisation avancées
- ✅ Limite d'utilisation
- ✅ Validité temporelle

### Notifications
- ✅ Emails (Nodemailer/SendGrid)
  - Bienvenue
  - Confirmation de commande
  - Expédition
  - Réinitialisation mot de passe
  - Approbation vendeur
- ✅ SMS (Twilio)
  - Notifications de commande
  - Codes de vérification

### Recommandations
- ✅ Système de recommandations basé sur l'historique
- ✅ Adaptation selon niveau utilisateur (VIP)
- ✅ Produits similaires
- ✅ Fréquemment achetés ensemble

### Sécurité
- ✅ Helmet.js (headers HTTP sécurisés)
- ✅ CORS configuré
- ✅ Rate limiting (global + spécifique)
- ✅ Validation des données (express-validator)
- ✅ Protection NoSQL injection
- ✅ Compression gzip

## 📁 Structure du Projet

```
ooryxx-backend/
├── src/
│   ├── config/          # Configuration (DB, JWT, Stripe, AWS, etc.)
│   ├── models/          # Modèles Mongoose
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── Review.js
│   │   ├── Payment.js
│   │   └── Coupon.js
│   ├── controllers/     # Logique métier
│   ├── routes/          # Routes Express
│   ├── middleware/      # Middlewares (auth, validation, rate limiting)
│   ├── services/        # Services (email, SMS, paiements, recommandations)
│   └── utils/           # Utilitaires
├── server.js            # Point d'entrée
├── package.json
└── .env.example
```

## 🛠️ Installation

### Prérequis
- Node.js >= 16
- MongoDB >= 5.0
- npm ou yarn

### Étapes

1. **Cloner le projet**
```bash
cd ooryxx-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration environnement**
```bash
cp .env.example .env
```

Puis éditer `.env` avec vos credentials.

4. **Démarrer MongoDB**
```bash
# Si local
mongod
```

5. **Lancer le serveur**
```bash
# Production
npm start

# Développement (avec nodemon)
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## 🔧 Configuration (.env)

Créer un fichier `.env` à la racine avec :

```env
# Environnement
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ooryxx

# JWT
JWT_SECRET=votre_secret_jwt_complexe_ici
JWT_REFRESH_SECRET=votre_refresh_secret_jwt
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=votre_mot_de_passe
EMAIL_FROM=noreply@ooryxx.com

# Twilio SMS
TWILIO_ACCOUNT_SID=votre_twilio_sid
TWILIO_AUTH_TOKEN=votre_twilio_token
TWILIO_PHONE_NUMBER=+33XXXXXXXXX

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=votre_paypal_client_id
PAYPAL_CLIENT_SECRET=votre_paypal_secret
PAYPAL_MODE=sandbox

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📚 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/forgot-password` - Demande réinitialisation
- `POST /api/auth/reset-password/:token` - Réinitialiser mot de passe

### Users
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Modifier profil
- `GET /api/users/orders` - Commandes utilisateur
- `POST /api/users/addresses` - Ajouter adresse

### Products
- `GET /api/products` - Liste produits (filtres, pagination)
- `GET /api/products/:id` - Détails produit
- `POST /api/products` - Créer produit (vendeur)
- `PUT /api/products/:id` - Modifier produit (vendeur)
- `DELETE /api/products/:id` - Supprimer produit (vendeur)
- `GET /api/products/:id/similar` - Produits similaires
- `GET /api/products/:id/frequently-bought` - Achetés ensemble

### Orders
- `POST /api/orders` - Créer commande
- `GET /api/orders` - Liste commandes
- `GET /api/orders/:id` - Détails commande
- `PUT /api/orders/:id/status` - Changer statut (vendeur/admin)
- `GET /api/orders/:id/delivery/:code` - Info livraison (livreur)

### Cart
- `GET /api/cart` - Panier utilisateur
- `POST /api/cart/add` - Ajouter au panier
- `PUT /api/cart/update` - Mettre à jour quantité
- `DELETE /api/cart/remove/:productId` - Retirer du panier

### Vendors
- `POST /api/vendors/register` - Inscription vendeur
- `GET /api/vendors/profile` - Profil vendeur
- `PUT /api/vendors/profile` - Modifier profil
- `GET /api/vendors/orders` - Commandes vendeur
- `GET /api/vendors/stats` - Statistiques

### Admin
- `GET /api/admin/users` - Liste utilisateurs
- `PUT /api/admin/users/:id/block` - Bloquer utilisateur
- `GET /api/admin/vendors` - Liste vendeurs
- `PUT /api/admin/vendors/:id/approve` - Approuver vendeur
- `GET /api/admin/products` - Tous les produits
- `DELETE /api/admin/products/:id` - Supprimer produit
- `GET /api/admin/reviews` - Modérer avis
- `PUT /api/admin/reviews/:id/moderate` - Modérer un avis

### Payments
- `POST /api/payments/create` - Créer paiement
- `POST /api/payments/stripe/confirm` - Confirmer Stripe
- `POST /api/payments/paypal/execute` - Exécuter PayPal

### Recommendations
- `GET /api/recommendations` - Recommandations personnalisées

## 🔒 Authentification

Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <votre_token_jwt>
```

## 📊 Modèles de Données

### User
- Informations personnelles
- Adresses multiples
- Rôle (client/vendeur/admin)
- Niveau (normal/VIP)
- Sécurité (tentatives de connexion, verrouillage)

### Product
- Informations produit
- Images multiples
- Variantes
- Stock
- SEO
- Ratings

### Order
- Code client anonyme
- Code de livraison
- Items
- Statuts multiples
- Historique

### Vendor
- Informations entreprise
- Documents légaux
- Statistiques
- Politiques

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 📝 Notes Importantes

### Anonymat Client-Vendeur
Le vendeur ne voit que le **clientCode** dans les commandes, jamais les coordonnées réelles du client.

### Code de Livraison
Le livreur utilise le **deliveryCode** pour accéder aux informations de livraison via l'endpoint dédié.

### Modération des Avis
Les admins peuvent modifier ou supprimer les avis clients si nécessaire.

### Système de Recommandations
Basé sur :
- Historique d'achat
- Niveau utilisateur (VIP = produits premium)
- Catégories préférées

## 🚀 Déploiement

### Variables d'environnement
Configurer toutes les variables dans `.env` pour la production.

### Base de données
Utiliser MongoDB Atlas ou un serveur MongoDB dédié.

### Fichiers statiques
Configurer AWS S3 pour le stockage des images.

## 📞 Support

Pour toute question, contactez l'équipe de développement.

## 📄 Licence

ISC

---

**Développé avec ❤️ pour Ooryxx**
