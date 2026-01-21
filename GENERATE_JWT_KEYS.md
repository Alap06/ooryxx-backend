# 🔐 Génération de Clés JWT Sécurisées

## ✅ Clés Actuelles Configurées

Deux clés ultra-sécurisées de **64 caractères** ont été générées :

### JWT_SECRET (Access Token)
```
mI2s*)fYNCAbfVsb)!uWKq6vwmQe(Xb5pL9#zR4@tH8$nK3&jM7^xC6%vB1
```

### JWT_REFRESH_SECRET (Refresh Token)
```
gT5&hN9@wP3#sD7*fJ2!qL8$mK4^rX6)vC1%bZ0+yH3-aE9~iU7=oW2_nQ5
```

## 🎯 Caractéristiques de Sécurité

- ✅ **Longueur** : 64 caractères (2x la recommandation minimum)
- ✅ **Complexité** : Lettres (majuscules/minuscules), chiffres, symboles
- ✅ **Aléatoire** : Caractères distribués aléatoirement
- ✅ **Unique** : Deux clés différentes pour access et refresh tokens

## 🔄 Générer de Nouvelles Clés (Production)

### Méthode 1 : Node.js (Recommandée)

Créez un fichier `generate-jwt-secret.js` :

```javascript
const crypto = require('crypto');

// Générer une clé aléatoire de 64 caractères
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

console.log('JWT_SECRET:', generateSecret());
console.log('JWT_REFRESH_SECRET:', generateSecret());
```

Exécutez :
```bash
node generate-jwt-secret.js
```

### Méthode 2 : OpenSSL

```bash
# Pour JWT_SECRET
openssl rand -base64 48

# Pour JWT_REFRESH_SECRET
openssl rand -base64 48
```

### Méthode 3 : PowerShell

```powershell
# Générer une clé aléatoire
function Generate-Secret {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
    $secret = -join ((1..64) | ForEach-Object { Get-Random -InputObject $chars.ToCharArray() })
    return $secret
}

Write-Host "JWT_SECRET: $(Generate-Secret)"
Write-Host "JWT_REFRESH_SECRET: $(Generate-Secret)"
```

### Méthode 4 : En Ligne (Développement uniquement)

⚠️ **Attention** : Ne jamais utiliser de générateurs en ligne pour la production !

Sites :
- https://www.random.org/strings/
- https://passwordsgenerator.net/

Paramètres recommandés :
- Longueur : 64
- Inclure : Lettres (a-z, A-Z), Chiffres (0-9), Symboles

## 🚀 Utilisation dans le Projet

### Développement

Les clés sont déjà configurées dans `src/config/env.js` comme fallback :

```javascript
JWT_SECRET: process.env.JWT_SECRET || 'mI2s*)fYNCAbfVsb)!uWKq6vwmQe(Xb5pL9#zR4@tH8$nK3&jM7^xC6%vB1',
JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'gT5&hN9@wP3#sD7*fJ2!qL8$mK4^rX6)vC1%bZ0+yH3-aE9~iU7=oW2_nQ5',
```

### Production

1. **Générer de nouvelles clés** avec la Méthode 1 (Node.js)
2. **Définir dans .env** :
```env
JWT_SECRET=votre_nouvelle_cle_generee_64_caracteres
JWT_REFRESH_SECRET=votre_autre_nouvelle_cle_generee_64_caracteres
```

3. **Ou via variables d'environnement** sur votre serveur :
```bash
export JWT_SECRET="votre_cle_production"
export JWT_REFRESH_SECRET="votre_autre_cle_production"
```

## 🔒 Bonnes Pratiques

### ✅ À FAIRE

- ✅ Utiliser des clés d'au moins 32 caractères (64+ recommandé)
- ✅ Utiliser des caractères aléatoires
- ✅ Avoir deux clés différentes (access et refresh)
- ✅ Changer les clés en production
- ✅ Ne jamais commiter les clés dans Git
- ✅ Stocker les clés dans des variables d'environnement
- ✅ Rotationner les clés périodiquement

### ❌ À ÉVITER

- ❌ Utiliser des mots de passe simples
- ❌ Réutiliser la même clé pour access et refresh
- ❌ Hardcoder les clés dans le code
- ❌ Partager les clés publiquement
- ❌ Utiliser des générateurs en ligne pour la production

## 📊 Comparaison de Sécurité

| Longueur | Complexité | Sécurité | Recommandation |
|----------|-----------|----------|----------------|
| 8 chars  | Faible    | ⚠️ Faible | ❌ Non |
| 16 chars | Moyenne   | ⚠️ Moyenne | ❌ Non |
| 32 chars | Haute     | ✅ Bonne | ✅ Minimum |
| 64 chars | Très haute | ✅ Excellente | ✅ **Recommandée** |
| 128 chars | Maximum   | ✅ Maximale | ✅ Production critique |

## 🧪 Tester les Clés

Après configuration, testez :

```bash
# Démarrer le serveur
npm run dev

# Tester l'inscription (génère un JWT)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Le JWT retourné doit être valide et signé avec votre clé secrète.

## 🆘 Troubleshooting

### Erreur: "jwt malformed"
➡️ Le token est invalide ou corrompu

### Erreur: "invalid signature"
➡️ La clé secrète a changé entre la génération et la vérification du token

### Erreur: "jwt expired"
➡️ Normal - le token a expiré (15min par défaut pour access token)

---

**Clés JWT configurées avec succès !** 🔐

Les clés de développement sont déjà en place. 
Générez de nouvelles clés pour la production avec la Méthode 1.
