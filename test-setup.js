#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`
╔════════════════════════════════════════╗
║     WhatsApp Bot - Setup Test          ║
╚════════════════════════════════════════╝
`);

let allOk = true;

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

console.log(`✓ Node.js versão: ${nodeVersion}`);
if (majorVersion < 18) {
  console.log('  ⚠️  Versão 18+ é recomendada');
  allOk = false;
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✓ node_modules instalado');
} else {
  console.log('✗ node_modules não encontrado');
  console.log('  Execute: npm install');
  allOk = false;
}

// Check .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ Arquivo .env encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('OPENAI_API_KEY')) {
    console.log('✓ OPENAI_API_KEY configurado');
  } else {
    console.log('✗ OPENAI_API_KEY não configurado');
    allOk = false;
  }
} else {
  console.log('✗ Arquivo .env não encontrado');
  console.log('  Execute: cp .env.example .env');
  allOk = false;
}

// Check required files
const requiredFiles = [
  'src/server.js',
  'src/baileys-service.js',
  'src/gpt-service.js',
  'src/message-handler.js',
  'src/db.js',
  'package.json'
];

console.log('\nArquivos necessários:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file}`);
    allOk = false;
  }
});

// Check npm packages
console.log('\nPacotes instalados:');
const requiredPackages = [
  '@whiskeysockets/baileys',
  'express',
  'axios',
  'dotenv',
  'sqlite3'
];

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

requiredPackages.forEach(pkg => {
  if (packageJson.dependencies[pkg]) {
    console.log(`✓ ${pkg}`);
  } else {
    console.log(`✗ ${pkg}`);
    allOk = false;
  }
});

console.log(`
${allOk ? '✅ Setup OK!' : '❌ Há problemas a resolver'}

${allOk ? `
🚀 Próximos passos:

1. Configure sua chave OpenAI em .env:
   OPENAI_API_KEY=sua_chave_aqui

2. Inicie o servidor:
   npm run dev

3. Acesse o dashboard:
   http://localhost:3000/dashboard

4. Escaneie o QR Code com seu WhatsApp
` : `
⚠️  Resolva os problemas acima antes de continuar.
`}
`);

process.exit(allOk ? 0 : 1);
