import axios from 'axios';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// System prompt especializado em produtos japoneses
const SYSTEM_PROMPT = `Você é um especialista em importação e revenda de produtos do Japão, com foco em plataformas como Mercari, Yahoo Auctions e Rakuma.

Suas responsabilidades:
1. Analisar fotos de produtos e fornecer insights detalhados
2. Estimar preços baseado em condição e demanda
3. Identificar oportunidades de lucro
4. Fornecer dicas de negociação e logística
5. Responder dúvidas sobre importação do Japão

Sempre responda em português brasileiro, de forma clara e prática.
Quando analisar uma imagem de produto, forneça:
- Título sugerido
- Descrição técnica
- Estimativa de preço
- Análise de mercado
- Dicas de revenda`;

export async function analyzeProductImage(imagePath) {
  try {
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine image type
    const ext = path.extname(imagePath).toLowerCase();
    let mediaType = 'image/jpeg';
    if (ext === '.png') mediaType = 'image/png';
    if (ext === '.gif') mediaType = 'image/gif';
    if (ext === '.webp') mediaType = 'image/webp';

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise este produto em detalhes. Forneça:
1. Título sugerido para a venda
2. Descrição técnica completa
3. Estimativa de preço em JPY e BRL
4. Análise de mercado (demanda, concorrência)
5. Dicas de revenda para o Brasil
6. Plataforma recomendada (Mercari/Yahoo/Rakuma)`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysisText = response.data.choices[0].message.content;
    return parseAnalysis(analysisText);
  } catch (error) {
    console.error('Error analyzing product image:', error);
    throw new Error('Erro ao analisar imagem do produto');
  }
}

export async function chat(message, conversationHistory = []) {
  try {
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Erro ao processar sua mensagem');
  }
}

function parseAnalysis(analysisText) {
  // Simple parsing - in production, use structured output
  return {
    title: extractSection(analysisText, 'Título'),
    description: extractSection(analysisText, 'Descrição'),
    price_estimate: extractSection(analysisText, 'Estimativa de preço'),
    market_analysis: extractSection(analysisText, 'Análise de mercado'),
    full_analysis: analysisText
  };
}

function extractSection(text, sectionName) {
  const regex = new RegExp(`${sectionName}[:\\s]*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

export default {
  analyzeProductImage,
  chat
};
