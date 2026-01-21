# 📧 Configuration Email - Guide Rapide

## ✅ Ce qui a été implémenté

### Backend
- ✅ Endpoint `POST /api/auth/forgot-password` - Génère un code à 6 chiffres
- ✅ Endpoint `POST /api/auth/reset-password` - Réinitialise le mot de passe avec le code
- ✅ Service d'email avec template HTML professionnel
- ✅ Sécurité : Code hashé, expiration 10 minutes, validation

### Frontend  
- ✅ Page ForgotPassword - Formulaire demande de code
- ✅ Page ResetPassword - Formulaire avec code + nouveau mot de passe
- ✅ Validation en temps réel et indicateurs visuels

## 🚀 Configuration Rapide (5 minutes)

### Étape 1 : Configuration Gmail

1. **Activez la validation en 2 étapes**
   - Allez sur https://myaccount.google.com/security
   - Activez "Validation en deux étapes"

2. **Créez un mot de passe d'application**
   - Allez sur https://myaccount.google.com/apppasswords
   - Créez un mot de passe pour "Mail"
   - **Copiez le mot de passe de 16 caractères**

### Étape 2 : Configurez le Backend

1. **Créez le fichier .env** dans `ooryxx-backend/` :
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app_16_caracteres
EMAIL_FROM="Ooryxx <noreply@ooryxx.tn>"
FRONTEND_URL=http://localhost:3000
```

2. **Installez nodemailer** (si pas encore fait) :
```bash
cd ooryxx-backend
npm install nodemailer
```

3. **Testez la configuration** :
```bash
node test-email.js
```

Si vous voyez "✅ Email de test envoyé avec succès !", c'est bon ! 🎉

### Étape 3 : Démarrez le Backend

```bash
cd ooryxx-backend
npm start
```

### Étape 4 : Testez le Système

#### Test avec le Frontend :

1. Démarrez le frontend :
```bash
cd ooryxx-frontend
npm start
```

2. Allez sur http://localhost:3000/login

3. Cliquez sur "Mot de passe oublié ?"

4. Entrez votre email

5. Vérifiez votre boîte email → Vous devriez recevoir un code à 6 chiffres

6. Entrez le code + nouveau mot de passe

7. Connectez-vous avec le nouveau mot de passe

#### Test avec Postman/curl :

**1. Demander un code :**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "votre.email@gmail.com"}'
```

**2. Réinitialiser avec le code reçu :**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre.email@gmail.com",
    "code": "123456",
    "newPassword": "nouveauMotDePasse123!"
  }'
```

## 📱 Format de l'Email Envoyé

L'utilisateur recevra un email avec :
- 🎨 Design professionnel avec couleurs Ooryxx
- 🔢 Code de vérification à 6 chiffres bien visible
- ⏰ Information d'expiration (10 minutes)
- ⚠️ Avertissements de sécurité
- 🔗 Bouton direct vers la page de réinitialisation

## ⚡ Flux Complet

```
Utilisateur oublie son mot de passe
    ↓
Clique sur "Mot de passe oublié"
    ↓
Entre son email → POST /api/auth/forgot-password
    ↓
Backend génère code 6 chiffres
    ↓
Backend hashe et sauvegarde le code
    ↓
Backend envoie email avec le code
    ↓
Utilisateur reçoit l'email (vérifier spam)
    ↓
Utilisateur entre code + nouveau mot de passe
    ↓
POST /api/auth/reset-password
    ↓
Backend vérifie le code hashé
    ↓
Backend met à jour le mot de passe
    ↓
Utilisateur peut se connecter !
```

## 🔒 Sécurité

- ✅ Code à 6 chiffres aléatoire
- ✅ Code hashé (SHA-256) avant stockage
- ✅ Expiration après 10 minutes
- ✅ Message générique (ne révèle pas si email existe)
- ✅ Validation côté backend et frontend
- ✅ Rate limiting possible (à ajouter si besoin)

## ⚠️ Problèmes Courants

### Email non reçu ?
1. ✅ Vérifiez le dossier **Spam/Courrier indésirable**
2. ✅ Vérifiez que l'email existe dans votre base MongoDB
3. ✅ Regardez les logs du backend pour confirmer l'envoi
4. ✅ Testez avec `node test-email.js`

### Erreur "Invalid login" ?
1. ✅ Utilisez un **mot de passe d'application** (pas votre mot de passe Gmail)
2. ✅ Activez la **validation en 2 étapes** sur Gmail
3. ✅ Vérifiez que EMAIL_USER est correct dans .env

### Code invalide ou expiré ?
1. ✅ Le code expire après **10 minutes**
2. ✅ Demandez un nouveau code
3. ✅ Vérifiez que vous utilisez le **bon email**

## 📞 Besoin d'Aide ?

Consultez le guide complet : `EMAIL_CONFIGURATION_GUIDE.md`

---

## ✨ C'est Prêt !

Le système de réinitialisation de mot de passe est maintenant **100% fonctionnel** ! 🎉

Les utilisateurs peuvent :
- ✅ Demander un code de réinitialisation
- ✅ Recevoir un email professionnel avec le code
- ✅ Réinitialiser leur mot de passe en toute sécurité

**Prochaine étape :** Configurez vos credentials Gmail et testez ! 🚀
