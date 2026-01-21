const Stripe = require('stripe');
const { STRIPE_SECRET_KEY } = require('./env');

const stripe = new Stripe(STRIPE_SECRET_KEY);

module.exports = stripe;
