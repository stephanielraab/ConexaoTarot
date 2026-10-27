const API_BASE = '/api';

export const api = {
  // Autenticação
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no login');
    return data;
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
    return data;
  },

  getMe: async (userId) => {
    const res = await fetch(`${API_BASE}/auth/me/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuário');
    return data;
  },

  updateUser: async (userId, updates) => {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
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

    const res = await fetch(`${API_BASE}/readers?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao listar oraculistas');
    return res.json();
  },

  getReader: async (id) => {
    const res = await fetch(`${API_BASE}/readers/${id}`);
    if (!res.ok) throw new Error('Oraculista não encontrado');
    return res.json();
  },

  updateReaderStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/readers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    return res.json();
  },

  updateReaderProfile: async (id, updates) => {
    const res = await fetch(`${API_BASE}/readers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Erro ao atualizar perfil');
    return res.json();
  },

  // Atendimentos e Consultas
  startConsultation: async (clientId, readerId, type, appointmentId = null) => {
    const res = await fetch(`${API_BASE}/consultations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, readerId, type, appointmentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o atendimento');
    return data;
  },

  endConsultation: async (consultationId, durationMinutes, notes = '') => {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao finalizar atendimento');
    return data;
  },

  reviewConsultation: async (consultationId, rating, review) => {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review })
    });
    return res.json();
  },

  getConsultations: async (userId, role) => {
    const res = await fetch(`${API_BASE}/consultations?userId=${userId}&role=${role}`);
    return res.json();
  },

  // Agendamentos
  getReaderBusySlots: async (readerId) => {
    const res = await fetch(`${API_BASE}/readers/${readerId}/busy`);
    if (!res.ok) throw new Error('Erro ao carregar horários');
    return res.json();
  },

  createAppointment: async (payload) => {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao agendar consulta');
    return data;
  },

  getAppointments: async (userId) => {
    const res = await fetch(`${API_BASE}/appointments?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar agendamentos');
    return data;
  },

  updateAppointment: async (id, userId, action) => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
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
    const res = await fetch(`${API_BASE}/wallet/packages`);
    return res.json();
  },

  getTransactions: async (userId) => {
    const res = await fetch(`${API_BASE}/wallet/transactions/${userId}`);
    return res.json();
  },

  rechargeBalance: async (userId, amount, bonus = 0) => {
    const res = await fetch(`${API_BASE}/wallet/recharge`, {
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
    const res = await fetch(`${API_BASE}/admin/pending-readers`);
    if (!res.ok) throw new Error('Erro ao buscar oraculistas pendentes');
    return res.json();
  },

  getAllReadersAdmin: async () => {
    const res = await fetch(`${API_BASE}/admin/readers`);
    if (!res.ok) throw new Error('Erro ao buscar todos os oraculistas');
    return res.json();
  },

  approveReader: async (id) => {
    const res = await fetch(`${API_BASE}/admin/approve-reader/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao aprovar oraculista');
    return data;
  },

  rejectReader: async (id, reason) => {
    const res = await fetch(`${API_BASE}/admin/reject-reader/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao recusar oraculista');
    return data;
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Erro ao carregar estatísticas do admin');
    return res.json();
  },

  // Tarô
  getTarotDeck: async () => {
    const res = await fetch(`${API_BASE}/tarot/deck`);
    return res.json();
  },

  drawCards: async (count = 3) => {
    const res = await fetch(`${API_BASE}/tarot/draw?count=${count}`);
    return res.json();
  }
};
