# API Endpoints à Implémenter

Ce document liste tous les endpoints API à créer dans les controllers correspondants.

## 🔐 Authentication (authController.js)

### POST /api/auth/register
- **Description**: Inscription d'un nouvel utilisateur
- **Body**: `{ email, password, firstName, lastName, phone }`
- **Response**: `{ user, accessToken, refreshToken }`
- **Validation**: Email unique, password fort (min 6 caractères)
- **Action**: Créer User, générer tokens, envoyer email bienvenue

### POST /api/auth/login
- **Description**: Connexion utilisateur
- **Body**: `{ email, password }`
- **Response**: `{ user, accessToken, refreshToken }`
- **Sécurité**: Vérifier tentatives, verrouillage compte
- **Action**: Vérifier credentials, générer tokens, update lastLogin

### POST /api/auth/refresh
- **Description**: Rafraîchir l'access token
- **Body**: `{ refreshToken }`
- **Response**: `{ accessToken }`
- **Action**: Vérifier refresh token, générer nouveau access token

### POST /api/auth/forgot-password
- **Description**: Demande de réinitialisation de mot de passe
- **Body**: `{ email }`
- **Rate Limit**: 3/heure
- **Action**: Générer token reset, envoyer email

### POST /api/auth/reset-password/:token
- **Description**: Réinitialiser le mot de passe
- **Body**: `{ password }`
- **Action**: Vérifier token, mettre à jour password

### GET /api/auth/me
- **Description**: Obtenir l'utilisateur connecté
- **Auth**: Required
- **Response**: Profil utilisateur complet

### POST /api/auth/logout
- **Description**: Déconnexion
- **Auth**: Required
- **Action**: Invalider refresh token

---

## 👤 Users (userController.js)

### GET /api/users/profile
- **Auth**: Required
- **Response**: Profil utilisateur complet avec adresses

### PUT /api/users/profile
- **Auth**: Required
- **Body**: `{ firstName, lastName, phone, birthdate, profileImage }`
- **Action**: Mettre à jour profil

### POST /api/users/addresses
- **Auth**: Required
- **Body**: `{ label, street, city, postalCode, country, isDefault }`
- **Action**: Ajouter une adresse

### PUT /api/users/addresses/:id
- **Auth**: Required
- **Action**: Modifier une adresse

### DELETE /api/users/addresses/:id
- **Auth**: Required
- **Action**: Supprimer une adresse

### GET /api/users/orders
- **Auth**: Required
- **Query**: `?page=1&limit=10&status=delivered`
- **Response**: Liste paginée des commandes utilisateur

### POST /api/users/wishlist/:productId
- **Auth**: Required
- **Action**: Ajouter au wishlist

### DELETE /api/users/wishlist/:productId
- **Auth**: Required
- **Action**: Retirer du wishlist

### GET /api/users/wishlist
- **Auth**: Required
- **Response**: Liste des produits en wishlist

---

## 🛍️ Products (productController.js)

### GET /api/products
- **Query**: `?page=1&limit=20&category=xxx&minPrice=10&maxPrice=100&sort=price&search=laptop`
- **Response**: Liste paginée avec filtres et tri
- **Filtres**: category, price range, rating, vendorId, tags, status
- **Tri**: price, rating, createdAt, totalSales, priority

### GET /api/products/:id
- **Response**: Détails complet du produit avec reviews
- **Action**: Incrémenter views

### POST /api/products
- **Auth**: Required (Vendor)
- **Body**: Toutes les infos produit
- **Upload**: Images multiples
- **Action**: Créer produit, générer slug

### PUT /api/products/:id
- **Auth**: Required (Vendor - owner only)
- **Body**: Champs à modifier
- **Action**: Mettre à jour produit

### DELETE /api/products/:id
- **Auth**: Required (Vendor/Admin)
- **Action**: Soft delete (status = discontinued)

### GET /api/products/:id/similar
- **Response**: 6 produits similaires (même catégorie)

### GET /api/products/:id/frequently-bought
- **Response**: 4 produits achetés ensemble

### POST /api/products/:id/reviews
- **Auth**: Required
- **Body**: `{ rating, title, comment, images }`
- **Validation**: Utilisateur a acheté le produit
- **Action**: Créer review, recalculer rating produit

### GET /api/products/search
- **Query**: `?q=laptop&category=electronics`
- **Response**: Résultats recherche full-text

---

## 🛒 Cart (cartController.js)

### GET /api/cart
- **Auth**: Required
- **Response**: Panier avec produits populés et total

### POST /api/cart/add
- **Auth**: Required
- **Body**: `{ productId, quantity, selectedVariants }`
- **Validation**: Stock disponible
- **Action**: Ajouter au panier, vérifier stock

### PUT /api/cart/update/:productId
- **Auth**: Required
- **Body**: `{ quantity }`
- **Action**: Mettre à jour quantité

### DELETE /api/cart/remove/:productId
- **Auth**: Required
- **Action**: Retirer du panier

### DELETE /api/cart/clear
- **Auth**: Required
- **Action**: Vider le panier

### POST /api/cart/apply-coupon
- **Auth**: Required
- **Body**: `{ couponCode }`
- **Validation**: Coupon valide et applicable
- **Action**: Appliquer coupon, calculer réduction

---

## 📦 Orders (orderController.js)

### POST /api/orders
- **Auth**: Required
- **Body**: `{ items, shippingAddress, paymentMethod, couponCode }`
- **Validation**: Stock, coupon, adresse
- **Action**: 
  - Créer Order avec codes anonymes
  - Créer Payment
  - Décrémenter stock
  - Vider panier
  - Envoyer emails/SMS
  - Notifier vendeur

### GET /api/orders
- **Auth**: Required
- **Query**: `?page=1&status=pending`
- **Response**: 
  - Client: Ses commandes
  - Vendeur: Commandes de ses produits (voir seulement clientCode)
  - Admin: Toutes les commandes

### GET /api/orders/:id
- **Auth**: Required
- **Response**: Détails commande
- **Privacy**: 
  - Client: Toutes les infos
  - Vendeur: Infos produits + clientCode (pas coordonnées)
  - Livreur: Avec deliveryCode valide

### PUT /api/orders/:id/status
- **Auth**: Required (Vendor/Admin)
- **Body**: `{ status, note }`
- **Action**: Changer statut, ajouter à l'historique, notifier client

### POST /api/orders/:id/cancel
- **Auth**: Required (Client/Admin)
- **Body**: `{ reason }`
- **Validation**: canBeCancelled()
- **Action**: Annuler, rembourser, restaurer stock

### GET /api/orders/:id/delivery/:deliveryCode
- **Public**: Accessible avec code
- **Response**: Infos livraison si code valide
- **Action**: getDeliveryInfo()

### POST /api/orders/:id/return
- **Auth**: Required (Client)
- **Body**: `{ reason, items }`
- **Validation**: Dans période de retour
- **Action**: Créer demande de retour

---

## 🏪 Vendors (vendorController.js)

### POST /api/vendors/register
- **Auth**: Required (User)
- **Body**: Infos entreprise + documents
- **Upload**: Documents (SIRET, etc.)
- **Action**: Créer Vendor (status=pending), changer user.role

### GET /api/vendors/profile
- **Auth**: Required (Vendor)
- **Response**: Profil vendeur complet

### PUT /api/vendors/profile
- **Auth**: Required (Vendor)
- **Body**: Infos à modifier
- **Action**: Mettre à jour profil

### GET /api/vendors/:id
- **Public**
- **Response**: Profil public vendeur + produits

### GET /api/vendors/orders
- **Auth**: Required (Vendor)
- **Query**: `?page=1&status=pending`
- **Response**: Commandes du vendeur (avec clientCode uniquement)

### GET /api/vendors/stats
- **Auth**: Required (Vendor)
- **Response**: Statistiques (ventes, commandes, produits, rating)

### GET /api/vendors/products
- **Auth**: Required (Vendor)
- **Response**: Tous les produits du vendeur

### GET /api/vendors/dashboard
- **Auth**: Required (Vendor)
- **Response**: Vue d'ensemble (stats + commandes récentes + produits faible stock)

---

## 👨‍💼 Admin (adminController.js)

### GET /api/admin/users
- **Auth**: Required (Admin)
- **Query**: `?page=1&role=client&search=john`
- **Response**: Liste utilisateurs avec filtres

### PUT /api/admin/users/:id/block
- **Auth**: Required (Admin)
- **Body**: `{ isBlocked, reason }`
- **Action**: Bloquer/débloquer utilisateur

### DELETE /api/admin/users/:id
- **Auth**: Required (Admin)
- **Action**: Supprimer utilisateur

### GET /api/admin/vendors
- **Auth**: Required (Admin)
- **Query**: `?status=pending`
- **Response**: Liste vendeurs

### PUT /api/admin/vendors/:id/approve
- **Auth**: Required (Admin)
- **Body**: `{ status, notes }`
- **Action**: Approuver/rejeter vendeur, envoyer email

### GET /api/admin/products
- **Auth**: Required (Admin)
- **Response**: Tous les produits

### DELETE /api/admin/products/:id
- **Auth**: Required (Admin)
- **Action**: Supprimer produit

### GET /api/admin/orders
- **Auth**: Required (Admin)
- **Query**: Filtres avancés
- **Response**: Toutes les commandes

### GET /api/admin/reviews
- **Auth**: Required (Admin)
- **Query**: `?status=pending`
- **Response**: Avis à modérer

### PUT /api/admin/reviews/:id/moderate
- **Auth**: Required (Admin)
- **Body**: `{ status, note }`
- **Action**: Approuver/rejeter/modifier avis

### GET /api/admin/stats
- **Auth**: Required (Admin)
- **Response**: Statistiques globales de la plateforme

### GET /api/admin/coupons
- **Auth**: Required (Admin)
- **Response**: Liste des coupons

### POST /api/admin/coupons
- **Auth**: Required (Admin)
- **Body**: Détails coupon
- **Action**: Créer coupon

---

## 💳 Payments (paymentController.js)

### POST /api/payments/create-intent
- **Auth**: Required
- **Body**: `{ orderId, method }`
- **Action**: Créer payment intent (Stripe/PayPal)
- **Response**: `{ clientSecret, paymentId }`

### POST /api/payments/stripe/webhook
- **Public**: Webhook Stripe
- **Signature**: Vérification webhook
- **Action**: Confirmer paiement, mettre à jour commande

### POST /api/payments/paypal/execute
- **Auth**: Required
- **Body**: `{ paymentId, payerId }`
- **Action**: Exécuter paiement PayPal

### POST /api/payments/:id/refund
- **Auth**: Required (Admin/Vendor)
- **Body**: `{ amount, reason }`
- **Action**: Rembourser paiement

### GET /api/payments/:id
- **Auth**: Required (Owner/Admin)
- **Response**: Détails paiement

---

## 🎯 Recommendations (recommendationController.js)

### GET /api/recommendations
- **Auth**: Optional
- **Response**: Produits recommandés basés sur historique et niveau

### GET /api/recommendations/trending
- **Public**
- **Response**: Produits les plus vendus/populaires

### GET /api/recommendations/new
- **Public**
- **Response**: Nouveaux produits

### GET /api/recommendations/vip
- **Auth**: Required (VIP)
- **Response**: Produits premium pour VIP

---

## 📊 Analytics (analyticsController.js) - Optionnel

### GET /api/analytics/sales
- **Auth**: Required (Vendor/Admin)
- **Query**: `?startDate=xxx&endDate=xxx&groupBy=day`
- **Response**: Données de ventes agrégées

### GET /api/analytics/products/top
- **Auth**: Required (Vendor/Admin)
- **Response**: Top produits par ventes/vues

### GET /api/analytics/revenue
- **Auth**: Required (Vendor/Admin)
- **Response**: Graphique revenus

---

## 📝 Notes d'Implémentation

### Structure Standard d'un Controller
```javascript
exports.methodName = async (req, res) => {
  try {
    // 1. Valider les données
    // 2. Vérifier les permissions
    // 3. Exécuter la logique métier
    // 4. Retourner la réponse
    
    res.status(200).json({
      success: true,
      message: 'Opération réussie',
      data: result
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
```

### Pagination Standard
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const results = await Model.find(query)
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

const total = await Model.countDocuments(query);

res.json({
  success: true,
  data: results,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});
```

### Gestion d'Erreurs
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized (auth required)
- 403: Forbidden (permissions)
- 404: Not Found
- 500: Server Error

---

**Total Endpoints**: ~80 endpoints à implémenter
**Estimation**: 5-8 jours de développement pour un développeur expérimenté
