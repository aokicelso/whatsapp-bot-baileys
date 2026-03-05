import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: 'info' });

let sock = null;
let qrCode = null;

export async function initializeBaileys(onQRCode, onMessageReceived) {
  try {
    const sessionsDir = path.join(__dirname, '..', 'sessions');
    
    // Ensure sessions directory exists
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '120.0.0.0']
    });

    // Handle QR Code
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        console.log('QR Code gerado - escaneie com seu WhatsApp');
        if (onQRCode) onQRCode(qr);
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          'Conexão fechada. Reconectando:',
          shouldReconnect
        );

        if (shouldReconnect) {
          initializeBaileys(onQRCode, onMessageReceived);
        }
      } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        qrCode = null;
      }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async (m) => {
      if (onMessageReceived) {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            await onMessageReceived(msg);
          }
        }
      }
    });

    return sock;
  } catch (error) {
    console.error('Erro ao inicializar Baileys:', error);
    throw error;
  }
}

export async function sendMessage(jid, text, options = {}) {
  try {
    if (!sock) {
      throw new Error('Socket não inicializado');
    }

    const message = await sock.sendMessage(jid, {
      text: text,
      ...options
    });

    return message;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

export async function sendImage(jid, imagePath, caption = '') {
  try {
    if (!sock) {
      throw new Error('Socket não inicializado');
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const message = await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption || undefined
    });

    return message;
  } catch (error) {
    console.error('Erro ao enviar imagem:', error);
    throw error;
  }
}

export async function downloadMedia(message) {
  try {
    if (!sock) {
      throw new Error('Socket não inicializado');
    }

    const buffer = await sock.downloadMediaMessage(message);
    return buffer;
  } catch (error) {
    console.error('Erro ao baixar mídia:', error);
    throw error;
  }
}

export function getQRCode() {
  return qrCode;
}

export function isConnected() {
  return sock && sock.user;
}

export function getSocket() {
  return sock;
}

export async function logout() {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
      qrCode = null;
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

export default {
  initializeBaileys,
  sendMessage,
  sendImage,
  downloadMedia,
  getQRCode,
  isConnected,
  getSocket,
  logout
};
