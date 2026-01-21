# Configuration Email pour Réinitialisation de Mot de Passe

## 🎯 Objectif
Ce guide vous aide à configurer l'envoi d'emails pour la réinitialisation de mot de passe avec Gmail.

## 📧 Configuration Gmail

### Option 1 : Utiliser un Mot de Passe d'Application Gmail (Recommandé)

1. **Activer la validation en 2 étapes sur votre compte Google**
   - Allez sur https://myaccount.google.com/security
   - Cliquez sur "Validation en deux étapes"
   - Suivez les instructions pour l'activer

2. **Créer un mot de passe d'application**
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Mail" comme application
   - Sélectionnez "Autre" comme appareil et entrez "Ooryxx Backend"
   - Cliquez sur "Générer"
   - **Copiez le mot de passe généré** (16 caractères)

3. **Configurer le fichier .env**
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=votre.email@gmail.com
   EMAIL_PASSWORD=votre_mot_de_passe_application_16_caracteres
   EMAIL_FROM="Ooryxx <noreply@ooryxx.tn>"
   ```

### Option 2 : Utiliser un Service d'Email Tiers (Production)

Pour la production, il est recommandé d'utiliser un service comme SendGrid, Mailgun, ou Amazon SES.

#### SendGrid (Gratuit jusqu'à 100 emails/jour)

1. **Créer un compte sur SendGrid**
   - Allez sur https://sendgrid.com/
   - Créez un compte gratuit

2. **Obtenir une clé API**
   - Dans le tableau de bord, allez dans Settings > API Keys
   - Créez une nouvelle clé API avec accès "Mail Send"
   - **Copiez la clé API**

3. **Configurer le fichier .env**
   ```env
   # SendGrid Configuration
   SENDGRID_API_KEY=votre_cle_api_sendgrid
   EMAIL_FROM="Ooryxx <noreply@ooryxx.tn>"
   ```

4. **Modifier emailService.js pour utiliser SendGrid**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   ```

## 🔧 Configuration du Backend

### 1. Créer/Mettre à jour le fichier .env

Créez un fichier `.env` à la racine du dossier `ooryxx-backend` :

```env
# Environnement
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ooryxx

# JWT
JWT_SECRET=votre_jwt_secret_tres_securise
JWT_REFRESH_SECRET=votre_refresh_secret_tres_securise
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email Configuration (Choisir une option)
# Option Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application
EMAIL_FROM="Ooryxx <noreply@ooryxx.tn>"

# OU Option SendGrid
# SENDGRID_API_KEY=votre_cle_sendgrid
# EMAIL_FROM="Ooryxx <noreply@ooryxx.tn>"

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Installer les dépendances nécessaires

```bash
cd ooryxx-backend
npm install nodemailer dotenv
```

Si vous utilisez SendGrid :
```bash
npm install @sendgrid/mail
```

### 3. Vérifier la configuration

Créez un fichier de test `test-email.js` :

```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'votre-email-test@example.com',
  subject: 'Test Email - Ooryxx',
  html: '<h1>Email de test réussi !</h1><p>La configuration email fonctionne correctement.</p>'
}, (error, info) => {
  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log('Email envoyé:', info.response);
  }
});
```

Exécutez :
```bash
node test-email.js
```

## 🚀 Test du Système de Réinitialisation

### 1. Démarrer le backend
```bash
cd ooryxx-backend
npm start
```

### 2. Tester avec Postman ou curl

**Demande de réinitialisation :**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Réinitialisation avec code :**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "nouveauMotDePasse123!"
  }'
```

## 📋 Checklist de Configuration

- [ ] Compte Gmail créé ou service d'email configuré
- [ ] Validation en 2 étapes activée (pour Gmail)
- [ ] Mot de passe d'application généré (pour Gmail)
- [ ] Fichier .env créé avec les bonnes valeurs
- [ ] Variables EMAIL_USER et EMAIL_PASSWORD définies
- [ ] nodemailer installé (`npm install nodemailer`)
- [ ] Backend démarré sans erreur
- [ ] Test d'envoi d'email réussi
- [ ] Test de forgot-password réussi
- [ ] Email reçu avec code à 6 chiffres
- [ ] Test de reset-password réussi

## ⚠️ Résolution des Problèmes

### Erreur : "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution :** Vérifiez que :
1. La validation en 2 étapes est activée
2. Vous utilisez un mot de passe d'application (pas votre mot de passe Gmail)
3. L'email dans EMAIL_USER est correct

### Erreur : "Connection timeout"

**Solution :**
1. Vérifiez votre connexion Internet
2. Vérifiez que le port 587 n'est pas bloqué par votre firewall
3. Essayez avec le port 465 et `secure: true`

### Email non reçu

**Solution :**
1. Vérifiez le dossier Spam/Courrier indésirable
2. Vérifiez les logs du backend pour voir si l'email a été envoyé
3. Utilisez un email de test différent
4. Vérifiez que l'email existe dans la base de données

### Code invalide ou expiré

**Solution :**
1. Le code expire après 10 minutes - demandez un nouveau code
2. Vérifiez que vous utilisez le bon email
3. Le code est sensible à la casse (uniquement des chiffres)

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter le fichier .env**
   - Ajoutez `.env` dans `.gitignore`

2. **Utiliser des mots de passe d'application**
   - Ne pas utiliser votre mot de passe Gmail principal

3. **Limiter les tentatives**
   - Le code expire après 10 minutes
   - Implémenter un rate limiting sur l'endpoint forgot-password

4. **Hasher le code**
   - Le code est hashé avant d'être stocké en base de données

5. **Messages génériques**
   - Ne pas révéler si un email existe ou non

## 📞 Support

En cas de problème :
- Vérifiez les logs du backend : `npm run dev`
- Consultez la documentation Nodemailer : https://nodemailer.com/
- Contactez le support technique

---

**Dernière mise à jour :** 18 novembre 2025
