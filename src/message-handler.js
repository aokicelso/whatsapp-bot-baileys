import {
  getOrCreateUser,
  saveMessage,
  getConversationHistory,
  saveProductAnalysis,
  getUserAnalyses
} from './db.js';
import { chat, analyzeProductImage } from './gpt-service.js';
import { sendMessage, sendImage, downloadMedia } from './baileys-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMANDS = {
  '/help': 'Mostra os comandos disponíveis',
  '/analise': 'Envie uma foto de um produto para análise',
  '/historico': 'Mostra suas últimas análises',
  '/chat': 'Inicie uma conversa com o especialista'
};

export async function handleMessage(msg, sock) {
  try {
    const jid = msg.key.remoteJid;
    const phoneNumber = jid.replace('@s.whatsapp.net', '');
    
    // Get or create user
    const user = await getOrCreateUser(phoneNumber);

    // Check message type
    if (msg.message?.conversation) {
      await handleTextMessage(msg, user, sock);
    } else if (msg.message?.imageMessage) {
      await handleImageMessage(msg, user, sock);
    } else if (msg.message?.documentMessage) {
      await handleDocumentMessage(msg, user, sock);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    const jid = msg.key.remoteJid;
    await sendMessage(jid, '❌ Erro ao processar sua mensagem. Tente novamente.');
  }
}

async function handleTextMessage(msg, user, sock) {
  const jid = msg.key.remoteJid;
  const text = msg.message.conversation;

  // Save message to database
  await saveMessage(user.id, text, 'user', 'text');

  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(text, user, sock);
    return;
  }

  // Regular chat
  await sendMessage(jid, '⏳ Processando sua mensagem...');

  try {
    // Get conversation history
    const history = await getConversationHistory(user.id, 10);

    // Get response from GPT
    const response = await chat(text, history);

    // Save AI response
    await saveMessage(user.id, response, 'assistant', 'text');

    // Send response in chunks if too long
    if (response.length > 4096) {
      const chunks = response.match(/[\s\S]{1,4096}/g) || [];
      for (const chunk of chunks) {
        await sendMessage(jid, chunk);
      }
    } else {
      await sendMessage(jid, response);
    }
  } catch (error) {
    console.error('Erro no chat:', error);
    await sendMessage(jid, '❌ Erro ao processar sua mensagem. Tente novamente.');
  }
}

async function handleImageMessage(msg, user, sock) {
  const jid = msg.key.remoteJid;

  try {
    await sendMessage(jid, '📸 Analisando imagem...');

    // Download image
    const mediaBuffer = await downloadMedia(msg);
    
    // Save image temporarily
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imagePath = path.join(uploadsDir, `${Date.now()}.jpg`);
    
    // Convert to JPEG if needed
    await sharp(mediaBuffer)
      .jpeg({ quality: 80 })
      .toFile(imagePath);

    // Analyze product
    const analysis = await analyzeProductImage(imagePath);

    // Save analysis to database
    await saveProductAnalysis(user.id, 'whatsapp', imagePath, analysis);

    // Format response
    const response = `
🎯 *ANÁLISE DO PRODUTO*

📝 *Título Sugerido:*
${analysis.title || 'Não identificado'}

📋 *Descrição:*
${analysis.description || 'Não disponível'}

💰 *Estimativa de Preço:*
${analysis.price_estimate || 'Não disponível'}

📊 *Análise de Mercado:*
${analysis.market_analysis || 'Não disponível'}

---
${analysis.full_analysis}
    `;

    // Send response
    if (response.length > 4096) {
      const chunks = response.match(/[\s\S]{1,4096}/g) || [];
      for (const chunk of chunks) {
        await sendMessage(jid, chunk);
      }
    } else {
      await sendMessage(jid, response);
    }

    // Save message
    await saveMessage(user.id, `[Imagem analisada]`, 'user', 'image');
    await saveMessage(user.id, analysis.full_analysis, 'assistant', 'analysis');

  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    await sendMessage(jid, '❌ Erro ao analisar a imagem. Certifique-se de que é uma foto clara de um produto.');
  }
}

async function handleDocumentMessage(msg, user, sock) {
  const jid = msg.key.remoteJid;
  await sendMessage(jid, '📄 Documentos não são suportados. Envie uma imagem de um produto para análise.');
}

async function handleCommand(text, user, sock) {
  const jid = `${user.phone_number}@s.whatsapp.net`;
  const command = text.split(' ')[0];

  switch (command) {
    case '/help':
      const helpText = `
🤖 *COMANDOS DISPONÍVEIS*

${Object.entries(COMMANDS)
  .map(([cmd, desc]) => `${cmd} - ${desc}`)
  .join('\n')}

💡 *Dicas:*
• Envie uma foto de um produto para análise automática
• Digite sua dúvida normalmente para conversar com o especialista
• Use /historico para ver suas análises anteriores
      `;
      await sendMessage(jid, helpText);
      break;

    case '/historico':
      const analyses = await getUserAnalyses(user.id, 5);
      if (analyses.length === 0) {
        await sendMessage(jid, '📭 Você ainda não tem análises. Envie uma foto de um produto!');
      } else {
        const historyText = `
📊 *SUAS ÚLTIMAS ANÁLISES*

${analyses
  .map(
    (a, i) => `
${i + 1}. *${a.title || 'Produto sem título'}*
   Plataforma: ${a.platform}
   Data: ${new Date(a.created_at).toLocaleDateString('pt-BR')}
`
  )
  .join('')}
        `;
        await sendMessage(jid, historyText);
      }
      break;

    case '/chat':
      await sendMessage(jid, '💬 Iniciando conversa com especialista...\n\nDigite sua dúvida sobre importação de produtos do Japão!');
      break;

    default:
      await sendMessage(jid, `❓ Comando não reconhecido. Use /help para ver os comandos disponíveis.`);
  }
}

export default {
  handleMessage,
  COMMANDS
};
