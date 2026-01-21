# Configuration MongoDB Atlas

## ✅ Configuration Appliquée

La connexion MongoDB Atlas a été configurée avec succès !

### 📝 Informations de Connexion

- **Cluster**: ooryxxdb.bf7e27f.mongodb.net
- **Database**: ooryxx
- **User**: ooryxx_db
- **Password**: 5qYCF7KHBlxAM97y

## 🔧 Créer le Fichier .env

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Environnement
NODE_ENV=development
PORT=5000

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://ooryxx_db:5qYCF7KHBlxAM97y@ooryxxdb.bf7e27f.mongodb.net/ooryxx?retryWrites=true&w=majority&appName=ooryxxdb

# JWT
JWT_SECRET=ooryxx_super_secret_key_2025_change_in_production
JWT_REFRESH_SECRET=ooryxx_refresh_secret_key_2025_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (Optionnel pour l'instant)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@ooryxx.com

# SMS Twilio (Optionnel)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Stripe (Optionnel)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal (Optionnel)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Commandes à Exécuter

### Méthode 1: Copier depuis PowerShell

```powershell
# Dans le dossier ooryxx-backend
@"
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://ooryxx_db:5qYCF7KHBlxAM97y@ooryxxdb.bf7e27f.mongodb.net/ooryxx?retryWrites=true&w=majority&appName=ooryxxdb
JWT_SECRET=ooryxx_super_secret_key_2025_change_in_production
JWT_REFRESH_SECRET=ooryxx_refresh_secret_key_2025_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=noreply@ooryxx.com
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@ | Out-File -FilePath .env -Encoding utf8
```

### Méthode 2: Créer Manuellement

1. Créez un fichier nommé `.env` (sans extension)
2. Copiez-collez le contenu ci-dessus
3. Sauvegardez

## 🧪 Tester la Connexion

```bash
# Démarrer le serveur
npm run dev
```

Vous devriez voir :
```
➡️  Serveur démarré sur le port 5000
➡️  Environnement: development
MongoDB connecté: ooryxxdb.bf7e27f.mongodb.net
```

## ✅ Vérifications MongoDB Atlas

### 1. Autoriser l'Adresse IP

Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com/):
1. Allez dans **Network Access**
2. Cliquez sur **Add IP Address**
3. Choisissez **Allow Access from Anywhere** (0.0.0.0/0) pour le développement
4. Ou ajoutez votre IP spécifique

### 2. Vérifier l'Utilisateur

1. Allez dans **Database Access**
2. Vérifiez que l'utilisateur `ooryxx_db` existe
3. Vérifiez qu'il a les permissions `readWrite` sur la base `ooryxx`

## 📊 Structure de la Base de Données

Une fois connecté, les collections suivantes seront créées automatiquement :

- `users` - Utilisateurs
- `vendors` - Vendeurs
- `products` - Produits
- `orders` - Commandes
- `carts` - Paniers
- `reviews` - Avis
- `payments` - Paiements
- `coupons` - Coupons

## 🔒 Sécurité

**Important** : 
- Le fichier `.env` est déjà dans `.gitignore`
- Ne **jamais** commit les credentials de production
- Changez les secrets JWT en production
- Utilisez des variables d'environnement sur le serveur de production

## 🆘 En Cas de Problème

### Erreur: "MongoServerError: bad auth"
➡️ Vérifiez username/password dans MongoDB Atlas

### Erreur: "Connection timeout"
➡️ Ajoutez votre IP dans Network Access

### Erreur: "Database not found"
➡️ Normal, la base sera créée au premier insert

---

**Configuration MongoDB Atlas terminée !** 🎉
