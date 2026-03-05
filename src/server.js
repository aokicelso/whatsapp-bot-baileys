import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let sock = null;
let qrCode = null;
let isConnected = false;
let initPromise = null;

// Inicializar Baileys
function initBaileys() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('🔄 Iniciando Baileys...');
      
      const sessionsDir = path.join(__dirname, '..', 'sessions');
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

      sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
      });

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('✅ QR Code gerado!');
          qrCode = qr;
        }

        if (connection === 'open') {
          console.log('✅ Conectado!');
          isConnected = true;
          qrCode = null;
        } else if (connection === 'close') {
          console.log('❌ Desconectado');
          isConnected = false;
          const shouldReconnect =
            (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;
          if (shouldReconnect) {
            initPromise = null;
            setTimeout(() => initBaileys(), 3000);
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);
      
      console.log('✅ Baileys pronto!');
    } catch (error) {
      console.error('❌ Erro:', error);
      initPromise = null;
      setTimeout(() => initBaileys(), 5000);
    }
  })();

  return initPromise;
}

// Iniciar Baileys imediatamente
initBaileys();

// Routes
app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', connected: isConnected });
});

app.get('/api/qr', async (req, res) => {
  try {
    if (isConnected) {
      return res.json({ status: 'connected' });
    }

    if (!qrCode) {
      return res.json({ status: 'waiting', message: 'Gerando QR Code...' });
    }

    const qrImage = await QRCode.toDataURL(qrCode);
    res.json({ status: 'pending', qr: qrImage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ connected: isConnected, qrCode: !!qrCode });
});

app.get('/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Bot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    h1 { color: #333; text-align: center; margin-bottom: 30px; }
    .status {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .status-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f44336;
      margin-right: 8px;
    }
    .status-dot.connected { background: #4caf50; }
    .status-text { font-size: 16px; font-weight: 600; color: #333; }
    #qrContainer {
      text-align: center;
      margin: 30px 0;
      display: none;
    }
    #qrImage {
      max-width: 300px;
      width: 100%;
      border: 2px solid #667eea;
      border-radius: 12px;
      padding: 10px;
    }
    button {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      background: #667eea;
      color: white;
    }
    button:hover { background: #5568d3; }
    .logs {
      background: #1e1e1e;
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      max-height: 150px;
      overflow-y: auto;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 WhatsApp Bot</h1>
    
    <div class="status">
      <span class="status-dot" id="dot"></span>
      <span class="status-text" id="text">Desconectado</span>
    </div>

    <div id="qrContainer">
      <h3>Escaneie o QR Code</h3>
      <img id="qrImage" src="" alt="QR">
    </div>

    <button onclick="refresh()">🔄 Atualizar QR</button>
    <button onclick="check()" style="background: #666;">✓ Status</button>

    <div class="logs" id="logs"></div>
  </div>

  <script>
    function log(msg) {
      const logs = document.getElementById('logs');
      logs.innerHTML += \`<div>[\${new Date().toLocaleTimeString()}] \${msg}</div>\`;
      logs.scrollTop = logs.scrollHeight;
    }

    async function check() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const dot = document.getElementById('dot');
        const text = document.getElementById('text');
        
        if (data.connected) {
          dot.className = 'status-dot connected';
          text.textContent = '✅ Conectado';
          log('Bot conectado!');
          document.getElementById('qrContainer').style.display = 'none';
        } else {
          dot.className = 'status-dot';
          text.textContent = '❌ Desconectado';
          log('Desconectado');
          refresh();
        }
      } catch (e) {
        log('Erro: ' + e.message);
      }
    }

    async function refresh() {
      try {
        log('Buscando QR...');
        const res = await fetch('/api/qr');
        const data = await res.json();
        
        if (data.status === 'pending') {
          document.getElementById('qrImage').src = data.qr;
          document.getElementById('qrContainer').style.display = 'block';
          log('QR gerado!');
        } else if (data.status === 'connected') {
          document.getElementById('qrContainer').style.display = 'none';
          log('Já conectado!');
          check();
        } else {
          log('Aguardando QR...');
        }
      } catch (e) {
        log('Erro: ' + e.message);
      }
    }

    window.addEventListener('load', () => {
      log('Página carregada');
      check();
      setInterval(check, 5000);
    });
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}/dashboard\n`);
});
