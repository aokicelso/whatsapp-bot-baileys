# 🚀 Guia de Início Rápido

## Fase 1: Configuração Local

### Passo 1: Obtenha sua chave OpenAI

1. Acesse [openai.com](https://openai.com)
2. Faça login ou crie uma conta
3. Vá para **API Keys** no menu
4. Clique em **Create new secret key**
5. Copie a chave (você não conseguirá vê-la novamente)

### Passo 2: Configure o arquivo .env

```bash
# No diretório do projeto
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
PORT=3000
NODE_ENV=development
```

### Passo 3: Inicie o servidor

```bash
npm run dev
```

Você verá algo como:

```
╔════════════════════════════════════════╗
║   WhatsApp Bot - Investindo do Zero    ║
║                                        ║
║   🚀 Servidor rodando em:              ║
║   http://localhost:3000                ║
║                                        ║
║   📊 Dashboard:                        ║
║   http://localhost:3000/dashboard      ║
╚════════════════════════════════════════╝
```

### Passo 4: Acesse o Dashboard

Abra seu navegador em: **http://localhost:3000/dashboard**

Você verá:
- Status do bot (Desconectado)
- QR Code para escanear
- Logs em tempo real

### Passo 5: Conecte seu WhatsApp

1. Abra seu **WhatsApp** no celular
2. Vá para **Configurações → Dispositivos Conectados**
3. Clique em **Conectar um Dispositivo**
4. Aponte a câmera para o **QR Code** no dashboard
5. Autorize a conexão

Após alguns segundos, você verá:
- ✅ Status muda para "Conectado"
- 🟢 Indicador fica verde

### Passo 6: Teste o Bot

1. Abra uma conversa com você mesmo no WhatsApp
2. Envie uma mensagem: `/help`
3. O bot responderá com os comandos disponíveis

## Fase 2: Teste as Funcionalidades

### Teste 1: Chat com IA

Envie uma mensagem:
```
Qual é a melhor estratégia para importar eletrônicos do Japão?
```

O bot responderá com análise especializada.

### Teste 2: Análise de Produto

1. Tire uma foto de um produto (ou baixe uma imagem)
2. Envie a foto no WhatsApp
3. O bot analisará e fornecerá:
   - Título sugerido
   - Descrição técnica
   - Estimativa de preço
   - Análise de mercado

### Teste 3: Histórico

Envie:
```
/historico
```

O bot mostrará suas últimas análises.

## Fase 3: Deploy no Railway

### Passo 1: Crie uma conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **Sign Up**
3. Use GitHub para autenticar

### Passo 2: Crie um novo projeto

1. Clique em **New Project**
2. Selecione **Deploy from GitHub**
3. Autorize o Railway a acessar seu GitHub

### Passo 3: Selecione o repositório

1. Procure por `whatsapp-bot-baileys`
2. Clique em **Import**

### Passo 4: Configure as variáveis

1. No painel do Railway, vá para **Variables**
2. Adicione:
   ```
   OPENAI_API_KEY=sua_chave_aqui
   NODE_ENV=production
   ```

### Passo 5: Deploy

1. Clique em **Deploy**
2. Aguarde a conclusão (geralmente 2-3 minutos)

### Passo 6: Obtenha a URL

1. Vá para **Settings**
2. Procure por **Domains**
3. Copie a URL (algo como `https://whatsapp-bot-xxxxx.railway.app`)

### Passo 7: Conecte seu WhatsApp

1. Abra a URL do seu bot em um navegador
2. Vá para `/dashboard` (ex: `https://seu-bot.railway.app/dashboard`)
3. Escaneie o QR Code com seu WhatsApp
4. Pronto! Seu bot está online 24h

## Fase 4: Deploy no Render

### Passo 1: Crie uma conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **Sign Up**
3. Use GitHub para autenticar

### Passo 2: Crie um novo Web Service

1. Clique em **New +**
2. Selecione **Web Service**
3. Conecte seu repositório GitHub

### Passo 3: Configure o serviço

Preencha os campos:

- **Name**: `whatsapp-bot`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Passo 4: Adicione variáveis de ambiente

Clique em **Environment** e adicione:

```
OPENAI_API_KEY=sua_chave_aqui
NODE_ENV=production
```

### Passo 5: Deploy

Clique em **Create Web Service** e aguarde.

### Passo 6: Acesse seu bot

1. Após o deploy, você terá uma URL (ex: `https://whatsapp-bot.onrender.com`)
2. Acesse `/dashboard` para conectar seu WhatsApp
3. Seu bot estará online 24h

## 📱 Comandos do Bot

```
/help      - Mostra todos os comandos
/historico - Mostra suas últimas análises
/chat      - Inicia conversa com especialista
```

## 🆘 Troubleshooting

### Problema: QR Code não aparece

**Solução:**
```bash
# Reinicie o servidor
npm run dev
```

### Problema: Bot não responde

**Solução:**
1. Verifique se a chave OpenAI é válida
2. Verifique se há créditos na sua conta OpenAI
3. Reinicie o servidor

### Problema: Erro de conexão

**Solução:**
1. Verifique se seu WhatsApp está atualizado
2. Tente desconectar e reconectar
3. Verifique os logs do servidor

## 💡 Dicas

- **Backup**: Faça backup da pasta `sessions/` periodicamente
- **Logs**: Verifique os logs para debug
- **Atualizações**: Mantenha as dependências atualizadas com `npm update`

## 🎯 Próximos Passos

1. ✅ Teste localmente
2. ✅ Deploy no Railway ou Render
3. ✅ Compartilhe o link do dashboard com seus mentorados
4. ✅ Monitore as análises no banco de dados

---

**Seu bot está pronto para funcionar 24h!** 🚀
