const stripe = require('../config/stripe');
const paypal = require('paypal-rest-sdk');
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } = require('../config/env');
const Payment = require('../models/Payment');

// Configuration PayPal
if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
  paypal.configure({
    mode: PAYPAL_MODE,
    client_id: PAYPAL_CLIENT_ID,
    client_secret: PAYPAL_CLIENT_SECRET
  });
}

/**
 * Créer un Payment Intent Stripe
 */
const createStripePaymentIntent = async (amount, currency = 'tnd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Montant en centimes
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Confirmer un paiement Stripe
 */
const confirmStripePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Créer un paiement PayPal
 */
const createPayPalPayment = async (amount, currency = 'USD', returnUrl, cancelUrl) => {
  return new Promise((resolve, reject) => {
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      transactions: [{
        amount: {
          currency: currency.toUpperCase(),
          total: amount.toFixed(2)
        },
        description: 'Paiement Ooryxx'
      }]
    };
    
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
        resolve({
          success: true,
          paymentId: payment.id,
          approvalUrl: approvalUrl ? approvalUrl.href : null
        });
      }
    });
  });
};

/**
 * Exécuter un paiement PayPal
 */
const executePayPalPayment = async (paymentId, payerId) => {
  return new Promise((resolve, reject) => {
    const execute_payment_json = {
      payer_id: payerId
    };
    
    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({
          success: payment.state === 'approved',
          state: payment.state,
          transactionId: payment.transactions[0].related_resources[0].sale.id
        });
      }
    });
  });
};

/**
 * Rembourser un paiement Stripe
 */
const refundStripePayment = async (paymentIntentId, amount) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    
    return {
      success: true,
      refundId: refund.id,
      status: refund.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Traiter un paiement
 */
const processPayment = async (orderId, userId, amount, method, paymentDetails = {}) => {
  try {
    const payment = new Payment({
      orderId,
      userId,
      amount,
      method,
      status: 'pending',
      paymentDetails
    });
    
    await payment.save();
    
    let result;
    
    switch (method) {
      case 'stripe':
        result = await createStripePaymentIntent(amount, 'tnd', { orderId: orderId.toString() });
        if (result.success) {
          payment.stripePaymentIntentId = result.paymentIntentId;
          await payment.save();
        }
        break;
        
      case 'paypal':
        result = await createPayPalPayment(
          amount,
          'USD',
          paymentDetails.returnUrl,
          paymentDetails.cancelUrl
        );
        if (result.success) {
          payment.paypalOrderId = result.paymentId;
          await payment.save();
        }
        break;
        
      case 'cash_on_delivery':
        payment.status = 'pending';
        await payment.save();
        result = { success: true, message: 'Paiement à la livraison' };
        break;
        
      default:
        result = { success: false, error: 'Méthode de paiement non supportée' };
    }
    
    return {
      ...result,
      paymentId: payment._id
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  createPayPalPayment,
  executePayPalPayment,
  refundStripePayment,
  processPayment
};
