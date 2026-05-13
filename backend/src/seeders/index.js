/**
 * Seed data — populate la DB avec données réalistes pour tests
 * Crée:
 *   - 1 super_admin
 *   - 2 gyms (1 PRO active, 1 BASIQUE trial)
 *   - 1 owner par gym + 2 coachs par gym
 *   - 5 members par gym
 *   - 3 plans par gym
 *   - Abonnements + paiements + check-ins + cours
 */
require('dotenv').config();
const { sequelize, Gym, User, Member, Plan, Subscription, Payment, Coach, Class, CheckIn } =
  require('../models');
const { ROLES, PLAN_FEATURES } = require('../config/constants');
const { generateMemberCode, generateQrToken, generatePaymentReference, addDays } = require('../utils/helpers');
const logger = require('../utils/logger');

async function seed() {
  try {
    logger.info('🌱 Démarrage du seed...');
    await sequelize.sync({ force: true });
    logger.info('  ✅ Tables recréées (--force)');

    // -------- Super admin --------
    const superAdmin = await User.create({
      gym_id: null,
      email: 'super@gymflow.ma',
      password_hash: 'admin123',
      role: ROLES.SUPER_ADMIN,
      first_name: 'Super',
      last_name: 'Admin',
      email_verified: true,
    });
    logger.info(`  ✅ Super admin: ${superAdmin.email}`);

    // -------- Gym 1: Fitness Casa (PRO active) --------
    const gym1 = await Gym.create({
      name: 'Fitness Casa',
      subdomain: 'fitness-casa',
      address: '12 Rue Hassan II, Maarif',
      city: 'Casablanca',
      phone: '+212522000001',
      email: 'contact@fitnesscasa.ma',
      plan_type: 'pro',
      plan_started_at: new Date(),
      plan_expires_at: addDays(new Date(), 365),
      status: 'active',
      primary_color: '#2563EB',
      secondary_color: '#F97316',
    });

    const owner1 = await User.create({
      gym_id: gym1.id,
      email: 'owner1@example.ma',
      password_hash: 'owner123',
      role: ROLES.OWNER,
      first_name: 'Karim',
      last_name: 'Alaoui',
      phone: '+212661111111',
      email_verified: true,
    });

    const coach1Users = await Promise.all([
      User.create({
        gym_id: gym1.id,
        email: 'coach1@example.ma',
        password_hash: 'coach123',
        role: ROLES.COACH,
        first_name: 'Yassine',
        last_name: 'Bennani',
        phone: '+212661222222',
        email_verified: true,
      }),
      User.create({
        gym_id: gym1.id,
        email: 'coach2@example.ma',
        password_hash: 'coach123',
        role: ROLES.COACH,
        first_name: 'Salma',
        last_name: 'Idrissi',
        phone: '+212661333333',
        email_verified: true,
      }),
    ]);

    const coaches1 = await Promise.all([
      Coach.create({
        gym_id: gym1.id,
        user_id: coach1Users[0].id,
        specialty: 'Musculation, CrossFit',
        bio: 'Coach diplômé avec 10 ans d\'expérience',
        certifications: ['CrossFit L1', 'NSCA-CPT'],
        hourly_rate: 200,
      }),
      Coach.create({
        gym_id: gym1.id,
        user_id: coach1Users[1].id,
        specialty: 'Yoga, Pilates',
        certifications: ['Yoga Alliance 200h'],
        hourly_rate: 180,
      }),
    ]);

    const plans1 = await Plan.bulkCreate([
      {
        gym_id: gym1.id,
        name: 'Mensuel',
        duration_days: 30,
        price: 350,
        description: 'Accès illimité un mois',
      },
      {
        gym_id: gym1.id,
        name: 'Trimestriel',
        duration_days: 90,
        price: 900,
        description: 'Économisez 150 DH',
      },
      {
        gym_id: gym1.id,
        name: 'Annuel',
        duration_days: 365,
        price: 3200,
        description: 'Meilleur tarif',
      },
    ]);

    const memberFirstNames = ['Mohamed', 'Fatima', 'Ahmed', 'Aicha', 'Youssef'];
    const memberLastNames = ['Benali', 'Zaki', 'Tazi', 'Cherkaoui', 'Hilali'];
    for (let i = 0; i < 5; i++) {
      const m = await Member.create({
        gym_id: gym1.id,
        member_code: generateMemberCode('FC'),
        qr_code: generateQrToken(),
        first_name: memberFirstNames[i],
        last_name: memberLastNames[i],
        phone: `+21266${String(1000000 + i * 12345).padStart(7, '0')}`,
        email: `${memberFirstNames[i].toLowerCase()}.${memberLastNames[i].toLowerCase()}@example.com`,
        gender: i % 2 === 0 ? 'male' : 'female',
        joined_at: addDays(new Date(), -Math.floor(Math.random() * 90)),
        status: 'active',
      });

      const plan = plans1[i % 3];
      const start = addDays(new Date(), -10);
      const sub = await Subscription.create({
        gym_id: gym1.id,
        member_id: m.id,
        plan_id: plan.id,
        start_date: start,
        end_date: addDays(start, plan.duration_days),
        status: 'active',
        price_paid: plan.price,
      });

      await Payment.create({
        gym_id: gym1.id,
        subscription_id: sub.id,
        member_id: m.id,
        amount: plan.price,
        payment_method: 'cash',
        reference: generatePaymentReference(),
        status: 'completed',
        paid_at: start,
      });

      // Quelques check-ins
      for (let j = 0; j < 3; j++) {
        await CheckIn.create({
          gym_id: gym1.id,
          member_id: m.id,
          subscription_id: sub.id,
          check_in_time: addDays(new Date(), -j),
          method: 'qr_code',
        });
      }
    }

    // Quelques classes
    await Class.bulkCreate([
      {
        gym_id: gym1.id,
        coach_id: coaches1[0].id,
        name: 'CrossFit débutant',
        description: 'Cours d\'initiation au CrossFit',
        day_of_week: 'monday',
        start_time: '18:00:00',
        end_time: '19:00:00',
        max_capacity: 15,
        room: 'Salle 1',
      },
      {
        gym_id: gym1.id,
        coach_id: coaches1[1].id,
        name: 'Yoga Vinyasa',
        description: 'Yoga dynamique',
        day_of_week: 'wednesday',
        start_time: '19:00:00',
        end_time: '20:00:00',
        max_capacity: 20,
        room: 'Salle Yoga',
      },
      {
        gym_id: gym1.id,
        coach_id: coaches1[0].id,
        name: 'HIIT',
        description: 'High-intensity interval training',
        day_of_week: 'friday',
        start_time: '18:30:00',
        end_time: '19:30:00',
        max_capacity: 18,
        room: 'Salle 1',
      },
    ]);

    logger.info(`  ✅ Gym 1: ${gym1.name} avec owner, 2 coachs, 5 members, 3 plans, 3 cours`);

    // -------- Gym 2: Iron Gym Rabat (BASIQUE trial) --------
    const gym2 = await Gym.create({
      name: 'Iron Gym Rabat',
      subdomain: 'iron-gym-rabat',
      address: 'Avenue Mohamed V, Agdal',
      city: 'Rabat',
      phone: '+212537000002',
      email: 'contact@irongym.ma',
      plan_type: 'basique',
      plan_started_at: new Date(),
      plan_expires_at: addDays(new Date(), 14),
      status: 'trial',
    });

    const owner2 = await User.create({
      gym_id: gym2.id,
      email: 'owner2@example.ma',
      password_hash: 'owner123',
      role: ROLES.OWNER,
      first_name: 'Hassan',
      last_name: 'Berrada',
      phone: '+212662000000',
      email_verified: true,
    });

    const plans2 = await Plan.bulkCreate([
      {
        gym_id: gym2.id,
        name: 'Mensuel',
        duration_days: 30,
        price: 250,
      },
      {
        gym_id: gym2.id,
        name: 'Trimestriel',
        duration_days: 90,
        price: 650,
      },
    ]);

    for (let i = 0; i < 5; i++) {
      const m = await Member.create({
        gym_id: gym2.id,
        member_code: generateMemberCode('IR'),
        qr_code: generateQrToken(),
        first_name: memberFirstNames[i],
        last_name: memberLastNames[(i + 2) % 5],
        phone: `+21266${String(2000000 + i * 12345).padStart(7, '0')}`,
        gender: i % 2 === 0 ? 'female' : 'male',
        joined_at: addDays(new Date(), -Math.floor(Math.random() * 30)),
        status: 'active',
      });

      const plan = plans2[i % 2];
      const start = addDays(new Date(), -5);
      const sub = await Subscription.create({
        gym_id: gym2.id,
        member_id: m.id,
        plan_id: plan.id,
        start_date: start,
        end_date: addDays(start, plan.duration_days),
        status: 'active',
        price_paid: plan.price,
      });

      await Payment.create({
        gym_id: gym2.id,
        subscription_id: sub.id,
        member_id: m.id,
        amount: plan.price,
        payment_method: 'cash',
        reference: generatePaymentReference(),
        status: 'completed',
        paid_at: start,
      });
    }

    logger.info(`  ✅ Gym 2: ${gym2.name} (Basique trial) avec owner, 5 members, 2 plans`);

    logger.info('');
    logger.info('🎉 Seed terminé avec succès !');
    logger.info('');
    logger.info('Comptes de test:');
    logger.info('  Super admin : super@gymflow.ma / admin123');
    logger.info('  Owner Gym 1 : owner1@example.ma / owner123 (Fitness Casa - PRO)');
    logger.info('  Coach Gym 1 : coach1@example.ma / coach123');
    logger.info('  Owner Gym 2 : owner2@example.ma / owner123 (Iron Gym Rabat - Basique)');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('❌ Seed échoué:', err);
    process.exit(1);
  }
}

seed();
