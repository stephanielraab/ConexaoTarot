import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './db.js';
import { tarotDeck } from './tarotData.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

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
  const { password, ...safe } = u;
  return safe;
}

const APPOINTMENT_ACTIVE = ['pending', 'confirmed'];
const APPOINTMENT_TYPES = ['video', 'audio', 'whatsapp'];
const APPOINTMENT_DURATIONS = [15, 30, 60];

// ----------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// ----------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role = 'client', phone, oracles, bio, pricePerMinute, experienceYears } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const newUser = db.createUser({
      name,
      email,
      password,
      role,
      phone: phone || '',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`
    });

    // Se for oraculista, cria perfil de atendimento com status "pending" (EM ANÁLISE)
    let readerProfile = null;
    if (role === 'reader') {
      readerProfile = db.createReader({
        userId: newUser.id,
        name: newUser.name,
        title: 'Oraculista & Terapeuta Holístico',
        bio: bio || 'Bem-vindo(a) ao meu espaço sagrado. Em análise de perfil pela curadoria.',
        oracles: oracles && oracles.length > 0 ? oracles : ['Tarô de Marselha', 'Rider Waite'],
        pricePerMinute: pricePerMinute ? parseFloat(pricePerMinute) : 3.00,
        avatar: newUser.avatar,
        whatsapp: phone || '5511999990000',
        experienceYears: experienceYears ? parseInt(experienceYears) : 3,
        approvalStatus: 'pending',
        isApproved: false,
        status: 'offline'
      });
    }

    res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance,
        avatar: newUser.avatar,
        phone: newUser.phone
      },
      readerProfile
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const readerProfile = user.role === 'reader' ? db.findReaderById(user.id) : null;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        avatar: user.avatar,
        phone: user.phone
      },
      readerProfile
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

app.get('/api/auth/me/:userId', (req, res) => {
  const user = db.findUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const readerProfile = user.role === 'reader' ? db.findReaderById(user.id) : null;
  res.json({ user: publicUser(user), readerProfile });
});

// Atualização de cadastro de usuário (Nome, E-mail, Telefone, Foto e Senha)
app.put('/api/users/:id', (req, res) => {
  try {
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
        return res.status(400).json({ error: 'Oraculistas precisam manter um WhatsApp cadastrado.' });
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
    if (passwordChanged && password.trim().length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    // Trocar e-mail (login) ou senha exige a senha atual
    if (emailChanged || passwordChanged) {
      if (!currentPassword || currentPassword !== user.password) {
        return res.status(403).json({ error: 'Senha atual incorreta. Ela é necessária para alterar e-mail ou senha.' });
      }
    }
    if (passwordChanged) updates.password = password.trim();

    const updatedUser = db.updateUser(user.id, updates);

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
    readers = readers.filter(r => r.approvalStatus === 'approved' || r.isApproved === true);

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
  res.json(reader);
});

app.put('/api/readers/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['available', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const current = db.findReaderById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Oraculista não encontrado.' });

  // Se o oraculista ainda não foi aprovado, não pode ficar disponível
  if (!current.isApproved && current.approvalStatus !== 'approved') {
    return res.status(403).json({ error: 'Seu cadastro ainda está em análise pela curadoria. Aguarde a aprovação antes de alterar seu status.' });
  }

  const updated = db.updateReader(req.params.id, { status });
  
  // Notifica todos os clientes via WebSocket
  io.emit('reader-status-updated', { readerId: updated.id, status: updated.status });
  
  res.json(updated);
});

app.put('/api/readers/:id', (req, res) => {
  const allowed = ['pricePerMinute', 'whatsapp', 'title', 'bio', 'oracles', 'status', 'experienceYears', 'videoCallEnabled', 'audioCallEnabled', 'whatsappEnabled'];
  const safeUpdates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) safeUpdates[key] = req.body[key];
  }
  if (safeUpdates.whatsapp !== undefined) {
    const digits = normalizePhone(safeUpdates.whatsapp);
    if (!isValidPhone(digits)) return res.status(400).json({ error: 'WhatsApp inválido. Informe DDD + número.' });
    safeUpdates.whatsapp = toWhatsapp(digits);
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
app.get('/api/admin/pending-readers', (req, res) => {
  try {
    const allReaders = db.getReaders();
    const pending = allReaders.filter(r => r.approvalStatus === 'pending' || r.isApproved === false);
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar oraculistas pendentes.' });
  }
});

app.get('/api/admin/readers', (req, res) => {
  try {
    res.json(db.getReaders());
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar todos os oraculistas.' });
  }
});

app.post('/api/admin/approve-reader/:id', (req, res) => {
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

app.post('/api/admin/reject-reader/:id', (req, res) => {
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

app.get('/api/admin/stats', (req, res) => {
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
// ----------------------------------------------------
app.post('/api/consultations/start', (req, res) => {
  try {
    const { clientId, readerId, type, appointmentId } = req.body;
    
    const client = db.findUserById(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });

    const reader = db.findReaderById(readerId);
    if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });

    // Verifica se o oraculista está aprovado pela curadoria
    if (!reader.isApproved && reader.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'Este oraculista ainda está sob análise da curadoria e não pode realizar atendimentos.' });
    }

    if (reader.status === 'offline') {
      return res.status(400).json({ error: 'Este oraculista está offline no momento.' });
    }

    const minRequired = reader.pricePerMinute * 3;
    if (client.balance < minRequired) {
      return res.status(402).json({ 
        error: `Saldo insuficiente. É necessário pelo menos R$ ${minRequired.toFixed(2)} (equivalente a 3 minutos) para iniciar o atendimento.`,
        requiredAmount: minRequired,
        currentBalance: client.balance
      });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const consultation = db.createConsultation({
      clientId: client.id,
      clientName: client.name,
      readerId: reader.id,
      readerName: reader.name,
      pricePerMinute: reader.pricePerMinute,
      type,
      roomId,
      startTime: new Date().toISOString()
    });

    // Se veio de um agendamento confirmado, marca como realizado
    if (appointmentId) {
      const appt = db.findAppointmentById(appointmentId);
      if (appt && appt.clientId === client.id && appt.readerId === reader.id && appt.status === 'confirmed') {
        db.updateAppointment(appt.id, { status: 'completed', consultationId: consultation.id });
      }
    }

    // Coloca status como ocupado
    db.updateReader(reader.id, { status: 'busy' });
    io.emit('reader-status-updated', { readerId: reader.id, status: 'busy' });

    res.json({
      consultation,
      roomId,
      maxMinutes: Math.floor(client.balance / reader.pricePerMinute),
      whatsappLink: type === 'whatsapp' ? `https://wa.me/${reader.whatsapp}?text=${encodeURIComponent(`Olá ${reader.name}! Sou ${client.name}, acabei de iniciar um atendimento via Conexão Tarot (Atendimento #${consultation.id}). Podemos iniciar?`)}` : null
    });
  } catch (err) {
    console.error('Erro ao iniciar consulta:', err);
    res.status(500).json({ error: 'Erro ao iniciar consulta.' });
  }
});

app.post('/api/consultations/:id/end', (req, res) => {
  try {
    const { durationMinutes, notes } = req.body;
    const cons = db.getConsultations().find(c => c.id === req.params.id);
    if (!cons) return res.status(404).json({ error: 'Consulta não encontrada.' });

    const minutes = Math.max(1, Math.round(durationMinutes || 1));
    const cost = parseFloat((minutes * cons.pricePerMinute).toFixed(2));

    // REPARTIÇÃO: 20% para a plataforma / 80% para o oraculista
    const platformFee = parseFloat((cost * 0.20).toFixed(2));
    const readerEarnings = parseFloat((cost * 0.80).toFixed(2));

    // 1. Debita do cliente
    const client = db.findUserById(cons.clientId);
    if (client) {
      const newClientBalance = Math.max(0, client.balance - cost);
      db.updateUser(client.id, { balance: parseFloat(newClientBalance.toFixed(2)) });
      
      db.createTransaction({
        userId: client.id,
        type: 'consultation_debit',
        amount: cost,
        description: `Atendimento (${cons.type}) com ${cons.readerName} - ${minutes} min`
      });
    }

    // 2. Credita o oraculista (80%)
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

    // 3. Credita a plataforma / administrador (20%)
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

    // 4. Retorna status do oraculista para disponível
    if (reader) {
      db.updateReader(reader.id, {
        status: 'available',
        consultationsCount: (reader.consultationsCount || 0) + 1
      });
      io.emit('reader-status-updated', { readerId: reader.id, status: 'available' });
    }

    const updatedCons = db.updateConsultation(cons.id, {
      status: 'completed',
      endTime: new Date().toISOString(),
      durationMinutes: minutes,
      cost,
      platformFee,
      readerEarnings,
      notes: notes || ''
    });

    res.json({
      consultation: updatedCons,
      cost,
      minutes,
      platformFee,
      readerEarnings,
      remainingBalance: client ? client.balance : 0
    });
  } catch (err) {
    console.error('Erro ao finalizar consulta:', err);
    res.status(500).json({ error: 'Erro ao finalizar consulta.' });
  }
});

app.post('/api/consultations/:id/review', (req, res) => {
  const { rating, review } = req.body;
  const updated = db.updateConsultation(req.params.id, {
    rating: parseInt(rating),
    review
  });
  if (!updated) return res.status(404).json({ error: 'Consulta não encontrada.' });
  res.json(updated);
});

app.get('/api/consultations', (req, res) => {
  const { userId, role } = req.query;
  const filter = {};
  if (role === 'reader') filter.readerId = userId;
  else if (userId) filter.clientId = userId;
  res.json(db.getConsultations(filter));
});

// ----------------------------------------------------
// ROTAS DE AGENDAMENTO DE CONSULTAS
// ----------------------------------------------------
// Visão do agendamento conforme quem está olhando (contatos só aparecem após confirmação)
function presentAppointment(a, viewerRole) {
  const reader = db.findReaderById(a.readerId);
  const confirmed = a.status === 'confirmed';
  const { clientPhone, ...rest } = a;
  const out = { ...rest, readerAvatar: reader?.avatar || a.readerAvatar, readerName: reader?.name || a.readerName };
  if (viewerRole === 'reader' && confirmed) out.clientPhone = clientPhone;
  if (viewerRole === 'client' && confirmed && reader) out.readerWhatsapp = reader.whatsapp;
  if (viewerRole === 'admin') { out.clientPhone = clientPhone; }
  return out;
}

const overlaps = (aStart, aMin, bStart, bMin) =>
  aStart < bStart + bMin * 60000 && bStart < aStart + aMin * 60000;

// Horários já ocupados de um oraculista (sem dados pessoais)
app.get('/api/readers/:id/busy', (req, res) => {
  const reader = db.findReaderById(req.params.id);
  if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });
  const now = Date.now();
  const busy = db.getAppointments({ readerId: reader.id })
    .filter(a => APPOINTMENT_ACTIVE.includes(a.status) && new Date(a.scheduledAt).getTime() + a.durationMinutes * 60000 > now)
    .map(a => ({ scheduledAt: a.scheduledAt, durationMinutes: a.durationMinutes }));
  res.json(busy);
});

app.post('/api/appointments', (req, res) => {
  try {
    const { clientId, readerId, type, scheduledAt, durationMinutes, notes } = req.body;

    const client = db.findUserById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(403).json({ error: 'Entre com uma conta de consulente para agendar.' });
    }
    const reader = db.findReaderById(readerId);
    if (!reader) return res.status(404).json({ error: 'Oraculista não encontrado.' });
    if (!reader.isApproved && reader.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'Este oraculista ainda não está liberado para atendimentos.' });
    }
    if (!APPOINTMENT_TYPES.includes(type)) return res.status(400).json({ error: 'Escolha o tipo de atendimento.' });
    const minutes = parseInt(durationMinutes, 10);
    if (!APPOINTMENT_DURATIONS.includes(minutes)) return res.status(400).json({ error: 'Duração inválida.' });

    const start = new Date(scheduledAt);
    if (isNaN(start.getTime())) return res.status(400).json({ error: 'Data e horário inválidos.' });
    const now = Date.now();
    if (start.getTime() < now + 30 * 60000) {
      return res.status(400).json({ error: 'Escolha um horário com pelo menos 30 minutos de antecedência.' });
    }
    if (start.getTime() > now + 30 * 86400000) {
      return res.status(400).json({ error: 'Só é possível agendar para os próximos 30 dias.' });
    }
    if (start.getUTCMinutes() % 30 !== 0) {
      return res.status(400).json({ error: 'Escolha um dos horários disponíveis (de 30 em 30 minutos).' });
    }

    const startMs = start.getTime();
    const conflict = db.getAppointments({ readerId: reader.id }).some(a =>
      APPOINTMENT_ACTIVE.includes(a.status) &&
      overlaps(startMs, minutes, new Date(a.scheduledAt).getTime(), a.durationMinutes)
    );
    if (conflict) {
      return res.status(409).json({ error: 'Esse horário acabou de ser reservado. Escolha outro, por favor.' });
    }

    const appt = db.createAppointment({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || '',
      readerId: reader.id,
      readerName: reader.name,
      readerAvatar: reader.avatar,
      pricePerMinute: reader.pricePerMinute,
      type,
      durationMinutes: minutes,
      scheduledAt: start.toISOString(),
      notes: String(notes || '').slice(0, 500)
    });

    res.status(201).json(presentAppointment(appt, 'client'));
  } catch (err) {
    console.error('Erro ao agendar:', err);
    res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
});

// Lista os agendamentos de quem está logado (cliente = os seus, oraculista = os recebidos)
app.get('/api/appointments', (req, res) => {
  const user = db.findUserById(req.query.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  let list;
  if (user.role === 'reader') {
    const reader = db.findReaderById(user.id);
    list = reader ? db.getAppointments({ readerId: reader.id }) : [];
  } else if (user.role === 'admin') {
    list = db.getAppointments();
  } else {
    list = db.getAppointments({ clientId: user.id });
  }
  res.json(list.map(a => presentAppointment(a, user.role)));
});

// action: confirm | decline (oraculista) · cancel (cliente ou oraculista)
app.put('/api/appointments/:id', (req, res) => {
  const { userId, action } = req.body;
  const user = db.findUserById(userId);
  const appt = db.findAppointmentById(req.params.id);
  if (!user || !appt) return res.status(404).json({ error: 'Agendamento não encontrado.' });

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
  res.json(presentAppointment(updated, user.role));
});

// ----------------------------------------------------
// ROTAS DE CARTEIRA E RECARGA
// ----------------------------------------------------
app.get('/api/wallet/packages', (req, res) => {
  res.json(db.getPricingPackages());
});

app.get('/api/wallet/transactions/:userId', (req, res) => {
  res.json(db.getTransactions(req.params.userId));
});

app.post('/api/wallet/recharge', (req, res) => {
  try {
    const { userId, amount, bonus = 0 } = req.body;
    const user = db.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const totalCredit = parseFloat(amount) + parseFloat(bonus);
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
      user: updated,
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

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  socket.on('join-room', ({ roomId, userName, role, callType }) => {
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
      socketId: socket.id
    });

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

  socket.on('webrtc-offer', ({ roomId, to, offer }) => {
    io.to(to).emit('webrtc-offer', { from: socket.id, offer });
  });

  socket.on('webrtc-answer', ({ roomId, to, answer }) => {
    io.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, to, candidate }) => {
    io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  socket.on('tarot-draw-card', ({ roomId, card, spreadPosition }) => {
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
    const room = rooms.get(roomId);
    if (room) {
      room.tableCards = [];
      io.in(roomId).emit('tarot-table-sync', { cards: [] });
    }
  });

  socket.on('chat-message', ({ roomId, sender, message }) => {
    io.in(roomId).emit('chat-message', {
      sender,
      message,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('end-call', ({ roomId }) => {
    io.in(roomId).emit('call-ended-by-peer');
    rooms.delete(roomId);
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
  });
});

server.listen(PORT, () => {
  console.log(`🔮 Servidor Conexão Tarot rodando na porta ${PORT}`);
  console.log(`✨ WebSocket e WebRTC Signaling ativos em http://localhost:${PORT}`);
});
