// Autenticação: senhas com bcrypt + sessão em cookie HttpOnly (JWT assinado).
//
// Por que cookie HttpOnly e não localStorage? O JavaScript da página não consegue ler o cookie,
// então um eventual XSS não consegue roubar a sessão. O mesmo cookie autentica o WebSocket.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const COOKIE_NAME = 'ct_session';
export const SESSION_DAYS = 7;
const REFRESH_AFTER_SEC = 24 * 3600; // renova a sessão de quem usa o site todo dia
const BCRYPT_COST = 11;

// ---------- Segredo do JWT ----------
// Use JWT_SECRET no .env em produção. Sem ele, geramos um e guardamos em data/.jwt-secret
// para as sessões sobreviverem a reinícios do servidor.
function loadSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) return process.env.JWT_SECRET;
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
  const file = path.join(dir, '.jwt-secret');
  try {
    if (fs.existsSync(file)) {
      const saved = fs.readFileSync(file, 'utf-8').trim();
      if (saved.length >= 32) return saved;
    }
    const fresh = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, fresh, { mode: 0o600 });
    console.warn('🔑 JWT_SECRET não definido: gerei um segredo em server/data/.jwt-secret (defina JWT_SECRET no .env em produção).');
    return fresh;
  } catch {
    console.warn('🔑 Não consegui gravar o segredo do JWT; usando um temporário (as sessões caem a cada reinício).');
    return crypto.randomBytes(48).toString('hex');
  }
}
const SECRET = loadSecret();

// ---------- Senhas ----------
export const isHashed = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);
export const hashPassword = (plain) => bcrypt.hash(String(plain), BCRYPT_COST);
export const verifyPassword = async (plain, hash) => {
  if (!isHashed(hash)) return false;
  return bcrypt.compare(String(plain), hash);
};
// Mesmo tempo de resposta quando o e-mail não existe (não revela quais e-mails têm conta)
const DUMMY_HASH = bcrypt.hashSync('senha-falsa-para-igualar-o-tempo', BCRYPT_COST);
export const burnTime = (plain) => bcrypt.compare(String(plain), DUMMY_HASH);

export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72; // limite do bcrypt

// ---------- Cookies ----------
export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      out[key] = part.slice(i + 1).trim();
    }
  }
  return out;
}

const isSecureRequest = (req) =>
  req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';

export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 86400}`
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req, res) {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecureRequest(req)) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

// ---------- Sessão (JWT) ----------
export const signSession = (user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion || 0 }, SECRET, { expiresIn: `${SESSION_DAYS}d` });

// Retorna { user, needsRefresh } ou null. `findUser` busca o usuário no banco.
// A sessão deixa de valer se a senha foi trocada (tokenVersion mudou) ou a conta sumiu.
export function resolveSession(token, findUser) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    const user = findUser(payload.sub);
    if (!user || (user.tokenVersion || 0) !== (payload.tv || 0)) return null;
    const age = Math.floor(Date.now() / 1000) - (payload.iat || 0);
    return { user, needsRefresh: age > REFRESH_AFTER_SEC };
  } catch {
    return null;
  }
}

// ---------- Proteção contra tentativas em massa de senha ----------
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 30;
const failures = new Map(); // chave -> { count, first }

const bump = (key) => {
  const now = Date.now();
  const f = failures.get(key);
  if (!f || now - f.first > WINDOW_MS) failures.set(key, { count: 1, first: now });
  else f.count++;
};
const blockedFor = (key, max) => {
  const f = failures.get(key);
  if (!f) return 0;
  const left = WINDOW_MS - (Date.now() - f.first);
  if (left <= 0) {
    failures.delete(key);
    return 0;
  }
  return f.count >= max ? left : 0;
};

// Retorna minutos de espera (0 = liberado)
export function loginBlockedMinutes(email, ip) {
  const left = Math.max(
    blockedFor(`e:${String(email).toLowerCase()}`, MAX_PER_EMAIL),
    blockedFor(`i:${ip}`, MAX_PER_IP)
  );
  return left > 0 ? Math.ceil(left / 60000) : 0;
}
export function recordLoginFailure(email, ip) {
  bump(`e:${String(email).toLowerCase()}`);
  bump(`i:${ip}`);
}
export function clearLoginFailures(email) {
  failures.delete(`e:${String(email).toLowerCase()}`);
}
setInterval(() => {
  const now = Date.now();
  for (const [k, f] of failures) if (now - f.first > WINDOW_MS) failures.delete(k);
}, 10 * 60 * 1000).unref();

// ---------- Limite de cadastros por IP (evita criação de contas em massa) ----------
const registrations = new Map();
const REG_WINDOW_MS = 60 * 60 * 1000;
const REG_MAX = 10;
export function registrationLimited(ip) {
  const now = Date.now();
  const r = registrations.get(ip);
  if (!r || now - r.first > REG_WINDOW_MS) {
    registrations.set(ip, { count: 1, first: now });
    return false;
  }
  r.count++;
  return r.count > REG_MAX;
}

// ---------- Origem das requisições (defesa extra contra CSRF) ----------
// Aceita: mesma origem, localhost (desenvolvimento) e o que estiver em ALLOWED_ORIGINS.
const extraOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
export const allowedOrigins = extraOrigins;

export function originAllowed(origin, host) {
  if (!origin) return true; // chamadas sem Origin (apps, curl, mesmo site em alguns casos)
  try {
    const u = new URL(origin);
    if (u.host === host) return true;
    if (['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) return true;
    return extraOrigins.includes(u.origin);
  } catch {
    return false;
  }
}
