/**
 * GymFlow Mac Agent — contrôle ton Mac entier depuis Telegram
 * Lance ce script SUR TON MAC : node mac-agent.js
 */
const TelegramBot = require('node-telegram-bot-api');
const { exec, execSync } = require('child_process');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN || '8769733625:AAG3K0wkrTIh8TRItUH5sCgf9ZYccnmMVm0';

const bot = new TelegramBot(TOKEN, { polling: true });

const KB = {
  reply_markup: {
    keyboard: [
      ['📸 Screenshot', '🔊 Volume +', '🔉 Volume -'],
      ['🔇 Mute', '💤 Sleep Mac', '🔒 Lock Mac'],
      ['📂 Ouvre Finder', '🌐 Ouvre Chrome', '💻 Ouvre VSCode'],
      ['🎵 Play/Pause', '⏭ Next', '⏮ Previous'],
      ['📋 Clipboard', '🖥 Info Mac', '❓ Aide'],
    ],
    resize_keyboard: true,
  },
};

// ─── Execute shell ────────────────────────────────────────────────────────────

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: (stdout || stderr || '').trim(), code: err?.code });
    });
  });
}

function apple(script) {
  return run(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}

// ─── Screenshot ──────────────────────────────────────────────────────────────

async function takeScreenshot(chatId) {
  const file = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`);
  const res = await run(`screencapture -x ${file}`);
  if (res.ok && fs.existsSync(file)) {
    await bot.sendPhoto(chatId, file, { reply_markup: KB.reply_markup });
    fs.unlinkSync(file);
  } else {
    bot.sendMessage(chatId, '❌ Erreur screenshot', KB);
  }
}

// ─── Intent detection ────────────────────────────────────────────────────────

function detectIntent(text) {
  const t = text.toLowerCase().trim();

  if (/screenshot|capture|chashit|kapo|photo.?ecran|ecran/.test(t)) return 'screenshot';
  if (/(volume|son).?(haut|\+|up|zid)/.test(t) || t === '🔊 volume +') return 'vol_up';
  if (/(volume|son).?(bas|\-|down|nqs)/.test(t) || t === '🔉 volume -') return 'vol_down';
  if (/(mute|saket|صكت|silence)/.test(t) || t === '🔇 mute') return 'mute';
  if (/(sleep|neum|نعس|standby|veille)/.test(t) || t === '💤 sleep mac') return 'sleep';
  if (/(lock|verrou|قفل|hbs)/.test(t) || t === '🔒 lock mac') return 'lock';
  if (/(finder|fichiers|dossier|files)/.test(t) || t === '📂 ouvre finder') return 'open_finder';
  if (/(chrome|browser|navigateur|internet)/.test(t) || t === '🌐 ouvre chrome') return 'open_chrome';
  if (/(vscode|code|editeur|vs code)/.test(t) || t === '💻 ouvre vscode') return 'open_vscode';
  if (/(play|pause|music|musique|موسيقى)/.test(t) || t === '🎵 play/pause') return 'play_pause';
  if (/(next|suivant|التالي|hh)/.test(t) || t === '⏭ next') return 'next_track';
  if (/(prev|retour|السابق)/.test(t) || t === '⏮ previous') return 'prev_track';
  if (/(clipboard|presse.?papier|copié|copy)/.test(t) || t === '📋 clipboard') return 'clipboard';
  if (/(info|mac info|système|system|ram|cpu|كمبيوتر)/.test(t) || t === '🖥 info mac') return 'info';
  if (/(aide|help|commandes|menu|شنية|shniya)/.test(t) || t === '❓ aide') return 'help';
  if (/(salut|hello|salam|bonjour|hi|كيداير|labas)/.test(t)) return 'greeting';

  // Search queries
  const googleSearch = t.match(/(?:cherche|search|googl[eo]|trouve|ftah|بحث)\s+(?:sur\s+google\s+)?(.+)/);
  if (googleSearch && !t.includes('youtube') && !t.includes('spotify')) {
    const q = encodeURIComponent(googleSearch[1].replace(/^(sur\s+google|dans\s+google)\s*/i, ''));
    return { type: 'open_url', url: `https://www.google.com/search?q=${q}` };
  }

  const ytSearch = t.match(/(?:cherche|search|trouve|بحث)\s+(?:sur\s+youtube\s+)?(.+)\s+(?:sur\s+)?youtube/);
  const ytSearch2 = t.match(/youtube\s+(?:cherche|search|trouve|بحث)\s+(.+)/);
  const ytMatch = ytSearch || ytSearch2;
  if (ytMatch) {
    const q = encodeURIComponent((ytMatch[1] || '').trim());
    return { type: 'open_url', url: `https://www.youtube.com/search?q=${q}` };
  }

  // Common websites — direct
  const sites = {
    youtube: 'https://youtube.com',
    'you tube': 'https://youtube.com',
    google: 'https://google.com',
    gmail: 'https://gmail.com',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    whatsapp: 'https://web.whatsapp.com',
    netflix: 'https://netflix.com',
    spotify: 'https://open.spotify.com',
    github: 'https://github.com',
    chatgpt: 'https://chat.openai.com',
    claude: 'https://claude.ai',
    maps: 'https://maps.google.com',
  };
  for (const [name, url] of Object.entries(sites)) {
    if (t.includes(name)) return { type: 'open_url', url };
  }

  // Open any app
  const openMatch = t.match(/(?:ouvre|open|ftah|lance|start|mets|met|joue|va sur)\s+(.+)/);
  if (openMatch) return { type: 'open_app', app: openMatch[1] };

  // Write/type something
  const typeMatch = t.match(/(?:écris|type|kteb|اكتب)\s+(.+)/);
  if (typeMatch) return { type: 'type_text', text: typeMatch[1] };

  // Shell command
  if (t.startsWith('$') || t.startsWith('shell:') || t.startsWith('cmd:')) {
    return { type: 'shell', cmd: t.replace(/^\$|^shell:|^cmd:/, '').trim() };
  }

  // URL
  if (t.startsWith('http://') || t.startsWith('https://')) return { type: 'open_url', url: text.trim() };

  return 'unknown';
}

// ─── Message handler ─────────────────────────────────────────────────────────

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const reply = (t) => bot.sendMessage(chatId, t, KB);
  const intent = detectIntent(text);
  const intentType = typeof intent === 'string' ? intent : intent.type;

  switch (intentType) {

    case 'greeting':
      reply(`👋 Salam ! Je contrôle ton Mac maintenant.\n\nExemples :\n• "screenshot"\n• "ouvre Chrome"\n• "volume +"\n• "lock mac"\n• "$ ls ~/Desktop"\n• Ou n'importe quelle commande shell avec $`);
      break;

    case 'screenshot':
      reply('📸 Capture en cours...');
      await takeScreenshot(chatId);
      break;

    case 'vol_up':
      await run(`osascript -e 'set volume output volume (output volume of (get volume settings) + 10)'`);
      reply('🔊 Volume +10');
      break;

    case 'vol_down':
      await run(`osascript -e 'set volume output volume (output volume of (get volume settings) - 10)'`);
      reply('🔉 Volume -10');
      break;

    case 'mute':
      await run(`osascript -e 'set volume output muted true'`);
      reply('🔇 Muted');
      break;

    case 'sleep':
      reply('💤 Mac en veille...');
      await run(`pmset sleepnow`);
      break;

    case 'lock':
      await run(`osascript -e 'tell application "System Events" to keystroke "q" using {command down, control down}'`);
      reply('🔒 Mac verrouillé');
      break;

    case 'open_finder':
      await run(`open -a Finder`);
      reply('📂 Finder ouvert');
      break;

    case 'open_chrome':
      await run(`open -a 'Google Chrome'`);
      reply('🌐 Chrome ouvert');
      break;

    case 'open_vscode':
      await run(`open -a 'Visual Studio Code'`);
      reply('💻 VSCode ouvert');
      break;

    case 'play_pause':
      await apple(`tell application "System Events" to key code 49`);
      reply('🎵 Play/Pause');
      break;

    case 'next_track':
      await run(`osascript -e 'tell application "System Events" to key code 124 using {command down}'`);
      reply('⏭ Piste suivante');
      break;

    case 'prev_track':
      await run(`osascript -e 'tell application "System Events" to key code 123 using {command down}'`);
      reply('⏮ Piste précédente');
      break;

    case 'clipboard': {
      const res = await run(`pbpaste`);
      reply(`📋 Clipboard:\n${res.out || '(vide)'}`);
      break;
    }

    case 'info': {
      const [cpu, ram, disk, uptime] = await Promise.all([
        run(`sysctl -n machdep.cpu.brand_string`),
        run(`vm_stat | awk '/Pages active/ {print $3+0}'`),
        run(`df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}'`),
        run(`uptime | awk -F',' '{print $1}' | sed 's/.*up //'`),
      ]);
      reply(`🖥 *Info Mac*\nCPU: ${cpu.out}\nDisque: ${disk.out}\nUptime: ${uptime.out}`);
      break;
    }

    case 'open_app': {
      const appName = intent.app;
      const res = await run(`open -a '${appName}' 2>&1 || open '${appName}' 2>&1`);
      reply(res.ok ? `✅ ${appName} ouvert` : `❌ App "${appName}" introuvable`);
      break;
    }

    case 'type_text': {
      await apple(`tell application "System Events" to keystroke "${intent.text}"`);
      reply(`⌨️ Écrit: "${intent.text}"`);
      break;
    }

    case 'open_url': {
      await run(`open '${intent.url}'`);
      reply(`🌐 Ouverture: ${intent.url}`);
      break;
    }

    case 'shell': {
      reply(`⚙️ Exécution: \`${intent.cmd}\``);
      const res = await run(intent.cmd);
      const out = res.out || '(pas de sortie)';
      reply('```\n' + out.slice(0, 3500) + '\n```');
      break;
    }

    case 'help':
      reply(`🎮 *Commandes disponibles:*\n\n📸 screenshot — capture écran\n🔊/🔉 volume +/- — volume\n🔇 mute — silence\n💤 sleep — veille\n🔒 lock — verrouille\n📂 ouvre Finder\n🌐 ouvre Chrome\n💻 ouvre VSCode\n🎵 play/pause — musique\n📋 clipboard — voir presse-papiers\n🖥 info mac — infos système\n\n*Ouvrir n'importe quelle app:*\n"ouvre Spotify"\n"ouvre WhatsApp"\n\n*Shell (terminal):*\n$ ls ~/Desktop\n$ mkdir ~/test\n\n*Ouvrir un lien:*\nhttps://example.com\n\n*Écrire du texte:*\n"écris Bonjour"`);
      break;

    default:
      // Try as shell command directly
      reply(`🤔 Je comprends pas — j'essaie comme commande shell...`);
      const res = await run(text);
      if (res.ok && res.out) {
        reply('```\n' + res.out.slice(0, 3500) + '\n```');
      } else {
        reply(`❌ Pas compris. Essaie:\n• "screenshot"\n• "ouvre Chrome"\n• "$ ta_commande" pour shell\n• "aide" pour tout voir`);
      }
  }
});

bot.on('polling_error', err => console.error('Polling error:', err.message));

console.log(`
🤖 Mac Agent démarré !
   Ton Mac est maintenant contrôlable depuis Telegram.
   Envoie "screenshot" pour tester.
`);
