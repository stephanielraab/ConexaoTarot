const API_BASE = '/api';

// Todas as chamadas levam o cookie de sessão (HttpOnly: o JavaScript do site nunca enxerga o token).
// Se o servidor disser que a sessão acabou (401), avisamos o App para pedir o login de novo.
async function request(url, options = {}) {
  const { silent401, ...init } = options;
  let res;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...init });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se ele está ligado (npm run dev) e a sua internet.');
  }
  if (res.status === 401 && !silent401) window.dispatchEvent(new Event('auth-expired'));
  return res;
}

export const api = {
  // Autenticação
  login: async (email, password) => {
    const res = await request(`${API_BASE}/auth/login`, {
      silent401: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no login');
    return data;
  },

  register: async (payload) => {
    const res = await request(`${API_BASE}/auth/register`, {
      silent401: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
    return data;
  },

  // Quem está logado agora (valida o cookie de sessão)
  getMe: async () => {
    const res = await request(`${API_BASE}/auth/me`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuário');
    return data;
  },

  logout: async () => {
    try {
      await request(`${API_BASE}/auth/logout`, { method: 'POST', silent401: true });
    } catch { /* sem rede: o cookie expira sozinho */ }
  },

  updateUser: async (userId, updates) => {
    const res = await request(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados');
    return data;
  },

  // Oraculistas
  getReaders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.oracle && filters.oracle !== 'all') params.append('oracle', filters.oracle);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const res = await request(`${API_BASE}/readers?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao listar oraculistas');
    return res.json();
  },

  getReader: async (id) => {
    const res = await request(`${API_BASE}/readers/${id}`);
    if (!res.ok) throw new Error('Oraculista não encontrado');
    return res.json();
  },

  updateReaderStatus: async (id, status) => {
    const res = await request(`${API_BASE}/readers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    return res.json();
  },

  updateReaderProfile: async (id, updates) => {
    const res = await request(`${API_BASE}/readers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Erro ao atualizar perfil');
    return res.json();
  },

  // Atendimentos e Consultas
  startConsultation: async (clientId, readerId, type, appointmentId = null) => {
    const res = await request(`${API_BASE}/consultations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, readerId, type, appointmentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o atendimento');
    return data;
  },

  acceptConsultation: async (consultationId, userId) => {
    const res = await request(`${API_BASE}/consultations/${consultationId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível atender a chamada');
    return data;
  },

  // Recusa (oraculista) ou cancela (cliente) uma chamada que ainda está tocando
  cancelConsultation: async (consultationId, userId) => {
    const res = await request(`${API_BASE}/consultations/${consultationId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json().catch(() => ({}));
  },

  getIceServers: async () => {
    try {
      const res = await request(`${API_BASE}/ice-servers`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  },

  endConsultation: async (consultationId) => {
    const res = await request(`${API_BASE}/consultations/${consultationId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao finalizar atendimento');
    return data;
  },

  reviewConsultation: async (consultationId, rating, review) => {
    const res = await request(`${API_BASE}/consultations/${consultationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review })
    });
    return res.json();
  },

  getConsultations: async (userId, role) => {
    const res = await request(`${API_BASE}/consultations?userId=${userId}&role=${role}`);
    return res.json();
  },

  // Agendamentos
  getReaderAvailability: async (readerId, duration) => {
    const res = await request(`${API_BASE}/readers/${readerId}/availability?duration=${duration}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar horários');
    return data; // { timezone, duration, slots: [ISO...] }
  },

  createAppointment: async (payload) => {
    const res = await request(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao agendar consulta');
    return data;
  },

  getAppointments: async (userId) => {
    const res = await request(`${API_BASE}/appointments?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar agendamentos');
    return data;
  },

  updateAppointment: async (id, userId, action) => {
    const res = await request(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar agendamento');
    return data;
  },

  // Carteira e Recargas
  getPackages: async () => {
    const res = await request(`${API_BASE}/wallet/packages`);
    return res.json();
  },

  getTransactions: async (userId) => {
    const res = await request(`${API_BASE}/wallet/transactions/${userId}`);
    return res.json();
  },

  rechargeBalance: async (userId, amount, bonus = 0) => {
    const res = await request(`${API_BASE}/wallet/recharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, bonus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na recarga');
    return data;
  },

  // Admin & Curadoria de Oraculistas
  getPendingReaders: async () => {
    const res = await request(`${API_BASE}/admin/pending-readers`);
    if (!res.ok) throw new Error('Erro ao buscar oraculistas pendentes');
    return res.json();
  },

  getAllReadersAdmin: async () => {
    const res = await request(`${API_BASE}/admin/readers`);
    if (!res.ok) throw new Error('Erro ao buscar todos os oraculistas');
    return res.json();
  },

  approveReader: async (id) => {
    const res = await request(`${API_BASE}/admin/approve-reader/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao aprovar oraculista');
    return data;
  },

  rejectReader: async (id, reason) => {
    const res = await request(`${API_BASE}/admin/reject-reader/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao recusar oraculista');
    return data;
  },

  getAdminStats: async () => {
    const res = await request(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Erro ao carregar estatísticas do admin');
    return res.json();
  },

  // Tarô
  getTarotDeck: async () => {
    const res = await request(`${API_BASE}/tarot/deck`);
    return res.json();
  },

  drawCards: async (count = 3) => {
    const res = await request(`${API_BASE}/tarot/draw?count=${count}`);
    return res.json();
  }
};
