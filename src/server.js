import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { initializeBaileys, getQRCode, isConnected } from './baileys-service.js';
import { handleMessage } from './message-handler.js';
import { initializeDatabase } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize database
await initializeDatabase();

// Initialize Baileys
let sock = null;

async function initBot() {
  try {
    sock = await initializeBaileys(
      (qr) => {
        console.log('QR Code gerado');
      },
      (msg) => {
        handleMessage(msg, sock);
      }
    );
  } catch (error) {
    console.error('Erro ao inicializar bot:', error);
    setTimeout(initBot, 5000); // Retry after 5 seconds
  }
}

// Start bot
initBot();

// Routes

// Root route - redirect to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected(),
    timestamp: new Date().toISOString()
  });
});

// Get QR Code
app.get('/api/qr', async (req, res) => {
  try {
    const qr = getQRCode();
    
    if (!qr) {
      return res.json({
        status: 'connected',
        message: 'Bot já está conectado'
      });
    }

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qr);
    
    res.json({
      status: 'pending',
      qr: qrImage,
      text: qr
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR code' });
  }
});

// Get bot status
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected(),
    timestamp: new Date().toISOString()
  });
});

// Dashboard HTML
app.get('/dashboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

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
            animation: pulse 2s infinite;
        }

        .status-indicator.connected {
            background: #4caf50;
        }

        .status-indicator.disconnected {
            background: #f44336;
            animation: none;
        }

        .status-text {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .qr-container {
            text-align: center;
            margin: 30px 0;
        }

        .qr-container h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 16px;
        }

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

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }

        .info-item {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .info-item label {
            display: block;
            font-size: 12px;
            color: #999;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .info-item value {
            display: block;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }

        .btn-secondary:hover {
            background: #efefef;
        }

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

        .log-entry {
            margin: 5px 0;
        }

        .log-entry.error {
            color: #ff6b6b;
        }

        .log-entry.success {
            color: #51cf66;
        }

        .log-entry.info {
            color: #74c0fc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 WhatsApp Bot</h1>
            <p>Investindo do Zero - Análise de Produtos</p>
        </div>

        <div class="status-box">
            <span class="status-indicator disconnected" id="statusIndicator"></span>
            <span class="status-text" id="statusText">Desconectado</span>
        </div>

        <div class="qr-container" id="qrContainer" style="display: none;">
            <h3>📱 Escaneie o QR Code com seu WhatsApp</h3>
            <img id="qrImage" src="" alt="QR Code">
            <div class="instructions">
                <strong>Como conectar:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Abra seu WhatsApp</li>
                    <li>Vá para Configurações → Dispositivos Conectados</li>
                    <li>Clique em "Conectar um Dispositivo"</li>
                    <li>Aponte a câmera para este QR Code</li>
                </ol>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <label>Mensagens Processadas</label>
                <value id="messageCount">0</value>
            </div>
            <div class="info-item">
                <label>Análises Realizadas</label>
                <value id="analysisCount">0</value>
            </div>
        </div>

        <div class="button-group">
            <button class="btn-primary" onclick="refreshQR()">Atualizar QR</button>
            <button class="btn-secondary" onclick="checkStatus()">Verificar Status</button>
        </div>

        <div class="logs" id="logs">
            <div class="log-entry info">Sistema iniciado...</div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;

        function addLog(message, type = 'info') {
            const logsDiv = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logsDiv.appendChild(entry);
            logsDiv.scrollTop = logsDiv.scrollHeight;
        }

        async function checkStatus() {
            try {
                const response = await fetch(\`\${API_BASE}/api/status\`);
                const data = await response.json();
                
                const indicator = document.getElementById('statusIndicator');
                const statusText = document.getElementById('statusText');
                
                if (data.connected) {
                    indicator.className = 'status-indicator connected';
                    statusText.textContent = '✅ Conectado';
                    addLog('Bot conectado com sucesso!', 'success');
                    document.getElementById('qrContainer').style.display = 'none';
                } else {
                    indicator.className = 'status-indicator disconnected';
                    statusText.textContent = '❌ Desconectado';
                    addLog('Bot desconectado. Escaneie o QR Code.', 'error');
                    refreshQR();
                }
            } catch (error) {
                addLog('Erro ao verificar status: ' + error.message, 'error');
            }
        }

        async function refreshQR() {
            try {
                const response = await fetch(\`\${API_BASE}/api/qr\`);
                const data = await response.json();
                
                if (data.status === 'pending') {
                    document.getElementById('qrImage').src = data.qr;
                    document.getElementById('qrContainer').style.display = 'block';
                    addLog('QR Code gerado. Escaneie para conectar.', 'info');
                } else if (data.status === 'connected') {
                    document.getElementById('qrContainer').style.display = 'none';
                    checkStatus();
                }
            } catch (error) {
                addLog('Erro ao gerar QR Code: ' + error.message, 'error');
            }
        }

        // Check status on load
        window.addEventListener('load', () => {
            checkStatus();
            // Check every 5 seconds
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
