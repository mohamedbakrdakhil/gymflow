const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ROOT = path.join(__dirname, '..');
const PANEL_SECRET = process.env.PANEL_SECRET || 'gymflow2024';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth check
app.use('/api', (req, res, next) => {
  const token = req.headers['x-panel-token'] || req.query.token;
  if (token !== PANEL_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// Running processes registry
const procs = {};

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

function runCommand(id, cmd, cwd, ws) {
  if (procs[id]) {
    procs[id].kill();
    delete procs[id];
  }

  const shell = spawn('bash', ['-c', cmd], { cwd, env: { ...process.env, FORCE_COLOR: '0' } });
  procs[id] = shell;

  const send = (type, data) => {
    const msg = JSON.stringify({ type, id, data });
    if (ws && ws.readyState === 1) ws.send(msg);
    broadcast({ type, id, data });
  };

  send('start', `▶ ${cmd}\n`);

  shell.stdout.on('data', (d) => send('out', d.toString()));
  shell.stderr.on('data', (d) => send('err', d.toString()));
  shell.on('close', (code) => {
    send('done', `\n✅ Exit ${code}\n`);
    delete procs[id];
  });
  shell.on('error', (e) => {
    send('err', `\n❌ Error: ${e.message}\n`);
    delete procs[id];
  });
}

// API endpoints
app.post('/api/run', (req, res) => {
  const { id, cmd, cwd } = req.body;
  if (!id || !cmd) return res.status(400).json({ error: 'id and cmd required' });
  const workDir = cwd ? path.join(ROOT, cwd) : ROOT;
  runCommand(id, cmd, workDir);
  res.json({ ok: true, id });
});

app.post('/api/kill', (req, res) => {
  const { id } = req.body;
  if (id && procs[id]) {
    procs[id].kill('SIGTERM');
    delete procs[id];
    broadcast({ type: 'killed', id, data: `\n🛑 Process ${id} killed\n` });
    return res.json({ ok: true });
  }
  // kill all
  Object.keys(procs).forEach((k) => {
    procs[k].kill('SIGTERM');
    delete procs[k];
  });
  broadcast({ type: 'killed', id: 'all', data: '\n🛑 All processes killed\n' });
  res.json({ ok: true });
});

app.get('/api/status', (req, res) => {
  res.json({ running: Object.keys(procs), secret: PANEL_SECRET });
});

// WebSocket with auth
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  if (token !== PANEL_SECRET) {
    ws.send(JSON.stringify({ type: 'err', data: 'Unauthorized' }));
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: 'out', id: 'sys', data: '🔗 Connected to GymFlow Remote Panel\n' }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.action === 'run') runCommand(msg.id, msg.cmd, path.join(ROOT, msg.cwd || ''), ws);
      if (msg.action === 'kill') {
        if (procs[msg.id]) { procs[msg.id].kill(); delete procs[msg.id]; }
        ws.send(JSON.stringify({ type: 'killed', id: msg.id, data: `🛑 Killed ${msg.id}\n` }));
      }
    } catch (_) {}
  });
});

const PORT = process.env.PANEL_PORT || 7070;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 GymFlow Remote Panel started`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://192.0.2.2:${PORT}`);
  console.log(`   Secret:  ${PANEL_SECRET}\n`);
});
