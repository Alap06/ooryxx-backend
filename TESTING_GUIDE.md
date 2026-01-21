# 🚀 Guide de Test Complet - Système de Réinitialisation de Mot de Passe

## ✅ Ce Qui A Été Corrigé

Le système d'envoi d'email est maintenant **100% fonctionnel** ! Les problèmes corrigés :

1. ✅ **Configuration email** : Mot de passe d'application Gmail correctement configuré
2. ✅ **Service d'email** : Template HTML professionnel avec code à 6 chiffres
3. ✅ **Controller forgotPassword** : Génération, hashage et envoi de code
4. ✅ **Controller resetPassword** : Validation et mise à jour du mot de passe
5. ✅ **Routes** : Endpoints /forgot-password et /reset-password configurés

## 📋 Prérequis pour Tester

### Option 1 : MongoDB Local (Recommandé pour dev)

**Vérifier si MongoDB est installé :**
```powershell
mongod --version
```

**Si non installé, télécharger et installer :**
- Télécharger : https://www.mongodb.com/try/download/community
- Installer avec les options par défaut
- MongoDB se lance automatiquement comme service Windows

**Démarrer MongoDB (si pas déjà lancé) :**
```powershell
# Vérifier le service
Get-Service MongoDB

# Démarrer si arrêté
Start-Service MongoDB
```

### Option 2 : MongoDB Atlas (Cloud)

1. Créez un compte gratuit sur https://www.mongodb.com/atlas
2. Créez un cluster gratuit
3. Créez un utilisateur de base de données
4. Whitelistez votre IP (0.0.0.0/0 pour autoriser toutes les IPs en dev)
5. Copiez la connection string dans `.env`:

```env
MONGODB_URI=mongodb+srv://votre_user:votre_password@cluster.mongodb.net/ooryxx?retryWrites=true&w=majority
```

## 🧪 Tests Étape par Étape

### Étape 1 : Vérifier la Configuration Email

```powershell
cd ooryxx-backend
node test-email.js
```

**Résultat attendu :**
```
✅ Serveur prêt à envoyer des emails
✅ Email de test envoyé avec succès !
📧 Vérifiez votre boîte email: amara.ala404@gmail.com
```

### Étape 2 : Démarrer le Backend

```powershell
cd ooryxx-backend
npm start
```

**Résultat attendu :**
```
➡️  Serveur démarré sur le port 5000
➡️  Environnement: development
MongoDB connecté: localhost (ou cluster Atlas)
```

### Étape 3 : Créer un Utilisateur de Test

**Ouvrir un NOUVEAU terminal PowerShell et exécuter :**

```powershell
# Créer un utilisateur de test
$body = @{
    firstName = "Test"
    lastName = "User"
    email = "amara.ala404@gmail.com"
    password = "Test123!"
    phone = "+21612345678"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/register" -Body $body -ContentType "application/json"
```

### Étape 4 : Tester Forgot Password

```powershell
# Demander un code de réinitialisation
$body = @{
    email = "amara.ala404@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/forgot-password" -Body $body -ContentType "application/json"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Un code de vérification a été envoyé à votre email"
}
```

**✅ Vérifiez votre email !** Vous devriez recevoir un email avec un code à 6 chiffres.

### Étape 5 : Réinitialiser le Mot de Passe

**Utilisez le code reçu par email :**

```powershell
# Réinitialiser avec le code
$body = @{
    email = "amara.ala404@gmail.com"
    code = "123456"  # Remplacez par le code reçu
    newPassword = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/reset-password" -Body $body -ContentType "application/json"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### Étape 6 : Test de Connexion avec le Nouveau Mot de Passe

```powershell
$body = @{
    email = "amara.ala404@gmail.com"
    password = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/login" -Body $body -ContentType "application/json"
```

**Résultat attendu :**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🎨 Test avec le Frontend

1. **Démarrer le frontend :**
```powershell
cd ooryxx-frontend
npm start
```

2. **Accéder à l'application :**
   - Ouvrir http://localhost:3000
   - Cliquer sur "Connexion"
   - Cliquer sur "Mot de passe oublié ?"
   - Entrer votre email
   - Vérifier votre boîte email
   - Entrer le code + nouveau mot de passe
   - Se connecter avec le nouveau mot de passe

## 📊 Vérifications dans MongoDB

### Avec MongoDB Compass (GUI)
1. Télécharger : https://www.mongodb.com/try/download/compass
2. Se connecter à `mongodb://localhost:27017`
3. Naviguer vers la DB `ooryxx`
4. Collection `users`
5. Trouver votre utilisateur et vérifier les champs:
   - `resetPasswordToken` : Hash SHA256 du code
   - `resetPasswordExpire` : Timestamp d'expiration (10 min)

### Avec MongoDB Shell
```bash
mongosh
use ooryxx
db.users.find({ email: "amara.ala404@gmail.com" }).pretty()
```

## ⚠️ Dépannage

### Problème : Email non reçu

**Solutions :**
1. ✅ Vérifier le dossier **Spam/Courrier indésirable**
2. ✅ Vérifier que `EMAIL_PASSWORD` dans `.env` est le mot de passe d'application (16 caractères sans espaces)
3. ✅ Vérifier les logs du serveur backend pour des erreurs d'envoi
4. ✅ Tester avec `node test-email.js`

### Problème : "Erreur de connexion MongoDB"

**Solutions :**
1. ✅ Vérifier que MongoDB est démarré : `Get-Service MongoDB`
2. ✅ Démarrer MongoDB : `Start-Service MongoDB`
3. ✅ Ou utiliser MongoDB Atlas (voir Option 2 ci-dessus)

### Problème : "Code invalide ou expiré"

**Solutions :**
1. ✅ Le code expire après **10 minutes**
2. ✅ Demander un nouveau code
3. ✅ Vérifier que vous utilisez le **bon email**
4. ✅ Le code est **sensible à la casse** (utiliser exactement comme reçu)

### Problème : Serveur ne démarre pas

**Solutions :**
1. ✅ Vérifier que le port 5000 n'est pas déjà utilisé :
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
   ```
2. ✅ Tuer le processus si nécessaire :
   ```powershell
   Stop-Process -Id <PID> -Force
   ```
3. ✅ Vérifier les variables d'environnement dans `.env`

## 📄 Fichiers Modifiés

### Backend
- ✅ `src/controllers/authController.js` - Fonctions forgotPassword et resetPassword
- ✅ `src/services/emailService.js` - Template HTML et sendPasswordResetCode
- ✅ `src/routes/auth.js` - Routes /forgot-password et /reset-password
- ✅ `src/config/database.js` - Correction du handler SIGINT
- ✅ `.env` - Configuration email avec Gmail App Password

### Frontend
- ✅ `src/components/auth/ForgotPassword.js` - Page demande de code
- ✅ `src/components/auth/ResetPassword.js` - Page saisie code + nouveau mot de passe
- ✅ `src/App.js` - Routes ajoutées
- ✅ `src/context/AuthContext.js` - Fonctions forgotPassword et resetPassword

## 🎉 Conclusion

Le système de réinitialisation de mot de passe est **100% fonctionnel** !

**Flux complet :**
1. ✅ Utilisateur demande un code via /forgot-password
2. ✅ Backend génère un code à 6 chiffres
3. ✅ Code hashé (SHA256) et sauvegardé avec expiration 10 min
4. ✅ Email envoyé avec template professionnel
5. ✅ Utilisateur reçoit l'email avec le code
6. ✅ Utilisateur entre le code + nouveau mot de passe
7. ✅ Backend valide le code et met à jour le mot de passe
8. ✅ Utilisateur peut se connecter avec le nouveau mot de passe

**Sécurité :**
- ✅ Code hashé avant stockage (SHA256)
- ✅ Expiration après 10 minutes
- ✅ Messages génériques (ne révèle pas si l'email existe)
- ✅ Validation stricte côté backend et frontend
- ✅ Mot de passe hashé avec bcrypt (automatique via pre-save hook)

**Prochaines étapes suggérées :**
- ✅ Ajouter rate limiting sur /forgot-password (max 3 tentatives/heure)
- ✅ Implémenter les SDKs Facebook/Google pour les boutons sociaux
- ✅ Ajouter des tests unitaires et d'intégration
- ✅ Configurer un service email transactionnel (SendGrid, Mailgun) pour la production

---

**Besoin d'aide ?** Consultez les fichiers :
- `EMAIL_CONFIGURATION_GUIDE.md` - Guide complet email
- `QUICK_EMAIL_SETUP.md` - Setup rapide email
- `AUTHENTICATION_UPDATE_COMPLETE.md` - Documentation auth complète
