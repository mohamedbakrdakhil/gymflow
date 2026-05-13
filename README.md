# 💪 GymFlow — SaaS de gestion pour salles de sport au Maroc

> Plateforme **multi-tenant** complète pour gérer membres, abonnements, paiements, coachs et cours collectifs. 3 plans tarifaires adaptés au marché marocain.

[![Node](https://img.shields.io/badge/node-20%2B-green)]() [![License](https://img.shields.io/badge/license-UNLICENSED-red)]() [![Made in](https://img.shields.io/badge/made%20in-Morocco-red)]()

---

## ✨ Features

### Plan **Basique** (200 DH/mois)
- ✅ Gestion membres (CRUD complet, recherche, filtres, photos)
- ✅ Plans d'abonnement personnalisables
- ✅ Abonnements + alertes expiration automatiques (J-7, J-3, J-1)
- ✅ Paiements cash + génération **reçus PDF**
- ✅ Dashboard avec stats (membres, revenue, expirations)
- ✅ Export CSV membres
- ✅ Mobile-first responsive + dark mode

### Plan **Pro** (500 DH/mois) — tout Basique +
- ✅ **QR Code unique par membre** + scanner check-in
- ✅ Historique check-ins + résumé du jour
- ✅ **Notifications email + in-app** automatiques
- ✅ Paiement en ligne **Stripe** (intégration prête)
- ✅ Gestion **coachs** (création compte + spécialités)
- ✅ **Cours collectifs** + planning hebdomadaire
- ✅ Réservation membres + **liste d'attente automatique**
- ✅ **Programmes d'entraînement** digitaux
- ✅ Statistiques avancées avec **charts Recharts**

### Plan **Premium** (1500 DH/mois ou 15000 DH/an) — tout Pro +
- ✅ **White-label** (couleurs custom de la salle)
- ✅ Suivi **nutrition** (calories, macros)
- ✅ **Composition corporelle** (poids, IMC, mesures)
- ✅ Branding personnalisé sur reçus + emails
- ✅ Toutes les features Pro débloquées

---

## 🛠️ Stack technique

| Couche | Tech |
|---|---|
| **Backend** | Node.js 20+ • Express 4 • Sequelize 6 (MySQL 8) • JWT • bcrypt • Joi • Multer • node-cron • Nodemailer • PDFKit • qrcode |
| **Frontend** | React 18 • Vite 5 • Tailwind CSS 3 • shadcn/ui • TanStack Query • Axios • React Hook Form + Zod • Recharts • Lucide • Sonner |
| **Sécurité** | Helmet • CORS strict • Rate-limit (5/15min auth, 100/15min global) • bcrypt 12 rounds • JWT access 15min + refresh 7j |

---

## 📂 Architecture

```
gymflow/
├── backend/                  # API REST Express
│   ├── src/
│   │   ├── config/           # env, db, constants
│   │   ├── models/           # 13 modèles Sequelize
│   │   ├── middleware/       # auth, tenant, role, validate, error
│   │   ├── controllers/      # logique métier
│   │   ├── routes/           # routes Express
│   │   ├── validators/       # schémas Joi
│   │   ├── services/         # email, pdf, payment
│   │   ├── utils/            # logger, jwt, helpers
│   │   ├── jobs/             # cron (alertes expiration, billing SaaS)
│   │   ├── seeders/          # seed data
│   │   └── app.js
│   ├── uploads/              # fichiers uploadés (gitignored)
│   ├── .env.example
│   └── server.js
│
└── frontend/                 # SPA React/Vite
    ├── src/
    │   ├── components/       # ui (shadcn), layout, common, feature-specific
    │   ├── pages/            # auth, owner, coach, member, superadmin
    │   ├── context/          # AuthContext, ThemeContext
    │   ├── lib/              # api client, queryClient, utils
    │   └── App.jsx, main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── index.html
```

---

## 🚀 Installation

### Prérequis

- **Node.js ≥ 20** ([nvm](https://github.com/nvm-sh/nvm) recommandé)
- **MySQL ≥ 8.0** (local ou distant)
- **npm** (livré avec Node)

### 1. Cloner le repo

```bash
git clone <repo-url> gymflow
cd gymflow
```

### 2. Créer la base de données MySQL

```sql
CREATE DATABASE gymflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurer le backend

```bash
cd backend
cp .env.example .env
```

Édite `backend/.env` :

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ton_mdp_mysql
DB_NAME=gymflow

# ⚠️ IMPORTANT — Génère des secrets longs (min 64 caractères)
# Exemple: openssl rand -hex 64
JWT_SECRET=remplace_par_un_secret_long_aleatoire_min_64_chars
JWT_REFRESH_SECRET=remplace_par_un_autre_secret_long_aleatoire

FRONTEND_URL=http://localhost:5173

# (Optionnel) SMTP pour les emails — laisse vide en dev
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# (Optionnel) Stripe pour paiements en ligne
STRIPE_SECRET_KEY=
```

Installer + créer la DB + seed :

```bash
npm install
npm run db:seed   # ⚠️ DROP + recrée toutes les tables (force: true)
```

> Le seed crée 1 super admin, 2 salles (Pro + Basique trial), 2 coachs, 10 membres, plans, abonnements, paiements, check-ins, cours.

Démarrer le backend :

```bash
npm run dev       # avec nodemon
# ou
npm start         # production
```

✅ API disponible sur **http://localhost:5000/api**

### 4. Configurer le frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

✅ App disponible sur **http://localhost:5173**

---

## 🔑 Comptes de test (après `npm run db:seed`)

| Rôle | Email | Mot de passe | Note |
|------|-------|-------------|------|
| **Super admin** | `super@gymflow.ma` | `admin123` | Vue globale SaaS |
| **Owner Gym 1** | `owner1@example.ma` | `owner123` | Fitness Casa (Plan **Pro**) |
| **Coach Gym 1** | `coach1@example.ma` | `coach123` | Yassine Bennani |
| **Coach Gym 1** | `coach2@example.ma` | `coach123` | Salma Idrissi |
| **Owner Gym 2** | `owner2@example.ma` | `owner123` | Iron Gym Rabat (Plan **Basique** trial) |

⚠️ **Change ces mots de passe en production !**

---

## 🧪 Tests manuels

### Authentification

1. Va sur http://localhost:5173 → tu arrives sur la landing page
2. Clique **Créer ma salle** → multi-step form (3 étapes)
3. Crée une salle de test → tu es auto-redirigé vers le dashboard owner
4. Déconnecte-toi puis reconnecte-toi avec `owner1@example.ma / owner123`
5. Teste **Mot de passe oublié** (le lien est loggé en console si SMTP non configuré)

### Multi-tenant

1. Connecte-toi en `owner1@example.ma` → vois Fitness Casa
2. Logout → connecte-toi en `owner2@example.ma` → vois Iron Gym Rabat
3. Vérifie que tu ne vois PAS les membres de l'autre salle

### Membres CRUD

1. **Owner → Membres** → bouton "Nouveau membre" → remplis → crée
2. Cherche dans la barre de recherche (nom/téléphone/code)
3. Clique sur un membre → vois le détail + bouton "QR code"
4. **Export CSV** → télécharge le fichier
5. Crée un abonnement depuis la page détail membre

### Paiements + Reçus PDF

1. Crée un abonnement avec **Méthode de paiement = Espèces**
2. Va sur **Paiements** → vois le paiement créé
3. Clique sur **Reçu PDF** → télécharge le PDF (généré à la volée)

### Check-ins QR (Plan Pro uniquement)

1. Connecté en `owner1@example.ma` (Plan Pro)
2. **Owner → Check-ins**
3. Va sur un membre → "QR code" → copie le code (l'image SVG)
4. Retour à Check-ins → colle le code dans le champ "Scanner QR" → Enter
5. Vérifie que le check-in apparaît dans "Aujourd'hui"
6. Re-scan dans les 5 min → message "déjà enregistré"

### Coachs + Cours (Plan Pro)

1. **Owner → Coachs** → ajoute un coach
2. **Owner → Cours** → crée un cours (jour, horaire, capacité, assigner coach)
3. Logout → login en coach → vois le cours dans **Mes cours**

### White-label (Plan Premium uniquement)

1. En tant qu'owner Plan Premium, va sur **Paramètres → Branding**
2. Change la couleur primaire → toute l'interface change instantanément

### Feature gating

1. En tant qu'owner Plan Basique (`owner2@example.ma`)
2. La sidebar ne montre PAS les onglets Check-ins / Coachs / Cours
3. L'onglet Branding est désactivé

### Cron jobs

Pour tester manuellement les alertes (sans attendre 9h du matin) :

```bash
cd backend
node -e "require('dotenv').config(); require('./src/jobs/expirationAlerts')()"
```

---

## 📖 API Documentation

Format de réponse uniforme :

```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "errors": []
}
```

### Endpoints principaux

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| `POST` | `/api/auth/register-gym` | public | Inscription salle + owner |
| `POST` | `/api/auth/login` | public | Connexion |
| `POST` | `/api/auth/refresh-token` | public | Renouveler access token |
| `GET` | `/api/auth/me` | authenticated | Profil + gym courant |
| `GET` | `/api/dashboard/owner` | owner/coach | Stats agrégées |
| `GET` | `/api/members` | owner/coach | Liste paginée + recherche |
| `POST` | `/api/members` | owner | Créer membre |
| `GET` | `/api/members/:id/qr` | owner/coach | QR code data URL |
| `GET` | `/api/members/export` | owner/coach | Export CSV |
| `GET` | `/api/plans` | authenticated | Plans de la salle |
| `POST` | `/api/subscriptions` | owner | Créer abonnement (+ paiement optionnel) |
| `POST` | `/api/subscriptions/:id/freeze` | owner | Geler |
| `POST` | `/api/subscriptions/:id/unfreeze` | owner | Réactiver |
| `POST` | `/api/payments` | owner | Enregistrer paiement |
| `GET` | `/api/payments/:id/receipt` | owner | Générer/lire reçu PDF |
| `POST` | `/api/checkins/scan` | owner/coach | Scanner QR (Pro+) |
| `POST` | `/api/coaches` | owner | Créer coach (Pro+) |
| `POST` | `/api/classes` | owner | Créer cours (Pro+) |
| `POST` | `/api/classes/:id/book` | authenticated | Réserver (Pro+) |
| `POST` | `/api/programs` | owner/coach | Créer programme (Pro+) |
| `GET` | `/api/notifications` | authenticated | Mes notifications |
| `PUT` | `/api/gym/branding` | owner | Couleurs (Premium) |
| `GET` | `/api/superadmin/stats` | super_admin | MRR + gyms count |
| `PUT` | `/api/superadmin/gyms/:id/status` | super_admin | Suspendre/réactiver |

---

## 🗄️ Modèles de données (13 tables)

```
gyms                  ← tenant (chaque salle)
users                 ← comptes (super_admin, owner, coach, member)
members               ← adhérents (lié à user optionnellement)
plans                 ← formules d'abonnement
subscriptions         ← abonnements actifs/expirés/gelés
payments              ← paiements (cash, stripe, etc.)
check_ins             ← entrées QR/manuel
coaches               ← profil coach (lié à user)
classes               ← cours collectifs hebdo
class_bookings        ← réservations + waitlist
programs              ← programmes d'entraînement
notifications         ← notifs in-app
saas_subscriptions    ← abonnement de la salle au SaaS GymFlow
```

Toutes les tables ont `gym_id` (sauf `users` pour super_admin) → isolation tenant garantie.

---

## 🛡️ Sécurité

- **Multi-tenant** : `gym_id` filtre toutes les queries via le middleware `tenant.js`
- **JWT** : access token 15min, refresh 7j, stockés en localStorage côté client
- **Bcrypt** : 12 rounds pour les passwords
- **Rate-limit** : 5 req/15min sur auth, 100 req/15min global
- **Helmet** : headers HTTP sécurisés
- **CORS** : whitelist d'origines (`ALLOWED_ORIGINS` dans `.env`)
- **Joi/Zod** : validation backend + frontend
- **SQL injection** : prévenu par Sequelize (queries paramétrisées)
- **Reset password** : token hashé SHA-256 stocké en DB, valable 1h

---

## 📦 Scripts NPM

### Backend

```bash
npm run dev          # dev avec nodemon
npm start            # production
npm run db:sync      # créer/mettre à jour tables
npm run db:seed      # seed data (⚠️ DROP les tables !)
npm run db:reset     # reset complet + seed
```

### Frontend

```bash
npm run dev          # dev server (port 5173)
npm run build        # build production → dist/
npm run preview      # prévisualiser le build
```

---

## 🚧 Roadmap (extensions futures)

- [ ] Tests unitaires + intégration (Jest + Supertest)
- [ ] CI/CD GitHub Actions
- [ ] Dockerfile + docker-compose
- [ ] Scan QR via caméra (html5-qrcode)
- [ ] Notifications push (Firebase Cloud Messaging)
- [ ] Intégration CMI (paiement marocain)
- [ ] Chat in-app (Socket.io) — Premium
- [ ] App mobile React Native (Play Store / App Store)
- [ ] Multi-salles (chaînes) — Premium
- [ ] Analytics avancée (churn, LTV) — Premium
- [ ] API publique + webhooks — Premium

---

## 🤝 Architecture multi-tenant

Chaque salle (`Gym`) est un **tenant isolé** identifié par `gym_id` :

1. **Au login**, l'API retourne `{ user, gym, features }` — features dépendent du plan
2. **JWT contient** `gym_id` dans le payload
3. **Middleware `tenant.js`** charge `req.gym` et vérifie le statut (actif/suspendu)
4. **Tous les controllers** filtrent par `req.gymId` → impossible de voir les données d'une autre salle
5. **Feature gating** via `requireFeature('qrCheckIn')` qui lit `plan_type` du gym courant

---

## 📞 Support

- 📧 Pour les questions : ouvre une issue sur GitHub
- 🐛 Bug ? → joins les logs backend + frontend dans l'issue
- 💡 Suggestion ? → discussions ouvertes

---

**Made with 💪 in Morocco** • © 2026 GymFlow
