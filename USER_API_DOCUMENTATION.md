# 📚 Documentation API Utilisateur - OORYXX

## 🔐 Authentification Requise
Toutes les routes nécessitent un token JWT dans le header :
```
Authorization: Bearer <votre_token_jwt>
```

---

## 👤 PROFIL UTILISATEUR

### Obtenir le profil
```http
GET /api/users/profile
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+33612345678",
    "addresses": [...],
    "wishlist": [...],
    "cart": {...}
  }
}
```

### Mettre à jour le profil
```http
PUT /api/users/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+33612345678",
  "birthdate": "1990-01-01",
  "profileImage": "https://..."
}
```

### Changer le mot de passe
```http
PUT /api/users/profile/password
Content-Type: application/json

{
  "currentPassword": "ancien_mot_de_passe",
  "newPassword": "nouveau_mot_de_passe"
}
```

---

## 📍 ADRESSES

### Obtenir toutes les adresses
```http
GET /api/users/addresses
```

### Ajouter une adresse
```http
POST /api/users/addresses
Content-Type: application/json

{
  "label": "Maison",
  "street": "123 Rue de la Paix",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "isDefault": true
}
```

### Mettre à jour une adresse
```http
PUT /api/users/addresses/:addressId
Content-Type: application/json

{
  "label": "Bureau",
  "street": "456 Avenue des Champs",
  "city": "Lyon",
  "postalCode": "69001",
  "isDefault": false
}
```

### Supprimer une adresse
```http
DELETE /api/users/addresses/:addressId
```

---

## 🛒 PANIER (CART)

### Obtenir le panier
```http
GET /api/users/cart
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": {
          "_id": "product_id",
          "title": "Nom du produit",
          "images": ["url1", "url2"],
          "price": 99.99,
          "discount": 10
        },
        "quantity": 2,
        "price": 99.99
      }
    ],
    "estimatedTotal": 179.98
  }
}
```

### Ajouter un produit au panier
```http
POST /api/users/cart
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 2,
  "selectedVariants": {
    "size": "L",
    "color": "Bleu"
  }
}
```

### Mettre à jour la quantité
```http
PUT /api/users/cart/:productId
Content-Type: application/json

{
  "quantity": 3
}
```

### Supprimer un produit
```http
DELETE /api/users/cart/:productId
```

### Vider le panier
```http
DELETE /api/users/cart
```

---

## ❤️ WISHLIST (LISTE DE SOUHAITS)

### Obtenir la wishlist
```http
GET /api/users/wishlist
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "title": "Produit favori",
      "images": ["url"],
      "price": 149.99,
      "discount": 15,
      "rating": 4.5
    }
  ]
}
```

### Ajouter à la wishlist
```http
POST /api/users/wishlist/:productId
```

### Retirer de la wishlist
```http
DELETE /api/users/wishlist/:productId
```

---

## 📦 COMMANDES

### Obtenir toutes les commandes
```http
GET /api/users/orders?status=pending&page=1&limit=10
```

**Query params :**
- `status` (optionnel) : `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- `page` (défaut: 1)
- `limit` (défaut: 10)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "totalPages": 5,
    "currentPage": 1,
    "total": 47
  }
}
```

### Obtenir une commande
```http
GET /api/users/orders/:orderId
```

### Annuler une commande
```http
PUT /api/users/orders/:orderId/cancel
```

**Note :** Seules les commandes avec statut `pending` ou `confirmed` peuvent être annulées.

---

## 📊 STATISTIQUES

### Obtenir les statistiques
```http
GET /api/users/stats
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalOrders": 15,
    "totalSpent": 1543.50,
    "wishlistCount": 8,
    "cartItemsCount": 3,
    "memberSince": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🚨 Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## 📝 Exemples d'Utilisation

### Exemple JavaScript (Fetch)

```javascript
// Obtenir le profil
const getProfile = async () => {
  const response = await fetch('http://localhost:5000/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log(data);
};

// Ajouter au panier
const addToCart = async (productId, quantity) => {
  const response = await fetch('http://localhost:5000/api/users/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity })
  });
  const data = await response.json();
  console.log(data);
};
```

### Exemple avec Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Obtenir la wishlist
const wishlist = await api.get('/users/wishlist');

// Ajouter une adresse
const newAddress = await api.post('/users/addresses', {
  label: 'Maison',
  street: '123 Rue',
  city: 'Paris',
  postalCode: '75001',
  country: 'France'
});
```

---

## ✅ Test Rapide

Pour tester toutes les routes :

```bash
# Dans le dossier backend
node test-user-api.js
```

Ou utilisez Postman/Thunder Client avec la collection fournie.
