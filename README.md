# WhatsApp Bot - Investindo do Zero

Sistema completo de bot WhatsApp com Baileys, GPT-4o e Dashboard para análise de produtos japoneses.

## 🚀 Características

- ✅ Conexão via Baileys (sem necessidade de API oficial)
- ✅ Análise de imagens com GPT-4o
- ✅ Chat inteligente especializado em produtos do Japão
- ✅ Dashboard de monitoramento em tempo real
- ✅ Histórico de conversas e análises
- ✅ Suporte a múltiplos usuários
- ✅ Deploy fácil no Railway/Render

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Conta OpenAI com acesso a GPT-4o
- WhatsApp instalado em um celular (para escanear QR Code)

## 🔧 Instalação

### 1. Clone ou baixe o projeto

```bash
cd whatsapp-bot-baileys
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione:

```env
OPENAI_API_KEY=sua_chave_openai_aqui
PORT=3000
NODE_ENV=development
```

## 🎯 Como Usar

### Desenvolvimento Local

```bash
npm run dev
```

Acesse o dashboard em: `http://localhost:3000/dashboard`

### Produção

```bash
npm start
```

## 📱 Conectando seu WhatsApp

1. Abra o dashboard em `http://localhost:3000/dashboard`
2. Você verá um QR Code na tela
3. Abra seu WhatsApp no celular
4. Vá para **Configurações → Dispositivos Conectados**
5. Clique em **Conectar um Dispositivo**
6. Aponte a câmera para o QR Code
7. Pronto! O bot está conectado

## 💬 Comandos Disponíveis

- `/help` - Mostra todos os comandos
- `/historico` - Mostra suas últimas análises
- `/chat` - Inicia conversa com especialista
- Enviar foto - Análise automática do produto

## 🤖 Como Funciona

### Fluxo de Análise de Produto

1. Usuário envia uma foto de um produto
2. Bot baixa a imagem
3. GPT-4o analisa a imagem e fornece:
   - Título sugerido
   - Descrição técnica
   - Estimativa de preço
   - Análise de mercado
   - Dicas de revenda
4. Resposta é enviada ao usuário
5. Análise é salva no banco de dados

### Fluxo de Chat

1. Usuário envia uma mensagem
2. Bot recupera histórico da conversa
3. GPT-4o processa a mensagem com contexto
4. Resposta especializada é enviada
5. Conversa é salva no banco de dados

## 🚀 Deploy no Railway

### 1. Crie uma conta no Railway

Acesse [railway.app](https://railway.app)

### 2. Conecte seu repositório

- Clique em "New Project"
- Selecione "Deploy from GitHub"
- Selecione este repositório

### 3. Configure as variáveis de ambiente

No painel do Railway, adicione:

```
OPENAI_API_KEY=sua_chave
PORT=3000
NODE_ENV=production
```

### 4. Deploy automático

O Railway fará deploy automático a cada push para a branch main.

## 🚀 Deploy no Render

### 1. Crie uma conta no Render

Acesse [render.com](https://render.com)

### 2. Crie um novo Web Service

- Clique em "New +"
- Selecione "Web Service"
- Conecte seu repositório GitHub

### 3. Configure o serviço

- **Name**: whatsapp-bot
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Adicione variáveis de ambiente

```
OPENAI_API_KEY=sua_chave
NODE_ENV=production
```

### 5. Deploy

Clique em "Create Web Service" e aguarde o deploy.

## 📊 Estrutura do Banco de Dados

### Tabelas

- **users** - Informações dos usuários
- **conversations** - Histórico de mensagens
- **product_analyses** - Análises de produtos
- **sessions** - Sessões do Baileys

## 🔐 Segurança

- As credenciais do WhatsApp são armazenadas localmente em `sessions/`
- A chave OpenAI é protegida por variáveis de ambiente
- Senhas nunca são armazenadas
- Dados são criptografados em trânsito

## 📝 Logs

Os logs são salvos em:
- Console (desenvolvimento)
- Arquivo de log (produção)

## 🐛 Troubleshooting

### QR Code não aparece

```bash
# Reinicie o servidor
npm run dev
```

### Erro de conexão com OpenAI

- Verifique se a chave API é válida
- Verifique se sua conta tem acesso a GPT-4o
- Verifique a quota de uso

### Bot não responde

- Verifique a conexão do WhatsApp
- Verifique os logs do servidor
- Reinicie o servidor

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

## 📄 Licença

MIT

## ⚠️ Aviso Legal

Este projeto usa Baileys, que é uma biblioteca de engenharia reversa. O uso pode violar os Termos de Serviço do WhatsApp. Use por sua conta e risco.

---

**Desenvolvido com ❤️ para a comunidade de importadores brasileiros no Japão**
