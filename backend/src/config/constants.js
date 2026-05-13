/**
 * Constantes du domaine GymFlow
 */
module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    OWNER: 'owner',
    COACH: 'coach',
    MEMBER: 'member',
  },

  PLAN_TYPES: {
    BASIQUE: 'basique',
    PRO: 'pro',
    PREMIUM: 'premium',
  },

  // Limites de features par plan SaaS
  PLAN_FEATURES: {
    basique: {
      qrCheckIn: false,
      classes: false,
      coaches: false,
      onlinePayment: false,
      whiteLabel: false,
      nutrition: false,
      multiGym: false,
      chat: false,
      maxMembers: 200,
      monthlyPriceMAD: 200,
    },
    pro: {
      qrCheckIn: true,
      classes: true,
      coaches: true,
      onlinePayment: true,
      whiteLabel: false,
      nutrition: false,
      multiGym: false,
      chat: false,
      maxMembers: 1000,
      monthlyPriceMAD: 500,
    },
    premium: {
      qrCheckIn: true,
      classes: true,
      coaches: true,
      onlinePayment: true,
      whiteLabel: true,
      nutrition: true,
      multiGym: true,
      chat: true,
      maxMembers: -1, // illimité
      monthlyPriceMAD: 1500,
      yearlyPriceMAD: 15000,
    },
  },

  GYM_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
    CANCELLED: 'cancelled',
  },

  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    FROZEN: 'frozen',
    CANCELLED: 'cancelled',
  },

  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    ONLINE_STRIPE: 'online_stripe',
    ONLINE_CMI: 'online_cmi',
  },

  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    REFUNDED: 'refunded',
    FAILED: 'failed',
  },

  CHECKIN_METHODS: {
    QR_CODE: 'qr_code',
    MANUAL: 'manual',
    CARD: 'card',
  },

  CLASS_BOOKING_STATUS: {
    BOOKED: 'booked',
    ATTENDED: 'attended',
    NO_SHOW: 'no_show',
    CANCELLED: 'cancelled',
  },

  DAYS_OF_WEEK: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],

  NOTIFICATION_TYPES: {
    SUBSCRIPTION_EXPIRING: 'subscription_expiring',
    PAYMENT_RECEIVED: 'payment_received',
    CLASS_REMINDER: 'class_reminder',
    GENERAL: 'general',
  },

  GENDER: { MALE: 'male', FEMALE: 'female' },

  // Alertes expiration: nombre de jours avant la fin
  EXPIRY_ALERT_DAYS: [7, 3, 1],

  // Trial automatique à la création d'une salle
  DEFAULT_TRIAL_DAYS: 14,
};
