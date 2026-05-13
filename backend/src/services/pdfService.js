/**
 * Service de génération de PDF (reçus de paiement)
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function ensureReceiptsDir() {
  const dir = path.join(process.cwd(), env.UPLOAD.DIR, 'receipts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Génère un reçu PDF et retourne le chemin relatif
 */
function generateReceipt({ payment, member, gym, subscription, plan }) {
  return new Promise((resolve, reject) => {
    const dir = ensureReceiptsDir();
    const filename = `recu-${payment.reference}.pdf`;
    const filePath = path.join(dir, filename);
    const relativeUrl = `/uploads/receipts/${filename}`;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // En-tête salle
    doc
      .fillColor(gym.primary_color || '#2563EB')
      .fontSize(24)
      .text(gym.name || 'GymFlow', { align: 'right' });
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(gym.address || '', { align: 'right' })
      .text(gym.city || '', { align: 'right' })
      .text(gym.phone || '', { align: 'right' })
      .text(gym.email || '', { align: 'right' });

    // Titre
    doc.moveDown(2);
    doc.fillColor('#000').fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
    doc.moveDown();

    // Référence + date
    doc.fontSize(10).fillColor('#666');
    doc.text(`Référence : ${payment.reference}`);
    doc.text(`Date : ${new Date(payment.paid_at).toLocaleDateString('fr-FR')}`);

    // Ligne de séparation
    doc.moveDown();
    doc
      .strokeColor('#ddd')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown();

    // Infos membre
    doc.fillColor('#000').fontSize(12).text('Membre :', { continued: true }).fillColor('#444');
    doc.text(` ${member.first_name} ${member.last_name}`);
    doc.fillColor('#000').text('Code membre :', { continued: true }).fillColor('#444');
    doc.text(` ${member.member_code}`);
    if (member.phone) {
      doc.fillColor('#000').text('Téléphone :', { continued: true }).fillColor('#444');
      doc.text(` ${member.phone}`);
    }

    // Détails paiement
    doc.moveDown();
    doc
      .strokeColor('#ddd')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown();

    if (plan) {
      doc.fillColor('#000').fontSize(12).text('Plan :', { continued: true }).fillColor('#444');
      doc.text(` ${plan.name} (${plan.duration_days} jours)`);
    }

    if (subscription) {
      doc
        .fillColor('#000')
        .text('Période :', { continued: true })
        .fillColor('#444');
      doc.text(
        ` du ${new Date(subscription.start_date).toLocaleDateString('fr-FR')} au ${new Date(
          subscription.end_date,
        ).toLocaleDateString('fr-FR')}`,
      );
    }

    doc.fillColor('#000').text('Méthode :', { continued: true }).fillColor('#444');
    const methodLabels = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      bank_transfer: 'Virement',
      online_stripe: 'Stripe',
      online_cmi: 'CMI',
    };
    doc.text(` ${methodLabels[payment.payment_method] || payment.payment_method}`);

    // Montant en gros
    doc.moveDown(2);
    doc.fontSize(28).fillColor(gym.primary_color || '#2563EB');
    doc.text(`${parseFloat(payment.amount).toFixed(2)} DH`, { align: 'right' });

    // Footer
    doc.moveDown(4);
    doc
      .fontSize(8)
      .fillColor('#999')
      .text('Merci de votre confiance.', { align: 'center' })
      .text(`Reçu généré par GymFlow — ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(relativeUrl));
    stream.on('error', reject);
  });
}

/**
 * Génère un rapport mensuel PDF (Plan PRO)
 */
function generateMonthlyReport({ gym, month, year, stats }) {
  return new Promise((resolve, reject) => {
    const dir = ensureReceiptsDir();
    const filename = `rapport-${gym.subdomain}-${year}-${month}.pdf`;
    const filePath = path.join(dir, filename);
    const relativeUrl = `/uploads/receipts/${filename}`;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];

    doc.fillColor(gym.primary_color || '#2563EB').fontSize(24).text(gym.name);
    doc.fontSize(16).fillColor('#000').text(`Rapport mensuel — ${monthNames[month - 1]} ${year}`);
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000');
    doc.text(`Total membres actifs : ${stats.activeMembers}`);
    doc.text(`Nouveaux membres ce mois : ${stats.newMembers}`);
    doc.text(`Revenus totaux : ${parseFloat(stats.revenue).toFixed(2)} DH`);
    doc.text(`Nombre d'abonnements vendus : ${stats.subscriptionsCount}`);
    doc.text(`Nombre de check-ins : ${stats.checkInsCount}`);
    doc.text(`Abonnements expirant ce mois : ${stats.expiringCount}`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text(
      `Rapport généré le ${new Date().toLocaleString('fr-FR')} par GymFlow`,
      { align: 'center' },
    );

    doc.end();
    doc.on('finish', () => resolve(relativeUrl));
    doc.on('error', reject);
  });
}

module.exports = { generateReceipt, generateMonthlyReport };
