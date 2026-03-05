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

// Middleware
app.use(cors());
app.use(express.json());

// Global variables
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';

// Initialize Baileys
async function initBaileys() {
  try {
    console.log('🔄 Inicializando Baileys...');
    
    const sessionsDir = path.join(__dirname, '..', 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
      shouldIgnoreJid: (jid) => false,
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('✅ QR Code gerado!');
        qrCode = qr;
        connectionStatus = 'qr_pending';
      }

      if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        connectionStatus = 'connected';
        qrCode = null;
      } else if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log('❌ Desconectado. Reconectando:', shouldReconnect);
        connectionStatus = 'disconnected';

        if (shouldReconnect) {
          setTimeout(() => initBaileys(), 3000);
        }
      }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    console.log('✅ Baileys inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar Baileys:', error);
    setTimeout(() => initBaileys(), 5000);
  }
}

// Start Baileys
initBaileys();

// Routes

// Root
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connection: connectionStatus,
    timestamp: new Date().toISOString()
  });
});

// Get QR Code
app.get('/api/qr', async (req, res) => {
  try {
    if (!qrCode) {
      return res.json({
        status: connectionStatus === 'connected' ? 'connected' : 'waiting',
        message: connectionStatus === 'connected' ? 'Bot conectado' : 'Aguardando QR Code...'
      });
    }

    const qrImage = await QRCode.toDataURL(qrCode);
    res.json({
      status: 'pending',
      qr: qrImage,
      text: qrCode
    });
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// Get status
app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    timestamp: new Date().toISOString()
  });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  const html = `
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
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; }
        .status-box {
            background: #f5f5f5;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            background: #f44336;
        }
        .status-indicator.connected { background: #4caf50; }
        .status-text { font-size: 16px; font-weight: 600; color: #333; }
        .qr-container {
            text-align: center;
            margin: 30px 0;
        }
        .qr-container h3 { color: #333; margin-bottom: 20px; font-size: 16px; }
        #qrImage {
            max-width: 300px;
            width: 100%;
            border: 2px solid #667eea;
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
            font-size: 14px;
            color: #1565c0;
        }
        button {
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            background: #667eea;
            color: white;
            transition: all 0.3s ease;
        }
        button:hover { background: #5568d3; transform: translateY(-2px); }
        .logs {
            background: #1e1e1e;
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 20px;
        }
        .log-entry { margin: 5px 0; }
        .log-entry.error { color: #ff6b6b; }
        .log-entry.success { color: #51cf66; }
        .log-entry.info { color: #74c0fc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 WhatsApp Bot</h1>
            <p>Investindo do Zero</p>
        </div>

        <div class="status-box">
            <span class="status-indicator" id="statusIndicator"></span>
            <span class="status-text" id="statusText">Desconectado</span>
        </div>

        <div class="qr-container" id="qrContainer" style="display: none;">
            <h3>📱 Escaneie o QR Code</h3>
            <img id="qrImage" src="" alt="QR Code">
            <div class="instructions">
                <strong>Como conectar:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Abra WhatsApp no iPhone</li>
                    <li>Configurações → Dispositivos Conectados</li>
                    <li>Conectar um Dispositivo</li>
                    <li>Aponte para este QR Code</li>
                </ol>
            </div>
        </div>

        <button onclick="refreshQR()">🔄 Atualizar QR</button>
        <button onclick="checkStatus()" style="background: #666;">✓ Verificar Status</button>

        <div class="logs" id="logs">
            <div class="log-entry info">Sistema iniciado...</div>
        </div>
    </div>

    <script>
        function addLog(msg, type = 'info') {
            const logs = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
            logs.appendChild(entry);
            logs.scrollTop = logs.scrollHeight;
        }

        async function checkStatus() {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                
                const indicator = document.getElementById('statusIndicator');
                const statusText = document.getElementById('statusText');
                
                if (data.connected) {
                    indicator.className = 'status-indicator connected';
                    statusText.textContent = '✅ Conectado';
                    addLog('Bot conectado!', 'success');
                    document.getElementById('qrContainer').style.display = 'none';
                } else {
                    indicator.className = 'status-indicator';
                    statusText.textContent = '❌ Desconectado';
                    addLog('Bot desconectado. Escaneie o QR Code.', 'error');
                    refreshQR();
                }
            } catch (error) {
                addLog('Erro: ' + error.message, 'error');
            }
        }

        async function refreshQR() {
            try {
                addLog('Buscando QR Code...', 'info');
                const res = await fetch('/api/qr');
                const data = await res.json();
                
                if (data.status === 'pending') {
                    document.getElementById('qrImage').src = data.qr;
                    document.getElementById('qrContainer').style.display = 'block';
                    addLog('QR Code gerado!', 'success');
                } else if (data.status === 'connected') {
                    document.getElementById('qrContainer').style.display = 'none';
                    addLog('Bot já está conectado!', 'success');
                    checkStatus();
                } else {
                    addLog('Aguardando QR Code...', 'info');
                }
            } catch (error) {
                addLog('Erro ao gerar QR: ' + error.message, 'error');
            }
        }

        // Auto-check every 5 seconds
        window.addEventListener('load', () => {
            checkStatus();
            setInterval(checkStatus, 5000);
        });
    </script>
</body>
</html>
  `;
  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   WhatsApp Bot - Investindo do Zero    ║
║                                        ║
║   🚀 Servidor rodando em:              ║
║   http://localhost:${PORT}                  ║
║                                        ║
║   📊 Dashboard:                        ║
║   http://localhost:${PORT}/dashboard         ║
║                                        ║
║   ⚙️  Health Check:                    ║
║   http://localhost:${PORT}/health            ║
╚════════════════════════════════════════╝
  `);
});

export default app;
