/**
 * GymFlow Telegram Remote Controller — version intelligente
 * Comprend le français, le darija et l'anglais
 */
const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) { console.error('❌ TELEGRAM_TOKEN manquant'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
const ROOT = path.join(__dirname, '..');
const procs = {};

// ─── Keyboard ────────────────────────────────────────────────────────────────

const KEYBOARD = {
  reply_markup: {
    keyboard: [
      ['⚡ Start Frontend', '🔧 Start Backend'],
      ['⛔ Stop Frontend', '⛔ Stop Backend'],
      ['🛑 Stop Tout', '📊 Status'],
      ['🗄️ Sync DB', '🌱 Seed DB'],
      ['📋 Git Status', '📜 Git Log'],
      ['⬇️ Git Pull', '🔍 Git Diff'],
      ['❓ Aide'],
    ],
    resize_keyboard: true,
  },
};

// ─── Intent detection ────────────────────────────────────────────────────────

function detectIntent(text) {
  const t = text.toLowerCase().trim();

  // Greetings
  if (/^(salut|hello|hi|salam|bonjour|ola|hey|cava|ça va|كيداير|labas)/.test(t))
    return 'greeting';

  // Start frontend
  if (/(start|lance|dkhl|ftech|ouvre|open|démarre|شغل).*(front|site|web|vite|ui|interface)/.test(t) ||
      /(front|site|web|vite).*(start|lance|dkhl|run|شغل)/.test(t) ||
      t === 'frontend' || t === 'start frontend' || t === '⚡ start frontend')
    return 'start_frontend';

  // Start backend
  if (/(start|lance|dkhl|ftech|démarre|شغل).*(back|server|api|node|serveur)/.test(t) ||
      /(back|server|api|node).*(start|lance|run|شغل)/.test(t) ||
      t === 'backend' || t === 'start backend' || t === '🔧 start backend')
    return 'start_backend';

  // Start both
  if (/(start|lance|démarre|شغل).*(tout|all|les deux|كلشي)/.test(t) ||
      /(tout|all|كلشي).*(start|lance|شغل)/.test(t))
    return 'start_all';

  // Stop frontend
  if (/(stop|wqef|arret|kill|arrête|وقف).*(front|site|web|vite)/.test(t) ||
      t === '⛔ stop frontend')
    return 'stop_frontend';

  // Stop backend
  if (/(stop|wqef|arret|kill|arrête|وقف).*(back|server|api|node)/.test(t) ||
      t === '⛔ stop backend')
    return 'stop_backend';

  // Stop all
  if (/^(stop|wqef|arret|arrête|وقف)$/.test(t) ||
      /(stop|wqef|arrête).*(tout|all|كلشي)/.test(t) ||
      t === '🛑 stop tout')
    return 'stop_all';

  // Status
  if (/(status|état|statut|حال|kif|kifash|running|actif|marche)/.test(t) ||
      t === '📊 status')
    return 'status';

  // Git status
  if (/(git status|git stat|changes|modif)/.test(t) || t === '📋 git status')
    return 'git_status';

  // Git log
  if (/(git log|historique|commits|log)/.test(t) || t === '📜 git log')
    return 'git_log';

  // Git pull
  if (/(git pull|pull|sync|synchronis|mise.?à.?jour|update)/.test(t) || t === '⬇️ git pull')
    return 'git_pull';

  // Git diff
  if (/(git diff|diff|differences|changements)/.test(t) || t === '🔍 git diff')
    return 'git_diff';

  // DB sync
  if (/(sync.?db|db.?sync|synchronis.*base|base.*sync)/.test(t) || t === '🗄️ sync db')
    return 'db_sync';

  // DB seed
  if (/(seed|données.?test|fake.?data|data.*seed)/.test(t) || t === '🌱 seed db')
    return 'db_seed';

  // DB reset
  if (/(reset.?db|db.?reset|supprime.*base|recré.*base)/.test(t))
    return 'db_reset';

  // Help
  if (/(aide|help|quoi|comment|commandes|menu|كيفاش|shniya|شنية)/.test(t) || t === '❓ aide')
    return 'help';

  // Logs
  if (/(log|sortie|output|affiche|montre|show)/.test(t))
    return 'show_logs';

  return 'unknown';
}

// ─── Run shell command ────────────────────────────────────────────────────────

function runCommand(chatId, procId, cmd, cwd) {
  if (procs[procId]) { procs[procId].kill('SIGTERM'); delete procs[procId]; }

  bot.sendMessage(chatId, `▶ *${procId}*`, { parse_mode: 'Markdown', ...KEYBOARD.reply_markup ? { reply_markup: KEYBOARD.reply_markup } : {} });

  const shell = spawn('bash', ['-c', cmd], {
    cwd: cwd ? path.join(ROOT, cwd) : ROOT,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  procs[procId] = shell;

  let buffer = '';
  let timer = null;

  const flush = () => {
    const clean = buffer.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (clean) bot.sendMessage(chatId, '```\n' + clean.slice(0, 3800) + '\n```', { parse_mode: 'Markdown', reply_markup: KEYBOARD.reply_markup });
    buffer = '';
  };

  const collect = (d) => {
    buffer += d.toString();
    clearTimeout(timer);
    timer = setTimeout(flush, 900);
  };

  shell.stdout.on('data', collect);
  shell.stderr.on('data', collect);
  shell.on('close', (code) => {
    clearTimeout(timer);
    flush();
    setTimeout(() => {
      bot.sendMessage(chatId, code === 0 ? '✅ Terminé !' : `❌ Erreur (exit ${code})`, { reply_markup: KEYBOARD.reply_markup });
      delete procs[procId];
    }, 1000);
  });
}

// ─── Message handler ─────────────────────────────────────────────────────────

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const intent = detectIntent(text);

  const reply = (t) => bot.sendMessage(chatId, t, KEYBOARD);

  switch (intent) {

    case 'greeting':
      reply(`👋 Salut ! Je suis le remote controller de GymFlow.\n\nUtilise les boutons en bas, ou écris par exemple :\n• "lance le site"\n• "stop tout"\n• "git status"\n• "sync db"`);
      break;

    case 'start_frontend':
      runCommand(chatId, 'frontend', 'cd frontend && npm run dev -- --host 0.0.0.0 --port 5173', '');
      break;

    case 'start_backend':
      runCommand(chatId, 'backend', 'cd backend && npm run dev', '');
      break;

    case 'start_all':
      runCommand(chatId, 'frontend', 'cd frontend && npm run dev -- --host 0.0.0.0 --port 5173', '');
      setTimeout(() => runCommand(chatId, 'backend', 'cd backend && npm run dev', ''), 2000);
      break;

    case 'stop_frontend':
      if (procs['frontend']) { procs['frontend'].kill('SIGTERM'); delete procs['frontend']; }
      reply('⛔ Frontend arrêté');
      break;

    case 'stop_backend':
      if (procs['backend']) { procs['backend'].kill('SIGTERM'); delete procs['backend']; }
      reply('⛔ Backend arrêté');
      break;

    case 'stop_all':
      Object.keys(procs).forEach(k => { procs[k].kill('SIGTERM'); delete procs[k]; });
      reply('🛑 Tout arrêté');
      break;

    case 'status': {
      const running = Object.keys(procs);
      reply(running.length ? `⚡ En cours : ${running.join(', ')}` : '😴 Aucun processus actif');
      break;
    }

    case 'git_status':
      runCommand(chatId, 'git', 'git status', '');
      break;

    case 'git_log':
      runCommand(chatId, 'git', 'git log --oneline -15', '');
      break;

    case 'git_pull':
      runCommand(chatId, 'git', 'git pull origin claude/check-website-K7ljp', '');
      break;

    case 'git_diff':
      runCommand(chatId, 'git', 'git diff --stat', '');
      break;

    case 'db_sync':
      runCommand(chatId, 'db-sync', 'cd backend && npm run db:sync', '');
      break;

    case 'db_seed':
      runCommand(chatId, 'db-seed', 'cd backend && npm run db:seed', '');
      break;

    case 'db_reset':
      reply('⚠️ Tu es sûr ? Réponds "oui reset db" pour confirmer');
      break;

    case 'show_logs':
      reply(Object.keys(procs).length
        ? `📊 Processus actifs : ${Object.keys(procs).join(', ')}\nLes logs arrivent en temps réel dans ce chat.`
        : '😴 Aucun processus actif. Lance un serveur d\'abord.');
      break;

    case 'help':
      reply(`🎮 *GymFlow Remote*\n\n*Boutons disponibles :*\n⚡ Start Frontend — lance le site web\n🔧 Start Backend — lance l'API\n⛔ Stop — arrête un serveur\n🛑 Stop Tout — tout arrêter\n📊 Status — processus actifs\n🗄️ Sync DB — sync base de données\n🌱 Seed DB — données de test\n📋 Git Status / Log / Pull / Diff\n\n*Ou écris en français/darija :*\n"lance le site", "stop tout", "sync db", "git pull"...`);
      break;

    default:
      // Commande spéciale confirmée
      if (text.toLowerCase() === 'oui reset db') {
        runCommand(chatId, 'db-reset', 'cd backend && npm run db:reset', '');
        return;
      }
      reply(`🤔 Je n'ai pas compris "${text}".\n\nEssaie les boutons du menu, ou écris :\n• "lance le site"\n• "stop tout"\n• "git status"\n• "aide" pour la liste complète`);
  }
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));

console.log('\n🤖 GymFlow Bot démarré — version intelligente\n');
