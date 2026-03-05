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
let qrCode = 'TEST_QR_CODE_PLACEHOLDER'; // QR de teste inicial
let isConnected = false;
let baileyInitialized = false;

// Inicializar Baileys em background
setTimeout(async () => {
  try {
    console.log('🔄 Iniciando Baileys em background...');
    
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
        console.log('✅ QR Code real gerado!');
        qrCode = qr;
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp conectado!');
        isConnected = true;
        qrCode = null;
      } else if (connection === 'close') {
        console.log('❌ Desconectado');
        isConnected = false;
        const shouldReconnect =
          (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        if (shouldReconnect) {
          setTimeout(() => {
            sock = null;
            // Retry
          }, 3000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
    baileyInitialized = true;
    console.log('✅ Baileys inicializado!');
  } catch (error) {
    console.error('❌ Erro ao inicializar Baileys:', error.message);
  }
}, 1000);

// Routes
app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', connected: isConnected, baileyReady: baileyInitialized });
});

app.get('/api/qr', async (req, res) => {
  try {
    if (isConnected) {
      return res.json({ status: 'connected' });
    }

    if (!qrCode) {
      return res.json({ status: 'waiting' });
    }

    const qrImage = await QRCode.toDataURL(qrCode);
    res.json({ status: 'pending', qr: qrImage });
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ 
    connected: isConnected, 
    qrCode: !!qrCode,
    baileyReady: baileyInitialized
  });
});

app.get('/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Bot - Investindo do Zero</title>
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
    h1 { 
      color: #333; 
      text-align: center; 
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
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
      animation: pulse 2s infinite;
    }
    .status-dot.connected { 
      background: #4caf50;
      animation: none;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .status-text { 
      font-size: 16px; 
      font-weight: 600; 
      color: #333; 
    }
    #qrContainer {
      text-align: center;
      margin: 30px 0;
      display: none;
    }
    #qrContainer h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 16px;
    }
    #qrImage {
      max-width: 300px;
      width: 100%;
      border: 3px solid #667eea;
      border-radius: 12px;
      padding: 10px;
      background: white;
    }
    .instructions {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #1565c0;
      text-align: left;
    }
    .instructions ol {
      margin-left: 20px;
      margin-top: 10px;
    }
    .instructions li {
      margin: 5px 0;
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
      transition: all 0.3s ease;
    }
    button:hover { 
      background: #5568d3;
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    .logs {
      background: #1e1e1e;
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      max-height: 150px;
      overflow-y: auto;
      margin-top: 20px;
      line-height: 1.4;
    }
    .log-entry {
      margin: 3px 0;
    }
    .log-entry.error { color: #ff6b6b; }
    .log-entry.success { color: #51cf66; }
    .log-entry.info { color: #74c0fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 WhatsApp Bot</h1>
    <div class="subtitle">Investindo do Zero</div>
    
    <div class="status">
      <span class="status-dot" id="dot"></span>
      <span class="status-text" id="text">Desconectado</span>
    </div>

    <div id="qrContainer">
      <h3>📱 Escaneie o QR Code</h3>
      <img id="qrImage" src="" alt="QR Code">
      <div class="instructions">
        <strong>Como conectar seu WhatsApp:</strong>
        <ol>
          <li>Abra WhatsApp no iPhone</li>
          <li>Configurações → Dispositivos Conectados</li>
          <li>Conectar um Dispositivo</li>
          <li>Aponte a câmera para este QR Code</li>
          <li>Autorize a conexão</li>
        </ol>
      </div>
    </div>

    <button onclick="refresh()">🔄 Atualizar QR</button>
    <button onclick="check()" style="background: #666;">✓ Verificar Status</button>

    <div class="logs" id="logs"></div>
  </div>

  <script>
    function log(msg, type = 'info') {
      const logs = document.getElementById('logs');
      const entry = document.createElement('div');
      entry.className = \`log-entry \${type}\`;
      entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
      logs.appendChild(entry);
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
          log('Bot conectado com sucesso!', 'success');
          document.getElementById('qrContainer').style.display = 'none';
        } else {
          dot.className = 'status-dot';
          text.textContent = '❌ Desconectado';
          log('Aguardando conexão...', 'info');
          refresh();
        }
      } catch (e) {
        log('Erro: ' + e.message, 'error');
      }
    }

    async function refresh() {
      try {
        log('Buscando QR Code...', 'info');
        const res = await fetch('/api/qr');
        const data = await res.json();
        
        if (data.status === 'pending') {
          document.getElementById('qrImage').src = data.qr;
          document.getElementById('qrContainer').style.display = 'block';
          log('QR Code gerado! Escaneie agora.', 'success');
        } else if (data.status === 'connected') {
          document.getElementById('qrContainer').style.display = 'none';
          log('Bot já está conectado!', 'success');
        } else {
          log('Aguardando QR Code...', 'info');
          setTimeout(refresh, 2000);
        }
      } catch (e) {
        log('Erro: ' + e.message, 'error');
      }
    }

    window.addEventListener('load', () => {
      log('Sistema iniciado. Carregando...', 'info');
      check();
      setInterval(check, 3000);
    });
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(\`\n✅ Servidor rodando em http://localhost:\${PORT}/dashboard\n\`);
});
