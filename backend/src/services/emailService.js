/**
 * Service email avec Nodemailer
 * Si SMTP non configuré, log en console (mode dev)
 */
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP.HOST || !env.SMTP.USER) {
    logger.warn('SMTP non configuré — les emails seront loggés en console');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP.HOST,
    port: env.SMTP.PORT,
    secure: env.SMTP.SECURE,
    auth: { user: env.SMTP.USER, pass: env.SMTP.PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const tx = getTransporter();
  const from = `"${env.SMTP.FROM_NAME}" <${env.SMTP.FROM}>`;
  if (!tx) {
    logger.info(`📧 [EMAIL DEV] To: ${to} | Subject: ${subject}`);
    logger.info(`   Body (text): ${text || html?.replace(/<[^>]+>/g, '').slice(0, 200)}`);
    return { previewMode: true };
  }
  return tx.sendMail({ from, to, subject, html, text });
}

const templates = {
  welcome: (gymName, ownerName) => ({
    subject: `Bienvenue sur GymFlow, ${ownerName} !`,
    html: `
      <h2>Bienvenue sur GymFlow 💪</h2>
      <p>Bonjour ${ownerName},</p>
      <p>Votre salle <strong>${gymName}</strong> a été créée avec succès.</p>
      <p>Vous pouvez maintenant gérer vos membres, abonnements et paiements depuis votre tableau de bord.</p>
      <p>Bonne route avec GymFlow !</p>
    `,
  }),

  resetPassword: (name, link) => ({
    subject: 'Réinitialisation de votre mot de passe GymFlow',
    html: `
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur ce lien (valable 1h) :</p>
      <p><a href="${link}" style="background:#2563EB;color:white;padding:10px 20px;text-decoration:none;border-radius:6px">Réinitialiser mon mot de passe</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  }),

  subscriptionExpiring: (memberName, daysLeft, gymName) => ({
    subject: `⏰ Votre abonnement expire dans ${daysLeft} jour(s)`,
    html: `
      <h2>Abonnement bientôt expiré</h2>
      <p>Bonjour ${memberName},</p>
      <p>Votre abonnement à <strong>${gymName}</strong> expire dans <strong>${daysLeft} jour(s)</strong>.</p>
      <p>Pensez à le renouveler pour continuer à profiter des installations.</p>
    `,
  }),

  paymentReceipt: (memberName, amount, reference, gymName) => ({
    subject: `Reçu de paiement — ${reference}`,
    html: `
      <h2>Paiement confirmé ✅</h2>
      <p>Bonjour ${memberName},</p>
      <p>Nous avons bien reçu votre paiement de <strong>${amount} DH</strong> à <strong>${gymName}</strong>.</p>
      <p>Référence : <code>${reference}</code></p>
      <p>Merci de votre confiance !</p>
    `,
  }),
};

module.exports = { sendEmail, templates };
