import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './db.js';
import { tarotDeck } from './tarotData.js';
import { getSchedule, validateSchedule, availableSlots } from './schedule.js';
import {
  COOKIE_NAME, parseCookies, setSessionCookie, clearSessionCookie, hashPassword, verifyPassword, burnTime,
  isHashed, signSession, resolveSession, loginBlockedMinutes, recordLoginFailure, clearLoginFailures,
  registrationLimited, originAllowed, allowedOrigins, PASSWORD_MIN, PASSWORD_MAX
} from './auth.js';

const app = express();
const server = http.createServer(app);
// WebSocket: aceita só a mesma origem (ou as listadas em ALLOWED_ORIGINS); a sessão vem do cookie
const io = new Server(server, {
  allowRequest: (req, cb) => cb(null, originAllowed(req.headers.origin, req.headers.host, req.headers['x-forwarded-host']))
});

const PORT = process.env.PORT || 5000;

// Atrás de proxy (Render, Railway, Fly, Nginx...) o IP real e o HTTPS vêm nos cabeçalhos X-Forwarded-*
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

// Por padrão o site e a API ficam na MESMA origem (sem CORS). Só abre CORS para o que estiver em ALLOWED_ORIGINS.
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false, credentials: true }));
app.use(express.json({ limit: '4mb' }));

// Cabeçalhos de segurança básicos (câmera e microfone liberados só para este site)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

// Defesa extra contra CSRF: pedidos que alteram dados só vêm do próprio site
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!originAllowed(req.headers.origin, req.headers.host, req.headers['x-forwarded-host'])) {
    return res.status(403).json({ error: 'Origem não permitida.' });
  }
  next();
});

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------
const onlyDigits = (v = '') => String(v).replace(/\D/g, '');

// Telefone salvo no cadastro: apenas dígitos, sem DDI (ex: 11999990001)
function normalizePhone(raw) {
  let d = onlyDigits(raw);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return d;
}
const isValidPhone = (d) => d.length === 10 || d.length === 11;
// Número para link do WhatsApp: com DDI 55
const toWhatsapp = (digits) => (digits ? `55${digits}` : '');

const MAX_AVATAR_CHARS = 1_500_000; // ~1,1 MB de imagem
function isValidAvatar(value) {
  if (typeof value !== 'string' || value.length > MAX_AVATAR_CHARS) return false;
  return /^https?:\/\/\S+$/i.test(value) || /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}

// Nunca devolve a senha para o navegador
function publicUser(u) {
  if (!u) return null;
  const { password, tokenVersion, ...safe } = u;
  return safe;
}

const APPOINTMENT_ACTIVE = ['pending', 'confirmed'];
const APPOINTMENT_TYPES = ['video', 'audio'];
const APPOINTMENT_DURATIONS = [15, 30, 60];

// ----------------------------------------------------
// PRESENÇA: um oraculista só aparece "Online" se estiver com o site aberto (socket conectado)
// ----------------------------------------------------
const userRoom = (userId) => `user:${userId}`;
const isOnline = (userId) => (io.sockets.adapter.rooms.get(userRoom(userId))?.size || 0) > 0;
const withPresence = (r) => {
  const online = isOnline(r.userId);
  // O número de contato nunca vai para a vitrine pública
  const { whatsapp, ...publicFields } = r;
  return { ...publicFields, online, status: r.status === 'available' && !online ? 'offline' : r.status };
};
const broadcastReaderPresence = (reader) => {
  if (!reader) return;
  io.emit('reader-status-updated', { readerId: reader.id, status: withPresence(reader).status });
};

// ----------------------------------------------------
// SESSÃO: quem está chamando a API (vem do cookie HttpOnly, nunca de campos enviados pelo navegador)
// ----------------------------------------------------
function sessionFromCookieHeader(cookieHeader) {
  const token = parseCookies(cookieHeader)[COOKIE_NAME];
  return resolveSession(token, (id) => db.findUserById(id));
}

const authenticate = (req, res, next) => {
  const session = sessionFromCookieHeader(req.headers.cookie);
  if (!session) {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.', code: 'AUTH_REQUIRED' });
  }
  if (session.needsRefresh) setSessionCookie(req, res, signSession(session.user)); // sessão renovada
  req.user = session.user;
  next();
};

const requireRole = (...roles) => [
  authenticate,
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ error: 'Você não tem permissão para esta ação.' })
];

// O oraculista só mexe no próprio perfil (admin pode tudo)
function ownsReader(user, reader) {
  return user.role === 'admin' || (user.role === 'reader' && reader && reader.userId === user.id);
}

// ----------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// ----------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    if (registrationLimited(req.ip)) {
      return res.status(429).json({ error: 'Muitos cadastros deste endereço. Tente novamente mais tarde.' });
    }

    const { name, email, password, phone, oracles, bio, pricePerMinute, experienceYears } = req.body;
    // Pelo cadastro público só nascem consulentes e oraculistas (admin NUNCA)
    const role = req.body.role === 'reader' ? 'reader' : 'client';

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim();
    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: 'Informe seu nome (entre 2 e 80 caracteres).' });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 120) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      return res.status(400).json({ error: `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.` });
    }

    const digits = normalizePhone(phone || '');
    if (digits && !isValidPhone(digits)) {
      return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número (ex: 11999999999).' });
    }
    if (role === 'reader' && !digits) {
      return res.status(400).json({ error: 'Oraculistas precisam informar um celular de contato.' });
    }

    if (db.findUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const newUser = db.createUser({
      name: cleanName,
      email: cleanEmail,
      password: await hashPassword(password),
      role,
      phone: digits,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`
    });

    // Se for oraculista, cria perfil de atendimento com status "pending" (EM ANÁLISE)
    let readerProfile = null;
    if (role === 'reader') {
      const price = parseFloat(pricePerMinute);
      const years = parseInt(experienceYears, 10);
      readerProfile = db.createReader({
        userId: newUser.id,
        name: newUser.name,
        title: 'Oraculista & Terapeuta Holístico',
        bio: String(bio || 'Bem-vindo(a) ao meu espaço sagrado. Em análise de perfil pela curadoria.').slice(0, 1000),
        oracles: Array.isArray(oracles) && oracles.length > 0
          ? oracles.slice(0, 10).map((o) => String(o).slice(0, 40))
          : ['Tarô de Marselha', 'Rider Waite'],
        pricePerMinute: price >= 1 && price <= 100 ? price : 3.00,
        avatar: newUser.avatar,
        whatsapp: toWhatsapp(digits),
        experienceYears: years >= 0 && years <= 60 ? years : 3,
        approvalStatus: 'pending',
        isApproved: false,
        status: 'offline'
      });
    }

    setSessionCookie(req, res, signSession(newUser));
    res.status(201).json({ user: publicUser(newUser), readerProfile });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const wait = loginBlockedMinutes(email, req.ip);
    if (wait) {
      return res.status(429).json({ error: `Muitas tentativas incorretas. Aguarde ${wait} min e tente de novo.` });
    }

    const user = db.findUserByEmail(email);
    const ok = user ? await verifyPassword(password, user.password) : (await burnTime(password), false);
    if (!ok) {
      recordLoginFailure(email, req.ip);
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    clearLoginFailures(email);
    setSessionCookie(req, res, signSession(user));
    const readerProfile = user.role === 'reader' ? db.findReaderById(user.id) : null;
    res.json({ user: publicUser(user), readerProfile });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

// Dados de quem está logado (o antigo /me/:userId continua existindo, mas ignora o parâmetro)
app.get(['/api/auth/me', '/api/auth/me/:userId'], authenticate, (req, res) => {
  const readerProfile = req.user.role === 'reader' ? db.findReaderById(req.user.id) : null;
  res.json({ user: publicUser(req.user), readerProfile });
});

// Atualização de cadastro de usuário (Nome, E-mail, Telefone, Foto e Senha)
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Você só pode alterar os seus próprios dados.' });
    }
    const { name, email, phone, avatar, password, currentPassword } = req.body;
    const user = db.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const updates = {};

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'Informe seu nome.' });
      updates.name = String(name).trim();
    }

    const emailChanged = email !== undefined && String(email).trim().toLowerCase() !== user.email.toLowerCase();
    if (email !== undefined) {
      const cleanEmail = String(email).trim();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Informe um e-mail válido.' });
      }
      const existing = db.findUserByEmail(cleanEmail);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Este e-mail já está em uso por outro usuário.' });
      }
      updates.email = cleanEmail;
    }

    if (phone !== undefined) {
      const digits = normalizePhone(phone);
      if (digits && !isValidPhone(digits)) {
        return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número (ex: 11999999999).' });
      }
      if (!digits && user.role === 'reader') {
        return res.status(400).json({ error: 'Oraculistas precisam manter um celular de contato cadastrado.' });
      }
      updates.phone = digits;
    }

    if (avatar !== undefined) {
      if (!isValidAvatar(avatar)) {
        return res.status(400).json({ error: 'Foto inválida. Envie uma imagem PNG/JPG/WEBP de até 1 MB ou um link https.' });
      }
      updates.avatar = avatar;
    }

    const passwordChanged = typeof password === 'string' && password.trim() !== '';
    if (passwordChanged && (password.trim().length < PASSWORD_MIN || password.length > PASSWORD_MAX)) {
      return res.status(400).json({ error: `A nova senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.` });
    }

    // Trocar e-mail (login) ou senha exige a senha atual
    if (emailChanged || passwordChanged) {
      if (!currentPassword || !(await verifyPassword(currentPassword, user.password))) {
        return res.status(403).json({ error: 'Senha atual incorreta. Ela é necessária para alterar e-mail ou senha.' });
      }
    }
    if (passwordChanged) {
      updates.password = await hashPassword(password.trim());
      updates.tokenVersion = (user.tokenVersion || 0) + 1; // derruba as sessões abertas em outros aparelhos
    }

    const updatedUser = db.updateUser(user.id, updates);

    if (passwordChanged) {
      // Esta sessão continua valendo (cookie novo); as demais são encerradas
      setSessionCookie(req, res, signSession(updatedUser));
      io.in(userRoom(user.id)).disconnectSockets(true);
    }

    // Oraculista: sincroniza nome, foto e WhatsApp no perfil público
    let updatedReader = null;
    if (user.role === 'reader') {
      const readerProfile = db.findReaderById(user.id);
      if (readerProfile) {
        const readerUpdates = {};
        if (updates.name) readerUpdates.name = updates.name;
        if (updates.avatar) readerUpdates.avatar = updates.avatar;
        if (updates.phone) readerUpdates.whatsapp = toWhatsapp(updates.phone);
        updatedReader = Object.keys(readerUpdates).length
          ? db.updateReader(readerProfile.id, readerUpdates)
          : readerProfile;
        io.emit('reader-status-updated', { readerId: updatedReader.id, status: updatedReader.status });
      }
    }

    res.json({
      message: 'Dados atualizados com sucesso!',
      user: publicUser(updatedUser),
      readerProfile: updatedReader
    });
  } catch (err) {
    console.error('Erro ao atualizar dados de usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados de cadastro.' });
  }
});

// ----------------------------------------------------
// ROTAS DE ORACULISTAS (Públicas - Apenas Aprovados)
// ----------------------------------------------------
app.get('/api/readers', (req, res) => {
  try {
    const { oracle, status, search } = req.query;
    let readers = db.getReaders();

    // Filtra APENAS os oraculistas aprovados pela curadoria para a vitrine pública
    readers = readers.filter(r => r.approvalStatus === 'approved' || r.isApproved === true).map(withPresence);

    if (oracle && oracle !== 'all') {
      readers = readers.filter(r => r.oracles.some(o => o.toLowerCase().includes(oracle.toLowerCase())));
    }

    if (status && status !== 'all') {
      readers = readers.filter(r => r.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      readers = readers.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.title.toLowerCase().includes(q) ||
        r.bio.toLowerCase().includes(q)
      );
    }

    res.json(readers);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar oraculistas.' });
  }
});

app.get('/api/readers/:id', (req, res) => {
  const reader = db.findReaderById(req.params.id);
  if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  res.json(withPresence(reader));
});

app.put('/api/readers/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  if (!['available', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const current = db.findReaderById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  if (!ownsReader(req.user, current)) return res.status(403).json({ error: 'Este perfil não é seu.' });

  // Se o oraculista ainda não foi aprovado, não pode ficar disponível
  if (!current.isApproved && current.approvalStatus !== 'approved') {
    return res.status(403).json({ error: 'Seu cadastro ainda está em análise pela curadoria. Aguarde a aprovação antes de alterar seu status.' });
  }

  const updated = db.updateReader(req.params.id, { status });
  
  // Notifica todos os clientes via WebSocket
  broadcastReaderPresence(updated);
  
  res.json(updated);
});

app.put('/api/readers/:id', authenticate, (req, res) => {
  const target = db.findReaderById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  if (!ownsReader(req.user, target)) return res.status(403).json({ error: 'Este perfil não é seu.' });

  const allowed = ['pricePerMinute', 'whatsapp', 'title', 'bio', 'oracles', 'status', 'experienceYears', 'videoCallEnabled', 'audioCallEnabled', 'whatsappEnabled', 'schedule'];
  const safeUpdates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) safeUpdates[key] = req.body[key];
  }
  if (safeUpdates.whatsapp !== undefined) {
    const digits = normalizePhone(safeUpdates.whatsapp);
    if (!isValidPhone(digits)) return res.status(400).json({ error: 'WhatsApp inválido. Informe DDD + número.' });
    safeUpdates.whatsapp = toWhatsapp(digits);
  }
  if (safeUpdates.schedule !== undefined) {
    const v = validateSchedule(safeUpdates.schedule);
    if (!v.ok) return res.status(400).json({ error: v.error });
    safeUpdates.schedule = v.schedule;
  }
  if (safeUpdates.status !== undefined) {
    const current = db.findReaderById(req.params.id);
    const approved = current && (current.isApproved || current.approvalStatus === 'approved');
    if (!['available', 'busy', 'offline'].includes(safeUpdates.status) || (!approved && safeUpdates.status !== 'offline')) {
      safeUpdates.status = 'offline';
    }
  }
  const updated = db.updateReader(req.params.id, safeUpdates);
  if (!updated) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  if (safeUpdates.whatsapp && updated.userId) {
    db.updateUser(updated.userId, { phone: normalizePhone(safeUpdates.whatsapp) });
  }
  res.json(updated);
});

// ----------------------------------------------------
// ROTAS DE ADMINISTRAÇÃO (Aprovação de Oraculistas & Métricas de 20%)
// ----------------------------------------------------
app.get('/api/admin/pending-readers', ...requireRole('admin'), (req, res) => {
  try {
    const allReaders = db.getReaders();
    const pending = allReaders.filter(r => r.approvalStatus === 'pending' || r.isApproved === false);
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar oraculistas pendentes.' });
  }
});

app.get('/api/admin/readers', ...requireRole('admin'), (req, res) => {
  try {
    res.json(db.getReaders());
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar todos os oraculistas.' });
  }
});

app.post('/api/admin/approve-reader/:id', ...requireRole('admin'), (req, res) => {
  try {
    const approved = db.approveReader(req.params.id);
    if (!approved) return res.status(404).json({ error: 'Oraculista não encontrado.' });
    
    // Notifica em tempo real
    io.emit('reader-status-updated', { readerId: approved.id, status: approved.status });
    
    res.json({
      message: `Oraculista ${approved.name} foi aprovado(a) com sucesso! Já está visível na plataforma.`,
      reader: approved
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao aprovar oraculista.' });
  }
});

app.post('/api/admin/reject-reader/:id', ...requireRole('admin'), (req, res) => {
  try {
    const { reason } = req.body;
    const rejected = db.rejectReader(req.params.id, reason);
    if (!rejected) return res.status(404).json({ error: 'Oraculista não encontrado.' });
    
    res.json({
      message: `Oraculista ${rejected.name} foi reprovado(a).`,
      reader: rejected
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao rejeitar oraculista.' });
  }
});

app.get('/api/admin/stats', ...requireRole('admin'), (req, res) => {
  try {
    const consultations = db.getConsultations();
    const readers = db.getReaders();
    const adminUser = db.getUsers().find(u => u.role === 'admin') || { balance: 0 };

    const totalConsultations = consultations.length;
    const totalVolume = consultations.reduce((acc, c) => acc + (c.cost || 0), 0);
    const platformEarnings20 = consultations.reduce((acc, c) => acc + (c.platformFee || ((c.cost || 0) * 0.20)), 0);
    const readersEarnings80 = consultations.reduce((acc, c) => acc + (c.readerEarnings || ((c.cost || 0) * 0.80)), 0);

    const pendingReaders = readers.filter(r => r.approvalStatus === 'pending' || r.isApproved === false).length;
    const approvedReaders = readers.filter(r => r.approvalStatus === 'approved' || r.isApproved === true).length;

    res.json({
      totalConsultations,
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      platformEarnings: parseFloat(platformEarnings20.toFixed(2)),
      readersEarnings: parseFloat(readersEarnings80.toFixed(2)),
      adminBalance: adminUser.balance,
      pendingReaders,
      approvedReaders,
      platformCommissionRate: "20%"
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar métricas.' });
  }
});

// ----------------------------------------------------
// ROTAS DE CONSULTAS E ATENDIMENTOS (Comissão 20% Plataforma / 80% Oraculista)
// O atendimento acontece DENTRO do site (vídeo ou áudio via WebRTC).
// Fluxo: cliente inicia -> oraculista recebe a chamada (toca) -> aceita -> conversam -> encerram.
// ----------------------------------------------------
const CALL_TYPES = ['video', 'audio'];
const RING_TIMEOUT_MS = Number(process.env.RING_TIMEOUT_MS) || 45000;
const ORPHAN_MS = 90000; // sala vazia por mais que isso => encerra sozinho
const ringTimers = new Map();

const findConsultation = (id) => db.getConsultations().find(c => c.id === id);

function clearRing(id) {
  const t = ringTimers.get(id);
  if (t) { clearTimeout(t); ringTimers.delete(id); }
}

// Devolve o oraculista ao status que tinha antes da chamada
function releaseReader(cons) {
  const reader = db.findReaderById(cons.readerId);
  if (!reader) return;
  const back = cons.readerPrevStatus && cons.readerPrevStatus !== 'busy' ? cons.readerPrevStatus : 'available';
  broadcastReaderPresence(db.updateReader(reader.id, { status: back }));
}

// Chamada que não virou atendimento (recusada, cancelada ou sem resposta): nada é cobrado
function endRinging(cons, status) {
  clearRing(cons.id);
  const updated = db.updateConsultation(cons.id, { status, endTime: new Date().toISOString(), cost: 0 });
  releaseReader(cons);
  io.to(userRoom(cons.clientId)).emit(`call-${status}`, { consultationId: cons.id });
  const reader = db.findReaderById(cons.readerId);
  if (reader?.userId) io.to(userRoom(reader.userId)).emit('incoming-call-closed', { consultationId: cons.id, reason: status });
  return updated;
}

// Fecha o atendimento e faz a cobrança UMA única vez (segura contra chamadas repetidas).
// O tempo é medido pelo servidor, a partir do aceite — não pelo relógio do navegador.
function finalizeConsultation(cons) {
  const client = db.findUserById(cons.clientId);

  if (cons.status === 'completed') {
    return {
      consultation: cons, cost: cons.cost || 0, minutes: cons.durationMinutes || 0,
      platformFee: cons.platformFee || 0, readerEarnings: cons.readerEarnings || 0,
      remainingBalance: client ? client.balance : 0, alreadyClosed: true
    };
  }

  // Chamada que nunca virou atendimento: nada a fazer nem a cobrar
  if (['missed', 'declined', 'cancelled'].includes(cons.status)) {
    return { consultation: cons, cost: 0, minutes: 0, platformFee: 0, readerEarnings: 0, remainingBalance: client ? client.balance : 0, alreadyClosed: true };
  }

  // Nunca chegaram a se conectar: não há o que cobrar
  if (!cons.connectedAt) {
    const updated = db.updateConsultation(cons.id, {
      status: 'missed', endTime: new Date().toISOString(), cost: 0, durationMinutes: 0
    });
    releaseReader(cons);
    return { consultation: updated, cost: 0, minutes: 0, platformFee: 0, readerEarnings: 0, remainingBalance: client ? client.balance : 0 };
  }

  const answered = cons.answeredAt ? new Date(cons.answeredAt).getTime() : Date.now();
  let minutes = Math.max(1, Math.ceil((Date.now() - answered) / 60000));
  if (cons.maxMinutes) minutes = Math.min(minutes, Math.max(1, cons.maxMinutes));
  const cost = parseFloat((minutes * cons.pricePerMinute).toFixed(2));

  // REPARTIÇÃO: 20% para a plataforma / 80% para o oraculista
  const platformFee = parseFloat((cost * 0.20).toFixed(2));
  const readerEarnings = parseFloat((cost * 0.80).toFixed(2));

  let remainingBalance = 0;
  if (client) {
    remainingBalance = parseFloat(Math.max(0, client.balance - cost).toFixed(2));
    db.updateUser(client.id, { balance: remainingBalance });
    db.createTransaction({
      userId: client.id,
      type: 'consultation_debit',
      amount: cost,
      description: `Atendimento (${cons.type}) com ${cons.readerName} - ${minutes} min`
    });
  }

  const reader = db.findReaderById(cons.readerId);
  if (reader && reader.userId) {
    const readerUser = db.findUserById(reader.userId);
    if (readerUser) {
      db.updateUser(readerUser.id, { balance: parseFloat((readerUser.balance + readerEarnings).toFixed(2)) });
      db.createTransaction({
        userId: readerUser.id,
        type: 'reader_earning',
        amount: readerEarnings,
        description: `Ganhos de consulta (${cons.type}) com ${cons.clientName} - ${minutes} min (80% repasse)`
      });
    }
  }

  const adminUser = db.getUsers().find(u => u.role === 'admin');
  if (adminUser) {
    db.updateUser(adminUser.id, { balance: parseFloat((adminUser.balance + platformFee).toFixed(2)) });
    db.createTransaction({
      userId: adminUser.id,
      type: 'platform_fee',
      amount: platformFee,
      description: `Comissão da Plataforma (20%) - Consulta #${cons.id} (${minutes} min com ${cons.readerName})`
    });
  }

  const updated = db.updateConsultation(cons.id, {
    status: 'completed',
    endTime: new Date().toISOString(),
    durationMinutes: minutes,
    cost, platformFee, readerEarnings
  });

  if (reader) {
    const back = cons.readerPrevStatus && cons.readerPrevStatus !== 'busy' ? cons.readerPrevStatus : 'available';
    broadcastReaderPresence(db.updateReader(reader.id, {
      status: back,
      consultationsCount: (reader.consultationsCount || 0) + 1
    }));
  }

  return { consultation: updated, cost, minutes, platformFee, readerEarnings, remainingBalance };
}

app.post('/api/consultations/start', authenticate, (req, res) => {
  try {
    const { readerId, type, appointmentId } = req.body;
    const clientId = req.user.id; // quem chama é sempre quem está logado

    if (!CALL_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Escolha vídeo ou áudio. O atendimento acontece aqui mesmo, no site.' });
    }

    const client = db.findUserById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(403).json({ error: 'Entre com uma conta de consulente para iniciar um atendimento.' });
    }

    const reader = db.findReaderById(readerId);
    if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });

    if (!reader.isApproved && reader.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'Este oraculista ainda está sob análise da curadoria e não pode realizar atendimentos.' });
    }

    // Consulta agendada confirmada permite chamar mesmo com o status "offline" (dentro da janela do horário)
    let appt = null;
    if (appointmentId) {
      const a = db.findAppointmentById(appointmentId);
      const startMs = a ? new Date(a.scheduledAt).getTime() : 0;
      if (a && a.clientId === client.id && a.readerId === reader.id && a.status === 'confirmed'
          && Date.now() >= startMs - 10 * 60000 && Date.now() <= startMs + a.durationMinutes * 60000) {
        appt = a;
      }
    }

    if (!isOnline(reader.userId)) {
      return res.status(409).json({ error: `${reader.name} não está conectado(a) ao site neste momento. Você pode agendar um horário.` });
    }
    if (reader.status === 'busy') {
      return res.status(409).json({ error: `${reader.name} está em outro atendimento agora. Tente novamente em instantes ou agende um horário.` });
    }
    if (reader.status === 'offline' && !appt) {
      return res.status(400).json({ error: 'Este oraculista está offline no momento. Você pode agendar um horário.' });
    }

    const minRequired = reader.pricePerMinute * 3;
    if (client.balance < minRequired) {
      return res.status(402).json({
        error: `Saldo insuficiente. É necessário pelo menos R$ ${minRequired.toFixed(2)} (equivalente a 3 minutos) para iniciar o atendimento.`,
        requiredAmount: minRequired,
        currentBalance: client.balance
      });
    }

    const alreadyIn = db.getConsultations({ clientId: client.id }).some(c => ['ringing', 'in_progress'].includes(c.status));
    if (alreadyIn) {
      return res.status(409).json({ error: 'Você já tem um atendimento em andamento.' });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const maxMinutes = Math.floor(client.balance / reader.pricePerMinute);

    const consultation = db.createConsultation({
      clientId: client.id,
      clientName: client.name,
      clientAvatar: client.avatar,
      readerId: reader.id,
      readerName: reader.name,
      pricePerMinute: reader.pricePerMinute,
      type,
      roomId,
      status: 'ringing',
      maxMinutes,
      readerPrevStatus: reader.status,
      appointmentId: appt ? appt.id : null,
      startTime: new Date().toISOString()
    });

    // Reserva o oraculista enquanto a chamada toca
    broadcastReaderPresence(db.updateReader(reader.id, { status: 'busy' }));

    io.to(userRoom(reader.userId)).emit('incoming-call', {
      consultationId: consultation.id,
      roomId,
      type,
      clientName: client.name,
      clientAvatar: client.avatar,
      pricePerMinute: reader.pricePerMinute,
      maxMinutes,
      scheduled: !!appt,
      ringTimeoutMs: RING_TIMEOUT_MS
    });

    ringTimers.set(consultation.id, setTimeout(() => {
      const current = findConsultation(consultation.id);
      if (current && current.status === 'ringing') endRinging(current, 'missed');
    }, RING_TIMEOUT_MS));

    res.json({ consultation, roomId, maxMinutes, serverNow: Date.now(), ringTimeoutMs: RING_TIMEOUT_MS });
  } catch (err) {
    console.error('Erro ao iniciar consulta:', err);
    res.status(500).json({ error: 'Erro ao iniciar consulta.' });
  }
});

// O oraculista atende a chamada
app.post('/api/consultations/:id/accept', authenticate, (req, res) => {
  try {
    const cons = findConsultation(req.params.id);
    if (!cons) return res.status(404).json({ error: 'Chamada não encontrada.' });
    const reader = db.findReaderById(cons.readerId);
    if (!reader || reader.userId !== req.user.id) {
      return res.status(403).json({ error: 'Esta chamada não é para você.' });
    }
    if (cons.status !== 'ringing') {
      return res.status(409).json({ error: 'Esta chamada não está mais disponível (cancelada ou já atendida).' });
    }

    clearRing(cons.id);
    const answeredAt = new Date().toISOString();
    const updated = db.updateConsultation(cons.id, { status: 'in_progress', answeredAt });

    if (cons.appointmentId) {
      db.updateAppointment(cons.appointmentId, { status: 'completed', consultationId: cons.id });
    }

    const serverNow = Date.now();
    io.to(userRoom(cons.clientId)).emit('call-accepted', { consultationId: cons.id, answeredAt, serverNow });
    io.to(userRoom(reader.userId)).emit('incoming-call-closed', { consultationId: cons.id, reason: 'accepted' });

    res.json({
      consultation: updated,
      serverNow,
      client: { name: cons.clientName, avatar: cons.clientAvatar }
    });
  } catch (err) {
    console.error('Erro ao atender chamada:', err);
    res.status(500).json({ error: 'Erro ao atender chamada.' });
  }
});

// Recusar (oraculista) ou cancelar (cliente) enquanto a chamada toca
app.post('/api/consultations/:id/cancel', authenticate, (req, res) => {
  const cons = findConsultation(req.params.id);
  if (!cons) return res.status(404).json({ error: 'Chamada não encontrada.' });
  if (cons.status !== 'ringing') {
    return res.status(409).json({ error: 'A chamada já foi atendida ou encerrada.' });
  }
  const reader = db.findReaderById(cons.readerId);
  const isReader = reader && reader.userId === req.user.id;
  const isClient = cons.clientId === req.user.id;
  if (!isReader && !isClient) return res.status(403).json({ error: 'Sem permissão.' });

  const updated = endRinging(cons, isReader ? 'declined' : 'cancelled');
  res.json({ consultation: updated });
});

app.post('/api/consultations/:id/end', authenticate, (req, res) => {
  try {
    const cons = findConsultation(req.params.id);
    if (!cons) return res.status(404).json({ error: 'Consulta não encontrada.' });
    const endReader = db.findReaderById(cons.readerId);
    const participant = cons.clientId === req.user.id || endReader?.userId === req.user.id || req.user.role === 'admin';
    if (!participant) return res.status(403).json({ error: 'Sem permissão para esta consulta.' });
    if (cons.status === 'ringing') {
      return res.status(409).json({ error: 'A chamada ainda não foi atendida.' });
    }
    res.json(finalizeConsultation(cons));
  } catch (err) {
    console.error('Erro ao finalizar consulta:', err);
    res.status(500).json({ error: 'Erro ao finalizar consulta.' });
  }
});

app.post('/api/consultations/:id/review', authenticate, (req, res) => {
  const cons = findConsultation(req.params.id);
  if (!cons) return res.status(404).json({ error: 'Consulta não encontrada.' });
  if (cons.clientId !== req.user.id) return res.status(403).json({ error: 'Só quem fez a consulta pode avaliá-la.' });

  const rating = parseInt(req.body.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'A nota deve ser de 1 a 5.' });
  if (cons.status !== 'completed') return res.status(409).json({ error: 'A consulta ainda não foi concluída.' });
  if (cons.rating) return res.status(409).json({ error: 'Esta consulta já foi avaliada.' });

  const updated = db.updateConsultation(cons.id, { rating, review: String(req.body.review || '').slice(0, 1000) });
  res.json(updated);
});

// Histórico de quem está logado (cliente: as suas; oraculista: as que atendeu; admin: todas)
app.get('/api/consultations', authenticate, (req, res) => {
  const filter = {};
  if (req.user.role === 'reader') {
    const own = db.findReaderById(req.user.id);
    if (!own) return res.json([]);
    filter.readerId = own.id;
  } else if (req.user.role === 'client') {
    filter.clientId = req.user.id;
  }
  res.json(db.getConsultations(filter).filter(c => c.status === 'completed'));
});

// ----------------------------------------------------
// ROTAS DE AGENDAMENTO DE CONSULTAS
// ----------------------------------------------------
// Dados de contato (telefone/WhatsApp) nunca saem do servidor: o atendimento acontece pelo site.
function presentAppointment(a) {
  const reader = db.findReaderById(a.readerId);
  const { clientPhone, ...rest } = a;
  return { ...rest, readerAvatar: reader?.avatar || a.readerAvatar, readerName: reader?.name || a.readerName };
}

// Reservas que ainda ocupam a agenda do oraculista
function activeBusy(readerId) {
  const now = Date.now();
  return db.getAppointments({ readerId })
    .filter(a => APPOINTMENT_ACTIVE.includes(a.status) && new Date(a.scheduledAt).getTime() + a.durationMinutes * 60000 > now)
    .map(a => ({ scheduledAt: a.scheduledAt, durationMinutes: a.durationMinutes }));
}

// Horários livres (instantes em ISO/UTC), calculados a partir da agenda do próprio oraculista
app.get('/api/readers/:id/availability', (req, res) => {
  const reader = db.findReaderById(req.params.id);
  if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  const duration = parseInt(req.query.duration, 10) || 30;
  if (!APPOINTMENT_DURATIONS.includes(duration)) return res.status(400).json({ error: 'Duração inválida.' });

  const approved = reader.isApproved || reader.approvalStatus === 'approved';
  const schedule = getSchedule(reader);
  res.json({
    timezone: schedule.timezone,
    duration,
    slots: approved ? availableSlots(schedule, duration, activeBusy(reader.id)) : []
  });
});

app.post('/api/appointments', authenticate, (req, res) => {
  try {
    const { readerId, type, scheduledAt, durationMinutes, notes } = req.body;
    const clientId = req.user.id;

    const client = db.findUserById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(403).json({ error: 'Entre com uma conta de consulente para agendar.' });
    }
    const reader = db.findReaderById(readerId);
    if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });
    if (!reader.isApproved && reader.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'Este oraculista ainda não está liberado para atendimentos.' });
    }
    if (!APPOINTMENT_TYPES.includes(type)) return res.status(400).json({ error: 'Escolha vídeo ou áudio.' });
    const minutes = parseInt(durationMinutes, 10);
    if (!APPOINTMENT_DURATIONS.includes(minutes)) return res.status(400).json({ error: 'Duração inválida.' });

    const start = new Date(scheduledAt);
    if (isNaN(start.getTime())) return res.status(400).json({ error: 'Data e horário inválidos.' });
    const iso = start.toISOString();

    // O horário precisa existir na agenda do oraculista e estar livre
    const schedule = getSchedule(reader);
    if (!availableSlots(schedule, minutes, activeBusy(reader.id)).includes(iso)) {
      if (availableSlots(schedule, minutes, []).includes(iso)) {
        return res.status(409).json({ error: 'Esse horário acabou de ser reservado. Escolha outro, por favor.' });
      }
      return res.status(400).json({ error: 'Esse horário não está disponível na agenda do oraculista.' });
    }

    const appt = db.createAppointment({
      clientId: client.id,
      clientName: client.name,
      readerId: reader.id,
      readerName: reader.name,
      readerAvatar: reader.avatar,
      pricePerMinute: reader.pricePerMinute,
      type,
      durationMinutes: minutes,
      scheduledAt: iso,
      notes: String(notes || '').slice(0, 500)
    });

    // Avisa o oraculista na hora, se estiver conectado
    if (reader.userId) io.to(userRoom(reader.userId)).emit('appointment-requested', { appointmentId: appt.id, clientName: client.name, scheduledAt: iso });

    res.status(201).json(presentAppointment(appt));
  } catch (err) {
    console.error('Erro ao agendar:', err);
    res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
});

// Lista os agendamentos de quem está logado (cliente = os seus, oraculista = os recebidos)
app.get('/api/appointments', authenticate, (req, res) => {
  const user = req.user;

  let list;
  if (user.role === 'reader') {
    const reader = db.findReaderById(user.id);
    list = reader ? db.getAppointments({ readerId: reader.id }) : [];
  } else if (user.role === 'admin') {
    list = db.getAppointments();
  } else {
    list = db.getAppointments({ clientId: user.id });
  }
  res.json(list.map(presentAppointment));
});

// action: confirm | decline (oraculista) · cancel (cliente ou oraculista)
app.put('/api/appointments/:id', authenticate, (req, res) => {
  const { action } = req.body;
  const user = req.user;
  const appt = db.findAppointmentById(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Agendamento não encontrado.' });

  const reader = db.findReaderById(appt.readerId);
  const isReaderOwner = user.role === 'reader' && reader && reader.userId === user.id;
  const isClientOwner = user.role === 'client' && appt.clientId === user.id;
  if (!isReaderOwner && !isClientOwner) return res.status(403).json({ error: 'Sem permissão para alterar este agendamento.' });

  let status;
  if ((action === 'confirm' || action === 'decline') && isReaderOwner && appt.status === 'pending') {
    status = action === 'confirm' ? 'confirmed' : 'declined';
  } else if (action === 'cancel' && APPOINTMENT_ACTIVE.includes(appt.status)) {
    status = 'cancelled';
  } else {
    return res.status(400).json({ error: 'Ação não permitida para o status atual.' });
  }

  const updated = db.updateAppointment(appt.id, { status });

  // Avisa a outra parte em tempo real
  const otherUserId = isReaderOwner ? appt.clientId : reader?.userId;
  if (otherUserId) io.to(userRoom(otherUserId)).emit('appointment-updated', { appointmentId: appt.id, status });

  res.json(presentAppointment(updated));
});

// ----------------------------------------------------
// ROTAS DE CARTEIRA E RECARGA
// ----------------------------------------------------
app.get('/api/wallet/packages', (req, res) => {
  res.json(db.getPricingPackages());
});

app.get('/api/wallet/transactions/:userId', authenticate, (req, res) => {
  res.json(db.getTransactions(req.user.id)); // sempre as de quem está logado
});

// ATENÇÃO: este endpoint SIMULA o pagamento PIX (credita sem cobrar de verdade).
// Antes de operar com dinheiro real, integre um gateway (Mercado Pago, Asaas, Pagar.me...)
// confirmando o pagamento por webhook, e defina PAYMENT_SIMULATION=off no .env.
app.post('/api/wallet/recharge', ...requireRole('client'), (req, res) => {
  try {
    if (process.env.PAYMENT_SIMULATION === 'off') {
      return res.status(403).json({ error: 'Pagamentos online ainda não estão ativos neste ambiente.' });
    }
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 5 || amount > 1000) {
      return res.status(400).json({ error: 'Valor de recarga inválido (entre R$ 5,00 e R$ 1.000,00).' });
    }
    // O bônus vem do pacote correspondente; nunca do que o navegador envia
    const pkg = db.getPricingPackages().find(p => p.price === amount);
    const bonus = pkg ? pkg.bonus : 0;

    const user = req.user;
    const totalCredit = parseFloat((amount + bonus).toFixed(2));
    const updated = db.updateUser(user.id, {
      balance: parseFloat((user.balance + totalCredit).toFixed(2))
    });

    const tx = db.createTransaction({
      userId: user.id,
      type: 'credit_recharge',
      amount: totalCredit,
      description: `Recarga PIX Aprovada (+R$ ${totalCredit.toFixed(2)}${bonus > 0 ? ` incl. R$ ${bonus} de bônus` : ''})`
    });

    res.json({
      user: publicUser(updated),
      transaction: tx,
      message: 'Recarga confirmada com sucesso!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro na recarga.' });
  }
});

// ----------------------------------------------------
// ROTAS DO TARÔ E MESA VIRTUAL
// ----------------------------------------------------
app.get('/api/tarot/deck', (req, res) => {
  res.json(tarotDeck);
});

app.get('/api/tarot/draw', (req, res) => {
  const count = parseInt(req.query.count || '3');
  const shuffled = [...tarotDeck].sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, count));
});

// ----------------------------------------------------
// WEBSOCKET & WEBRTC SIGNALING
// ----------------------------------------------------
const rooms = new Map();

// Quem pode entrar numa sala: só os dois participantes da consulta em andamento
function canJoinRoom(userId, roomId) {
  if (!userId) return { ok: false };
  const cons = db.getConsultations().find(c => c.roomId === roomId);
  if (!cons || !['ringing', 'in_progress'].includes(cons.status)) return { ok: false };
  const reader = db.findReaderById(cons.readerId);
  const ok = cons.clientId === userId || reader?.userId === userId;
  return { ok, cons };
}

// Autentica cada conexão pelo cookie HttpOnly (visitantes sem login conectam sem identidade)
io.use((socket, next) => {
  const session = sessionFromCookieHeader(socket.handshake.headers.cookie);
  socket.data.userId = session ? session.user.id : null;
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // A identidade vem do cookie de sessão (veja io.use acima); aqui só entramos na "sala pessoal"
  if (socket.data.userId) {
    socket.join(userRoom(socket.data.userId));
    const me = db.findUserById(socket.data.userId);
    if (me?.role === 'reader') broadcastReaderPresence(db.findReaderById(me.id));
  }

  const afterPresenceChange = (userId) => {
    // pequena folga: atualizar a página não deve derrubar o oraculista para "offline"
    setTimeout(() => {
      const user = db.findUserById(userId);
      if (user?.role === 'reader') broadcastReaderPresence(db.findReaderById(user.id));
    }, 5000);
  };

  socket.on('join-room', ({ roomId, userName, role, callType }) => {
    const access = canJoinRoom(socket.data.userId, roomId);
    if (!access.ok) {
      socket.emit('room-denied');
      return;
    }

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        callType: callType || 'video',
        tableCards: []
      });
    }

    const room = rooms.get(roomId);
    room.participants.set(socket.id, {
      name: userName,
      role,
      userId: socket.data.userId,
      socketId: socket.id
    });

    // Os dois lados já estiveram na sala: a consulta passa a ser cobrável
    const distinctUsers = new Set([...room.participants.values()].map(p => p.userId));
    if (distinctUsers.size >= 2 && !access.cons.connectedAt) {
      db.updateConsultation(access.cons.id, { connectedAt: new Date().toISOString() });
    }

    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName,
      role
    });

    socket.emit('tarot-table-sync', { cards: room.tableCards });

    const otherParticipants = Array.from(room.participants.entries())
      .filter(([id]) => id !== socket.id)
      .map(([id, info]) => info);

    socket.emit('room-users', otherParticipants);
  });

  // Sinalização WebRTC: só entre integrantes da mesma sala
  const sameRoom = (roomId, to) =>
    socket.rooms.has(roomId) && io.sockets.adapter.rooms.get(roomId)?.has(to);

  socket.on('webrtc-offer', ({ roomId, to, offer }) => {
    if (sameRoom(roomId, to)) io.to(to).emit('webrtc-offer', { from: socket.id, offer });
  });

  socket.on('webrtc-answer', ({ roomId, to, answer }) => {
    if (sameRoom(roomId, to)) io.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, to, candidate }) => {
    if (sameRoom(roomId, to)) io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  socket.on('tarot-draw-card', ({ roomId, card, spreadPosition }) => {
    if (!socket.rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room) {
      room.tableCards.push({ card, spreadPosition, drawnAt: new Date().toISOString() });
      io.in(roomId).emit('tarot-card-revealed', {
        card,
        spreadPosition,
        allCards: room.tableCards
      });
    }
  });

  socket.on('tarot-clear-table', ({ roomId }) => {
    if (!socket.rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room) {
      room.tableCards = [];
      io.in(roomId).emit('tarot-table-sync', { cards: [] });
    }
  });

  socket.on('chat-message', ({ roomId, sender, message }) => {
    if (!socket.rooms.has(roomId)) return;
    io.in(roomId).emit('chat-message', {
      sender: String(sender || '').slice(0, 60),
      message: String(message || '').slice(0, 1000),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  });

  // Câmera ligada/desligada: avisa a outra pessoa para mostrar a foto no lugar do vídeo
  socket.on('media-state', ({ roomId, videoOff }) => {
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('media-state', { videoOff: !!videoOff });
  });

  // Avisa só a OUTRA pessoa (quem encerrou já sabe)
  socket.on('end-call', ({ roomId }) => {
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('call-ended-by-peer');
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Desconectado: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        socket.to(roomId).emit('user-left', { socketId: socket.id });
        if (room.participants.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
    if (socket.data.userId) afterPresenceChange(socket.data.userId);
  });
});

// ----------------------------------------------------
// SERVIÇOS DE APOIO: servidores ICE (STUN/TURN), limpeza de chamadas travadas e site estático
// ----------------------------------------------------
// STUN ajuda a conectar; em redes de celular (4G/5G) normalmente é preciso um servidor TURN também.
// Configure TURN_URL, TURN_USERNAME e TURN_CREDENTIAL no arquivo server/.env
app.get('/api/ice-servers', authenticate, (req, res) => {
  const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (process.env.TURN_URL) {
    servers.push({
      urls: process.env.TURN_URL.split(',').map(u => u.trim()).filter(Boolean),
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL
    });
  }
  res.json(servers);
});

// Se o servidor reiniciar no meio de chamadas, limpa o que ficou pendurado
function recoverStaleConsultations() {
  for (const c of db.getConsultations()) {
    if (c.status === 'ringing') endRinging(c, 'missed');
    else if (c.status === 'in_progress') finalizeConsultation(c);
  }
}
recoverStaleConsultations();

// A cada 30s: encerra atendimentos cuja sala ficou vazia (ex.: celular sem bateria / sem sinal)
const emptySince = new Map();
setInterval(() => {
  const now = Date.now();
  for (const c of db.getConsultations()) {
    if (c.status === 'ringing' && !ringTimers.has(c.id)) {
      endRinging(c, 'missed');
      continue;
    }
    if (c.status !== 'in_progress') {
      emptySince.delete(c.id);
      continue;
    }
    const room = rooms.get(c.roomId);
    if (room && room.participants.size > 0) {
      emptySince.delete(c.id);
      continue;
    }
    const since = emptySince.get(c.id) ?? now;
    emptySince.set(c.id, since);
    if (now - since > ORPHAN_MS) {
      emptySince.delete(c.id);
      finalizeConsultation(c);
    }
  }
}, 30000).unref();

// Em produção o próprio servidor entrega o site (um endereço só, HTTPS no mesmo domínio)
const CLIENT_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  console.log('📱 Servindo o site publicado de client/dist');
}

// ---------- Boot: senhas antigas (texto puro) viram hash bcrypt ----------
async function migratePasswords() {
  let migrated = 0;
  for (const u of db.getUsers()) {
    if (!isHashed(u.password)) {
      db.updateUser(u.id, { password: await hashPassword(u.password || '') });
      migrated++;
    }
  }
  if (migrated) console.log(`🔐 ${migrated} senha(s) antigas foram protegidas com bcrypt.`);

  // Contas de demonstração ainda com a senha padrão?
  const weak = [];
  for (const u of db.getUsers()) {
    if (await verifyPassword('123456', db.findUserById(u.id).password)) weak.push(u);
  }
  const admin = weak.find(u => u.role === 'admin');
  if (admin && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8) {
    db.updateUser(admin.id, { password: await hashPassword(process.env.ADMIN_PASSWORD), tokenVersion: (admin.tokenVersion || 0) + 1 });
    console.log('🔐 Senha do administrador definida a partir de ADMIN_PASSWORD.');
    weak.splice(weak.indexOf(admin), 1);
  }
  if (weak.length) {
    console.warn(`⚠️  ${weak.length} conta(s) ainda usam a senha de demonstração "123456" (${weak.map(u => u.email).join(', ')}).`);
    console.warn('    Antes de publicar: defina ADMIN_PASSWORD no .env e troque/remova as demais contas de teste.');
  }
  if (process.env.PAYMENT_SIMULATION !== 'off') {
    console.warn('⚠️  Recarga PIX em modo SIMULADO (credita sem cobrar). Use PAYMENT_SIMULATION=off ao ligar pagamentos reais.');
  }
}
await migratePasswords();

server.listen(PORT, () => {
  console.log(`🔮 Servidor Conexão Tarot rodando na porta ${PORT}`);
  console.log(`✨ WebSocket e WebRTC Signaling ativos em http://localhost:${PORT}`);
});
