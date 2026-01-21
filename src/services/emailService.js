const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { FRONTEND_URL } = require('../config/env');

// =================================================================
// MAILTRAP CONFIGURATION
// =================================================================

// Mailtrap Sandbox SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '1e7ca8245d9efb',
    pass: '43fc4a45d531ad'
  }
});


// Email sender configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Ooryxx <noreply@ooryxx.com>';

// Template paths
const TEMPLATES_DIR = path.join(__dirname, '../templates/emails');

// =================================================================
// TEMPLATE UTILITIES
// =================================================================

/**
 * Default variables for all emails
 */
const getDefaultVariables = () => ({
  year: new Date().getFullYear(),
  logoUrl: process.env.EMAIL_LOGO_URL || `${FRONTEND_URL}/logo.png`,
  websiteUrl: FRONTEND_URL || 'https://ooryxx.com',
  supportEmail: process.env.SUPPORT_EMAIL || 'contact@ooryxx.tn',
  supportPhone: process.env.SUPPORT_PHONE || '+216 XX XXX XXX',
  companyAddress: 'Tunis, Tunisie',
  helpUrl: `${FRONTEND_URL}/aide`,
  unsubscribeUrl: `${FRONTEND_URL}/unsubscribe`,
  preferencesUrl: `${FRONTEND_URL}/preferences`,
  facebookUrl: 'https://facebook.com/ooryxx',
  instagramUrl: 'https://instagram.com/ooryxx',
  twitterUrl: 'https://twitter.com/ooryxx'
});

/**
 * Render an email template with variables
 * @param {string} templateName - Template file name
 * @param {object} variables - Template variables
 * @returns {string|null} Rendered HTML or null
 */
const renderTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template ${templateName} not found, using inline template`);
      return null;
    }

    let template = fs.readFileSync(templatePath, 'utf8');
    const allVariables = { ...getDefaultVariables(), ...variables };

    // Simple variable replacement {{variable}}
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      template = template.replace(regex, value !== undefined && value !== null ? value : '');
    });

    // Handle conditionals {{#if variable}}...{{/if}}
    template = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
      return allVariables[variable] ? content : '';
    });

    // Handle loops {{#each array}}...{{/each}}
    template = template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, itemTemplate) => {
      const array = allVariables[arrayName];
      if (!Array.isArray(array)) return '';
      return array.map(item => {
        let rendered = itemTemplate;
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          rendered = rendered.replace(regex, value !== undefined && value !== null ? value : '');
        });
        return rendered;
      }).join('');
    });

    return template;
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    return null;
  }
};

/**
 * Send email using Mailtrap SMTP
 * @param {object} options - Email options
 * @returns {Promise<object>} Nodemailer response
 */
const sendEmail = async ({ to, subject, html, from = EMAIL_FROM }) => {
  try {
    console.log(`📤 Sending email via Mailtrap...`);
    console.log(`   To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`   Subject: ${subject}`);

    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log('   📬 Check your Mailtrap inbox: https://mailtrap.io/inboxes');

    return { success: true, data: { id: info.messageId, to, subject } };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

// =================================================================
// EMAIL SENDING FUNCTIONS
// =================================================================

/**
 * Envoyer un email de bienvenue
 */
const sendWelcomeEmail = async (user) => {
  const html = renderTemplate('informational.html', {
    name: user.firstName,
    email: user.email,
    subject: 'Bienvenue sur Ooryxx !',
    content: `
      <p>Merci de vous être inscrit sur <strong>Ooryxx</strong> !</p>
      <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
      <ul>
        <li>Parcourir notre catalogue de produits</li>
        <li>Ajouter des articles à vos favoris</li>
        <li>Passer vos premières commandes</li>
      </ul>
    `,
    ctaLink: FRONTEND_URL,
    ctaText: 'Commencer mes achats'
  }) || `
    <h1>Bienvenue ${user.firstName} !</h1>
    <p>Merci de vous être inscrit sur Ooryxx.</p>
    <p>Votre compte a été créé avec succès.</p>
    <a href="${FRONTEND_URL}">Commencer vos achats</a>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Bienvenue sur Ooryxx !',
    html
  });
};

/**
 * Envoyer un email de réinitialisation de mot de passe avec code
 */
const sendPasswordResetCode = async (user, resetCode) => {
  const html = renderTemplate('forgot-password.html', {
    name: user.firstName,
    resetLink: `${FRONTEND_URL}/reset-password?code=${resetCode}`,
    resetCode: resetCode
  }) || `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${user.firstName},</p>
    <p>Votre code de réinitialisation : <strong>${resetCode}</strong></p>
    <p>Ce code expire dans 10 minutes.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Code de réinitialisation de mot de passe - Ooryxx',
    html
  });
};

/**
 * Envoyer un email de réinitialisation avec lien
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  const html = renderTemplate('forgot-password.html', {
    name: user.firstName,
    resetLink: resetUrl
  }) || `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${user.firstName},</p>
    <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
    <p>Ce lien expire dans 10 minutes.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Réinitialisation de mot de passe - Ooryxx',
    html
  });
};

/**
 * Envoyer un email de confirmation de commande
 */
const sendOrderConfirmationEmail = async (user, order) => {
  const html = renderTemplate('informational.html', {
    name: user.firstName,
    email: user.email,
    subject: `Confirmation de commande #${order.orderNumber}`,
    content: `
      <p>Votre commande <strong>#${order.orderNumber}</strong> a été confirmée avec succès !</p>
      <p><strong>Montant total :</strong> ${order.totalAmount} TND</p>
      <p><strong>Code de livraison :</strong> ${order.deliveryCode}</p>
      <p>Vous recevrez un email dès que votre commande sera expédiée.</p>
    `,
    infoBox: 'Conservez votre code de livraison pour récupérer votre colis.',
    ctaLink: `${FRONTEND_URL}/orders/${order._id}`,
    ctaText: 'Voir ma commande'
  }) || `
    <h2>Commande confirmée !</h2>
    <p>Commande #${order.orderNumber}</p>
    <p>Montant: ${order.totalAmount} TND</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Confirmation de commande #${order.orderNumber} - Ooryxx`,
    html
  });
};

/**
 * Envoyer un email de notification de livraison
 */
const sendShippingNotificationEmail = async (user, order) => {
  const html = renderTemplate('informational.html', {
    name: user.firstName,
    email: user.email,
    subject: `Commande #${order.orderNumber} expédiée`,
    content: `
      <p>Bonne nouvelle ! Votre commande <strong>#${order.orderNumber}</strong> a été expédiée.</p>
      <p><strong>Numéro de suivi :</strong> ${order.shipping?.trackingNumber || 'N/A'}</p>
      <p><strong>Code de livraison :</strong> ${order.deliveryCode}</p>
      <p>Vous pouvez suivre votre colis en temps réel.</p>
    `,
    ctaLink: `${FRONTEND_URL}/track/${order._id}`,
    ctaText: 'Suivre ma commande'
  }) || `
    <h2>Commande expédiée !</h2>
    <p>Commande #${order.orderNumber}</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Votre commande #${order.orderNumber} a été expédiée - Ooryxx`,
    html
  });
};

/**
 * Envoyer un email au vendeur pour nouvelle commande
 */
const sendNewOrderToVendorEmail = async (vendor, order) => {
  const html = renderTemplate('informational.html', {
    name: vendor.companyInfo?.name || 'Vendeur',
    email: vendor.companyInfo?.email,
    subject: `Nouvelle commande #${order.orderNumber}`,
    content: `
      <p>Vous avez reçu une nouvelle commande !</p>
      <p><strong>Numéro de commande :</strong> #${order.orderNumber}</p>
      <p><strong>Code client :</strong> ${order.clientCode}</p>
      <p><strong>Montant :</strong> ${order.totalAmount} TND</p>
      <p>Veuillez préparer cette commande dans les plus brefs délais.</p>
    `,
    ctaLink: `${FRONTEND_URL}/vendor/orders/${order._id}`,
    ctaText: 'Voir la commande'
  }) || `
    <h2>Nouvelle commande #${order.orderNumber}</h2>
    <p>Montant: ${order.totalAmount} TND</p>
  `;

  return sendEmail({
    to: vendor.companyInfo?.email,
    subject: `Nouvelle commande #${order.orderNumber} - Ooryxx`,
    html
  });
};

/**
 * Envoyer un email de notification de compte vendeur approuvé
 */
const sendVendorApprovalEmail = async (vendor, user) => {
  const html = renderTemplate('informational.html', {
    name: user.firstName,
    email: user.email,
    subject: 'Votre compte vendeur a été approuvé !',
    content: `
      <p>Félicitations ! 🎉</p>
      <p>Votre compte vendeur <strong>"${vendor.companyInfo?.name}"</strong> a été approuvé.</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>Ajouter vos produits au catalogue</li>
        <li>Gérer vos commandes</li>
        <li>Suivre vos statistiques de vente</li>
      </ul>
    `,
    ctaLink: `${FRONTEND_URL}/vendor/dashboard`,
    ctaText: 'Accéder à mon espace vendeur'
  }) || `
    <h2>Félicitations !</h2>
    <p>Votre compte vendeur a été approuvé.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Votre compte vendeur a été approuvé ! - Ooryxx',
    html
  });
};

// =================================================================
// MARKETING EMAIL FUNCTIONS
// =================================================================

/**
 * Envoyer une newsletter
 */
const sendNewsletter = async (subscriber, subject, content, options = {}) => {
  const html = renderTemplate('newsletter.html', {
    name: subscriber.firstName || 'Cher(e) abonné(e)',
    subject,
    content,
    newsletterDate: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    ctaLink: options.ctaLink || FRONTEND_URL,
    ctaText: options.ctaText || 'Visiter notre boutique',
    featuredProducts: options.featuredProducts || null,
    unsubscribeUrl: `${FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken || ''}`
  }) || `<h2>${subject}</h2><p>Bonjour,</p>${content}`;

  return sendEmail({
    to: subscriber.email,
    subject,
    html
  });
};

/**
 * Envoyer une offre promotionnelle
 */
const sendPromotionalOffer = async (recipient, offer) => {
  const expiryDate = offer.expiryDate ? new Date(offer.expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiryDate - now;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  const html = renderTemplate('promotional-offer.html', {
    name: recipient.firstName || 'Cher(e) client(e)',
    discountValue: offer.discountValue || 20,
    offerTitle: offer.title || 'Offre exceptionnelle !',
    offerDescription: offer.description || 'Profitez de cette offre exclusive !',
    promoCode: offer.promoCode || 'PROMO2024',
    expiryDate: expiryDate.toLocaleDateString('fr-FR'),
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    products: offer.products || [],
    shopLink: offer.shopLink || FRONTEND_URL,
    termsUrl: `${FRONTEND_URL}/terms`
  }) || `<h2>${offer.title}</h2><p>Code: ${offer.promoCode}</p>`;

  return sendEmail({
    to: recipient.email,
    subject: `🔥 ${offer.discountValue || 20}% de réduction - ${offer.title || 'Offre limitée !'}`,
    html
  });
};

/**
 * Envoyer une demande d'avis après achat
 */
const sendReviewRequest = async (user, order, product) => {
  const html = renderTemplate('review-request.html', {
    name: user.firstName,
    orderNumber: order.orderNumber,
    productImage: product.images?.[0] || '',
    productTitle: product.title,
    productVariant: product.variant || '',
    productPrice: product.price,
    reviewLink: `${FRONTEND_URL}/review/${product._id}`,
    otherProducts: order.otherProducts || null,
    ordersUrl: `${FRONTEND_URL}/account/orders`
  }) || `
    <h2>Votre avis compte !</h2>
    <p>Bonjour ${user.firstName},</p>
    <p>Comment avez-vous trouvé "${product.title}" ?</p>
    <a href="${FRONTEND_URL}/review/${product._id}">Laisser un avis</a>
  `;

  return sendEmail({
    to: user.email,
    subject: `⭐ Donnez votre avis sur "${product.title}"`,
    html
  });
};

/**
 * Envoyer un email informatif
 */
const sendInformationalEmail = async (recipient, subject, content, options = {}) => {
  const html = renderTemplate('informational.html', {
    name: recipient.firstName || recipient.email?.split('@')[0] || 'Client',
    email: recipient.email,
    subject,
    content,
    infoBox: options.infoBox || null,
    ctaLink: options.ctaLink || null,
    ctaText: options.ctaText || 'En savoir plus',
    chatUrl: options.chatUrl || `${FRONTEND_URL}/chat`
  }) || `<h2>${subject}</h2><p>Bonjour,</p>${content}`;

  return sendEmail({
    to: recipient.email,
    subject,
    html
  });
};

// =================================================================
// EXPORTS
// =================================================================

module.exports = {
  // Core email function
  sendEmail,

  // User emails
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetCode,

  // Order emails
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
  sendNewOrderToVendorEmail,

  // Vendor emails
  sendVendorApprovalEmail,

  // Marketing emails
  sendNewsletter,
  sendPromotionalOffer,
  sendReviewRequest,
  sendInformationalEmail,

  // Template utilities
  renderTemplate,
  getDefaultVariables,

  // Transporter (for advanced usage)
  transporter
};
