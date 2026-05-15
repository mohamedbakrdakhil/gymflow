/**
 * GymFlow Telegram Bot — Claude Code Remote Controller
 * Messages → Claude Code → Réponses → Telegram
 */
const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) { console.error('❌ TELEGRAM_TOKEN manquant'); process.exit(1); }

const INBOX  = '/tmp/gymflow_inbox.txt';
const OUTBOX = '/tmp/gymflow_outbox.txt';
const ROOT   = path.join(__dirname, '..');

const bot = new TelegramBot(TOKEN, { polling: true });
const procs = {};

// ensure files exist
fs.writeFileSync(INBOX,  '', { flag: 'a' });
fs.writeFileSync(OUTBOX, '', { flag: 'a' });

// ─── Keyboard ─────────────────────────────────────────────────────────────────

const KB = {
  reply_markup: {
    keyboard: [
      ['⚡ Start Frontend', '🔧 Start Backend'],
      ['⛔ Stop Tout', '📊 Status'],
      ['🗄️ Sync DB', '🌱 Seed DB'],
      ['📋 Git Status', '⬇️ Git Pull'],
      ['🤖 Claude — commande libre'],
    ],
    resize_keyboard: true,
  },
};

// ─── Shell runner ─────────────────────────────────────────────────────────────

function runShell(chatId, procId, cmd, cwd) {
  if (procs[procId]) { procs[procId].kill('SIGTERM'); delete procs[procId]; }
  bot.sendMessage(chatId, `▶ \`${procId}\``, { parse_mode: 'Markdown', reply_markup: KB.reply_markup });

  const shell = spawn('bash', ['-c', cmd], {
    cwd: cwd ? path.join(ROOT, cwd) : ROOT,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  procs[procId] = shell;

  let buf = '', timer;
  const flush = () => {
    const out = buf.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (out) bot.sendMessage(chatId, '```\n' + out.slice(0, 3500) + '\n```', { parse_mode: 'Markdown', reply_markup: KB.reply_markup });
    buf = '';
  };
  const collect = d => { buf += d; clearTimeout(timer); timer = setTimeout(flush, 900); };

  shell.stdout.on('data', collect);
  shell.stderr.on('data', collect);
  shell.on('close', code => {
    clearTimeout(timer); flush();
    setTimeout(() => {
      bot.sendMessage(chatId, code === 0 ? '✅ Terminé !' : `❌ Exit ${code}`, { reply_markup: KB.reply_markup });
      delete procs[procId];
    }, 1000);
  });
}

// ─── Poll outbox — Claude's responses ────────────────────────────────────────

let lastOutboxSize = 0;

function pollOutbox(chatId) {
  setInterval(() => {
    try {
      const content = fs.readFileSync(OUTBOX, 'utf8');
      if (content.length > lastOutboxSize) {
        const newContent = content.slice(lastOutboxSize).trim();
        lastOutboxSize = content.length;
        if (newContent && chatId) {
          // Split by delimiter and send each chunk
          const parts = newContent.split('<<<END>>>').filter(p => p.trim());
          parts.forEach(part => {
            bot.sendMessage(chatId, part.trim(), { reply_markup: KB.reply_markup, parse_mode: 'Markdown' })
              .catch(() => bot.sendMessage(chatId, part.trim(), { reply_markup: KB.reply_markup }));
          });
        }
      }
    } catch (_) {}
  }, 1000);
}

// ─── Intent detection ────────────────────────────────────────────────────────

function detectIntent(text) {
  const t = text.toLowerCase().trim();
  if (/^(salut|hello|hi|salam|bonjour|ola|hey|كيداير|labas|cava)/.test(t)) return 'greeting';
  if (/(start|lance|dkhl|شغل).*(front|site|web|vite)/.test(t) || t === '⚡ start frontend') return 'start_frontend';
  if (/(start|lance|dkhl|شغل).*(back|server|api|node)/.test(t) || t === '🔧 start backend') return 'start_backend';
  if (/(stop|wqef|arrête|وقف|kill)/.test(t) || t === '⛔ stop tout') return 'stop_all';
  if (/(status|حال|marche|actif|running)/.test(t) || t === '📊 status') return 'status';
  if (/(git status|git stat)/.test(t) || t === '📋 git status') return 'git_status';
  if (/(git pull|pull|sync code|mise.?à.?jour)/.test(t) || t === '⬇️ git pull') return 'git_pull';
  if (/(sync.?db|db.?sync)/.test(t) || t === '🗄️ sync db') return 'db_sync';
  if (/(seed|données.?test)/.test(t) || t === '🌱 seed db') return 'db_seed';
  if (/(aide|help|quoi faire|commandes|menu)/.test(t)) return 'help';
  if (t === '🤖 claude — commande libre') return 'claude_mode';
  return 'claude'; // tout le reste → Claude Code
}

// ─── Message handler ─────────────────────────────────────────────────────────

let activeChatId = null;
let claudeMode = false;

bot.on('message', msg => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!activeChatId) { activeChatId = chatId; pollOutbox(chatId); }

  const reply = t => bot.sendMessage(chatId, t, KB);
  const intent = detectIntent(text);

  switch (intent) {
    case 'greeting':
      reply(`👋 Salam ! Je suis ton remote controller GymFlow.\n\n🤖 *Mode Claude* : appuie sur le bouton "Claude — commande libre" ou écris directement ce que tu veux que je fasse :\n• "zid login page"\n• "sali bug dial dashboard"\n• "chouf le code de MembersList"\n• "start le site"\n\nJe comprends le darija, français et anglais !`);
      break;

    case 'start_frontend':
      runShell(chatId, 'frontend', 'cd frontend && npm run dev -- --host 0.0.0.0 --port 5173', '');
      break;

    case 'start_backend':
      runShell(chatId, 'backend', 'cd backend && npm run dev', '');
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
      runShell(chatId, 'git', 'git status', '');
      break;

    case 'git_pull':
      runShell(chatId, 'git', 'git pull origin claude/check-website-K7ljp', '');
      break;

    case 'db_sync':
      runShell(chatId, 'db', 'cd backend && npm run db:sync', '');
      break;

    case 'db_seed':
      runShell(chatId, 'db', 'cd backend && npm run db:seed', '');
      break;

    case 'claude_mode':
      claudeMode = true;
      reply('🤖 Mode Claude activé ! Écris ce que tu veux que je fasse — je vais le recevoir et exécuter directement.');
      break;

    case 'help':
      reply(`🎮 *GymFlow Remote*\n\n*Boutons :*\n⚡ Start Frontend\n🔧 Start Backend\n⛔ Stop Tout\n📊 Status\n🗄️ Sync DB / 🌱 Seed DB\n📋 Git Status / ⬇️ Git Pull\n\n*Mode Claude 🤖 :*\nÉcris n'importe quelle instruction en darija/français/anglais et Claude l'exécute :\n"zid une page contact"\n"sali bug dial login"\n"chouf les erreurs"\n"refactor MembersList"`);
      break;

    case 'claude':
    default:
      // Forward to Claude Code via inbox file
      bot.sendMessage(chatId, `📨 Message envoyé à Claude...\n\n_"${text}"_`, { parse_mode: 'Markdown', reply_markup: KB.reply_markup });
      const entry = `[${new Date().toISOString()}] CHATID:${chatId} MSG:${text}\n`;
      fs.appendFileSync(INBOX, entry);
      break;
  }
});

bot.on('polling_error', err => console.error('Polling error:', err.message));

console.log('\n🤖 GymFlow Bot — Mode Claude Remote\n');
console.log(`   Inbox:  ${INBOX}`);
console.log(`   Outbox: ${OUTBOX}\n`);
