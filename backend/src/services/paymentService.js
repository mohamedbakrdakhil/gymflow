/**
 * Service de paiement en ligne — Stripe + CMI (placeholders)
 * Pour activer Stripe: installer `stripe` et fournir STRIPE_SECRET_KEY
 */
const env = require('../config/env');
const logger = require('../utils/logger');

let stripeClient = null;
function getStripe() {
  if (stripeClient) return stripeClient;
  if (!env.STRIPE.SECRET_KEY) return null;
  try {
    const Stripe = require('stripe');
    stripeClient = Stripe(env.STRIPE.SECRET_KEY);
    return stripeClient;
  } catch (e) {
    logger.warn('Module `stripe` non installé — paiements en ligne désactivés');
    return null;
  }
}

/**
 * Crée une session Stripe Checkout
 * @returns {Promise<{url: string, session_id: string}>}
 */
async function createStripeSession({ amount, currency = 'mad', memberId, subscriptionId, successUrl, cancelUrl }) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe non configuré — STRIPE_SECRET_KEY manquante');
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: 'Abonnement GymFlow' },
          unit_amount: Math.round(parseFloat(amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { member_id: memberId, subscription_id: subscriptionId || '' },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return { url: session.url, session_id: session.id };
}

/**
 * CMI — placeholder pour intégration future
 */
async function createCmiTransaction() {
  throw new Error('Intégration CMI à implémenter (Hash + form POST vers le portail CMI)');
}

module.exports = { createStripeSession, createCmiTransaction, getStripe };
