#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessionsDir = path.join(__dirname, 'sessions');

if (fs.existsSync(sessionsDir)) {
  fs.rmSync(sessionsDir, { recursive: true, force: true });
  console.log('✅ Sessões limpas com sucesso!');
} else {
  console.log('ℹ️  Nenhuma sessão anterior encontrada.');
}
