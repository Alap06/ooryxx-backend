const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = require('../config/env');

let twilioClient;

// Initialiser le client Twilio si les credentials sont disponibles
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Envoyer un SMS
 */
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.warn('Twilio non configuré. SMS non envoyé.');
    return { success: false, message: 'SMS service not configured' };
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to
    });
    
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification SMS de commande
 */
const sendOrderNotificationSMS = async (phone, orderNumber) => {
  const message = `Ooryxx: Votre commande #${orderNumber} a été confirmée. Merci pour votre achat!`;
  return sendSMS(phone, message);
};

/**
 * Envoyer une notification SMS d'expédition
 */
const sendShippingNotificationSMS = async (phone, orderNumber, deliveryCode) => {
  const message = `Ooryxx: Votre commande #${orderNumber} a été expédiée. Code de livraison: ${deliveryCode}`;
  return sendSMS(phone, message);
};

/**
 * Envoyer une notification SMS de livraison
 */
const sendDeliveryNotificationSMS = async (phone, orderNumber) => {
  const message = `Ooryxx: Votre commande #${orderNumber} a été livrée. Merci!`;
  return sendSMS(phone, message);
};

/**
 * Envoyer un code de vérification par SMS
 */
const sendVerificationCodeSMS = async (phone, code) => {
  const message = `Votre code de vérification Ooryxx: ${code}. Valide pendant 10 minutes.`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOrderNotificationSMS,
  sendShippingNotificationSMS,
  sendDeliveryNotificationSMS,
  sendVerificationCodeSMS
};
