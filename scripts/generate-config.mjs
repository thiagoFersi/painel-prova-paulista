#!/usr/bin/env node
/* Gera public/js/config.js a partir de variáveis de ambiente.
 *
 * Na Vercel: Project > Settings > Environment Variables:
 *   SUPABASE_URL        = Project URL do Supabase     (Project Settings > API)
 *   SUPABASE_ANON_KEY   = chave "anon public"/"publishable" (Project Settings > API)
 *   ADMIN_TAB_PUBLIC    = (opcional) "false" para esconder o botão de admin (acesse com #admin)
 * Local: copie .env.example para .env, preencha e rode  npm run config
 *
 * Sem variáveis, o arquivo public/js/config.js não é alterado e o site usa js/data.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'js', 'config.js');

// Lê .env (uso local) sem sobrescrever variáveis já definidas.
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/, '');
const key = (process.env.SUPABASE_ANON_KEY || '').trim();
const fail = (msg) => { console.error('\n[generate-config] ERRO: ' + msg + '\n'); process.exit(1); };

if (!url && !key) {
  console.warn('[generate-config] SUPABASE_URL e SUPABASE_ANON_KEY não definidos: config.js mantido como está (o site usa js/data.js).');
  process.exit(0);
}
if (!url || !key) fail('defina SUPABASE_URL e SUPABASE_ANON_KEY juntas (falta uma delas).');
if (!/^https:\/\/[^\s/]+$/.test(url)) fail('SUPABASE_URL deve ser a "Project URL" completa, como https://abcdefgh.supabase.co');

// Trava de segurança: recusa chaves secretas.
if (key.startsWith('sb_secret_')) fail('esta é uma chave SECRETA do Supabase. Use a "anon public" ou a "publishable".');
if (key.split('.').length === 3) {
  try {
    const role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role;
    if (role === 'service_role') fail('esta é a chave service_role (acesso total ao banco). Use a chave "anon public".');
    if (role !== 'anon') console.warn('[generate-config] aviso: o papel da chave é "' + role + '" (esperado: anon).');
  } catch { fail('SUPABASE_ANON_KEY não parece uma chave válida do Supabase.'); }
} else if (!key.startsWith('sb_publishable_')) {
  console.warn('[generate-config] aviso: formato de chave não reconhecido; confira se é a "anon public".');
}

const adminPublic = String(process.env.ADMIN_TAB_PUBLIC ?? 'true').toLowerCase() !== 'false';
const out = `/* ARQUIVO GERADO por scripts/generate-config.mjs. Não edite à mão.
   Valores vindos das variáveis de ambiente. A chave anon é pública por desenho (protegida por RLS). */
window.APP_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
  TABLE: "datasets",
  ADMIN_TAB_PUBLIC: ${adminPublic}
};
`;
writeFileSync(target, out);
console.log('[generate-config] public/js/config.js gerado para ' + url);
