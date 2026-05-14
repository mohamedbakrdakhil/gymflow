/**
 * GymFlow Telegram Remote Controller
 * Envoie des commandes depuis ton téléphone → le bot les exécute sur le serveur
 */
const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.TELEGRAM_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID ? parseInt(process.env.TELEGRAM_CHAT_ID) : null;
const ROOT = path.join(__dirname, '..');

if (!TOKEN) {
  console.error('❌ TELEGRAM_TOKEN manquant. Lance avec: TELEGRAM_TOKEN=xxx node bot.js');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const procs = {};

// Security: only allow authorized chat
function isAuthorized(chatId) {
  if (!ALLOWED_CHAT_ID) return true; // open mode until first message sets it
  return chatId === ALLOWED_CHAT_ID;
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendChunked(chatId, text, options = {}) {
  const MAX = 4000;
  const clean = text.replace(/\x1b\[[0-9;]*m/g, '').trim();
  if (!clean) return;
  for (let i = 0; i < clean.length; i += MAX) {
    await bot.sendMessage(chatId, '`' + clean.slice(i, i + MAX) + '`', { parse_mode: 'MarkdownV2', ...options }).catch(() =>
      bot.sendMessage(chatId, clean.slice(i, i + MAX))
    );
  }
}

function runCommand(chatId, procId, cmd, cwd) {
  if (procs[procId]) {
    procs[procId].kill('SIGTERM');
    delete procs[procId];
  }

  bot.sendMessage(chatId, `▶ *${escapeMarkdown(procId)}*: \`${escapeMarkdown(cmd)}\``, { parse_mode: 'MarkdownV2' });

  const shell = spawn('bash', ['-c', cmd], {
    cwd: cwd ? path.join(ROOT, cwd) : ROOT,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  procs[procId] = shell;

  let buffer = '';
  let timer = null;

  const flush = () => {
    if (buffer.trim()) {
      sendChunked(chatId, buffer);
      buffer = '';
    }
  };

  const collect = (data) => {
    buffer += data.toString();
    clearTimeout(timer);
    timer = setTimeout(flush, 800);
  };

  shell.stdout.on('data', collect);
  shell.stderr.on('data', collect);

  shell.on('close', (code) => {
    clearTimeout(timer);
    flush();
    setTimeout(() => {
      bot.sendMessage(chatId, code === 0 ? '✅ Terminé avec succès' : `❌ Exit ${code}`);
      delete procs[procId];
    }, 1000);
  });

  shell.on('error', (e) => {
    bot.sendMessage(chatId, `❌ Erreur: ${e.message}`);
    delete procs[procId];
  });
}

// ─── Keyboard menus ─────────────────────────────────────────────────────────

const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      ['⚡ Start Frontend', '🔧 Start Backend'],
      ['⛔ Stop Frontend', '⛔ Stop Backend'],
      ['🛑 Stop Tout', '📊 Processus actifs'],
      ['🗄️ Sync DB', '🌱 Seed DB'],
      ['📋 Git Status', '📜 Git Log'],
      ['⬇️ Git Pull', '🔍 Git Diff'],
      ['❓ Aide'],
    ],
    resize_keyboard: true,
  },
};

const HELP_TEXT = `🎮 *GymFlow Remote Controller*

*Serveurs:*
⚡ Start Frontend — lance Vite dev server
🔧 Start Backend — lance Node.js backend
⛔ Stop Frontend/Backend — arrête le serveur
🛑 Stop Tout — kill tous les processus

*Base de données:*
🗄️ Sync DB — synchronise les modèles
🌱 Seed DB — insère les données de test
💥 Reset DB — /resetdb (demande confirmation)

*Git:*
📋 Git Status, 📜 Git Log, ⬇️ Git Pull, 🔍 Git Diff

*Commandes libres:*
Tape n'importe quelle commande shell, ex:
\`ls backend/src\`
\`cat backend/.env\`
\`cd frontend && npm run build\`

*Process:*
/kill <id> — stoppe un processus spécifique
/procs — liste les processus actifs`;

// ─── Message handler ─────────────────────────────────────────────────────────

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  // Auto-save first chat ID if not set
  if (!ALLOWED_CHAT_ID) {
    const envPath = path.join(__dirname, '.env');
    const envLine = `TELEGRAM_CHAT_ID=${chatId}\n`;
    fs.appendFileSync(envPath, envLine);
    console.log(`✅ Chat ID ${chatId} sauvegardé dans .env`);
  }

  if (!isAuthorized(chatId)) {
    bot.sendMessage(chatId, '⛔ Non autorisé.');
    return;
  }

  const send = (t) => bot.sendMessage(chatId, t, MAIN_MENU);

  // ── Boutons du menu ──
  switch (text) {
    case '/start':
    case '❓ Aide':
      bot.sendMessage(chatId, HELP_TEXT, { parse_mode: 'MarkdownV2', ...MAIN_MENU.reply_markup ? { reply_markup: MAIN_MENU.reply_markup } : {} });
      return;

    case '⚡ Start Frontend':
      runCommand(chatId, 'frontend', 'cd frontend && npm run dev -- --host 0.0.0.0 --port 5173', '');
      return;

    case '🔧 Start Backend':
      runCommand(chatId, 'backend', 'cd backend && npm run dev', '');
      return;

    case '⛔ Stop Frontend':
      if (procs['frontend']) { procs['frontend'].kill('SIGTERM'); delete procs['frontend']; }
      send('🛑 Frontend arrêté');
      return;

    case '⛔ Stop Backend':
      if (procs['backend']) { procs['backend'].kill('SIGTERM'); delete procs['backend']; }
      send('🛑 Backend arrêté');
      return;

    case '🛑 Stop Tout':
      Object.keys(procs).forEach((k) => { procs[k].kill('SIGTERM'); delete procs[k]; });
      send('🛑 Tous les processus arrêtés');
      return;

    case '📊 Processus actifs': {
      const running = Object.keys(procs);
      send(running.length ? `⚡ Actifs: ${running.join(', ')}` : 'Aucun processus en cours');
      return;
    }

    case '🗄️ Sync DB':
      runCommand(chatId, 'db-sync', 'cd backend && npm run db:sync', '');
      return;

    case '🌱 Seed DB':
      runCommand(chatId, 'db-seed', 'cd backend && npm run db:seed', '');
      return;

    case '📋 Git Status':
      runCommand(chatId, 'git', 'git status', '');
      return;

    case '📜 Git Log':
      runCommand(chatId, 'git', 'git log --oneline -15', '');
      return;

    case '⬇️ Git Pull':
      runCommand(chatId, 'git', 'git pull origin claude/check-website-K7ljp', '');
      return;

    case '🔍 Git Diff':
      runCommand(chatId, 'git', 'git diff --stat', '');
      return;
  }

  // ── Commandes slash ──
  if (text.startsWith('/kill ')) {
    const id = text.slice(6).trim();
    if (procs[id]) { procs[id].kill('SIGTERM'); delete procs[id]; send(`🛑 ${id} arrêté`); }
    else send(`Processus "${id}" introuvable`);
    return;
  }

  if (text === '/procs') {
    const running = Object.keys(procs);
    send(running.length ? `⚡ Actifs: ${running.join(', ')}` : 'Aucun processus en cours');
    return;
  }

  if (text === '/resetdb') {
    runCommand(chatId, 'db-reset', 'cd backend && npm run db:reset', '');
    return;
  }

  if (text.startsWith('/')) {
    // ignore other slash commands
    return;
  }

  // ── Commande shell libre ──
  runCommand(chatId, 'custom-' + Date.now(), text, '');
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('\n🤖 GymFlow Telegram Bot démarré!');
console.log('   Envoie /start à ton bot depuis Telegram\n');
