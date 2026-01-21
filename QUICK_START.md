# 🚀 Guide de Démarrage Rapide - Ooryxx Backend

## Installation et Premier Lancement

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js** (v16+) : [Download Node.js](https://nodejs.org/)
- **MongoDB** (v5+) : [Download MongoDB](https://www.mongodb.com/try/download/community)
- **Git** (optionnel) : [Download Git](https://git-scm.com/)

### 2. Installation

```bash
# 1. Naviguer vers le dossier backend
cd ooryxx-backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env
```

### 3. Configuration Minimale

Éditez le fichier `.env` :

```env
# Configuration minimale pour démarrer
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ooryxx
JWT_SECRET=change_this_to_a_very_secret_key_12345
JWT_REFRESH_SECRET=change_this_to_another_secret_key_67890
FRONTEND_URL=http://localhost:3000
```

Les autres variables (Email, SMS, Paiements) peuvent être ajoutées plus tard.

### 4. Démarrer MongoDB

**Windows :**
```bash
# Si installé comme service
net start MongoDB

# Sinon
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Mac/Linux :**
```bash
# Homebrew
brew services start mongodb-community

# Ou manuel
mongod --dbpath /usr/local/var/mongodb
```

### 5. Lancer le Serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

Vous devriez voir :
```
➡️  Serveur démarré sur le port 5000
➡️  Environnement: development
MongoDB connecté: localhost
```

### 6. Tester l'API

**Test de santé :**
```bash
curl http://localhost:5000/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "timestamp": "2025-11-07T..."
}
```

## 🎯 Créer vos Premiers Endpoints

### Étape 1 : Créer un Controller

Créez `src/controllers/authController.js` :

```javascript
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { sendWelcomeEmail } = require('../services/emailService');

/**
 * Inscription utilisateur
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer l'utilisateur
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'client'
    });
    
    await user.save();
    
    // Générer les tokens
    const accessToken = generateAccessToken({ 
      userId: user._id, 
      role: user.role 
    });
    const refreshToken = generateRefreshToken({ 
      userId: user._id 
    });
    
    // Sauvegarder le refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Envoyer l'email de bienvenue (si configuré)
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.log('Email non envoyé:', emailError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        level: user.level
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message 
    });
  }
};

/**
 * Connexion utilisateur
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur (inclure le password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Vérifier si le compte est bloqué
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Votre compte a été bloqué. Contactez l\'administrateur.' 
      });
    }
    
    // Vérifier le verrouillage temporaire
    if (user.isLocked()) {
      return res.status(403).json({ 
        success: false,
        message: 'Compte temporairement verrouillé. Réessayez plus tard.' 
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      await user.incLoginAttempts();
      
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();
    
    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    
    // Générer les tokens
    const accessToken = generateAccessToken({ 
      userId: user._id, 
      role: user.role 
    });
    const refreshToken = generateRefreshToken({ 
      userId: user._id 
    });
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        level: user.level
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
};

/**
 * Obtenir l'utilisateur connecté
 */
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

/**
 * Rafraîchir le token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Refresh token manquant' 
      });
    }
    
    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Refresh token invalide' 
      });
    }
    
    const newAccessToken = generateAccessToken({ 
      userId: user._id, 
      role: user.role 
    });
    
    res.json({
      success: true,
      accessToken: newAccessToken
    });
    
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Refresh token invalide ou expiré',
      error: error.message 
    });
  }
};
```

### Étape 2 : Créer les Routes

Créez `src/routes/auth.js` :

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiting');

// Routes publiques
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Routes protégées
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
```

### Étape 3 : Tester avec Postman/cURL

**1. Inscription :**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678"
  }'
```

**2. Connexion :**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**3. Obtenir profil (avec token) :**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

## 📊 Vérifier la Base de Données

```bash
# Ouvrir MongoDB shell
mongosh

# Sélectionner la base
use ooryxx

# Voir les utilisateurs
db.users.find().pretty()

# Compter les utilisateurs
db.users.countDocuments()
```

## 🔧 Problèmes Courants

### MongoDB ne se connecte pas
```bash
# Vérifier le statut
systemctl status mongod  # Linux
brew services list  # Mac

# Vérifier le port
netstat -an | grep 27017
```

### Erreur JWT
Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont bien définis dans `.env`

### Module non trouvé
```bash
npm install
```

## 📚 Ressources

- **Documentation complète** : Voir `README.md`
- **Résumé implémentation** : Voir `IMPLEMENTATION_SUMMARY.md`
- **Postman Collection** : À créer (exporter vos tests)

## 🎉 Félicitations !

Vous avez maintenant un backend API fonctionnel ! 

**Prochaines étapes :**
1. Créer les autres controllers (products, orders, etc.)
2. Implémenter l'upload d'images
3. Ajouter les paiements
4. Tester avec le frontend

---

**Besoin d'aide ?** Consultez `IMPLEMENTATION_SUMMARY.md` pour voir ce qui reste à implémenter.
