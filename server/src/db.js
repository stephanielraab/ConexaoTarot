import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const INITIAL_DATA = {
  users: [
    {
      id: "usr_admin",
      name: "Administrador Conexão Tarot",
      email: "admin@conexaotarot.com.br",
      password: "123456",
      role: "admin",
      phone: "11999999999",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
      balance: 142.40, // 20% das consultas realizadas acumulado
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_client_1",
      name: "Camila Ribeiro",
      email: "cliente@conexaotarot.com.br",
      password: "123456",
      role: "client",
      phone: "11988887777",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      balance: 60.00,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_reader_1",
      name: "Helena Siqueira",
      email: "helena@conexaotarot.com.br",
      password: "123456",
      role: "reader",
      phone: "11999990001",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      balance: 1450.00,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_reader_2",
      name: "Alexandre Cósmico",
      email: "alexandre@conexaotarot.com.br",
      password: "123456",
      role: "reader",
      phone: "11999990002",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      balance: 980.00,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_reader_3",
      name: "Yara do Oriente",
      email: "yara@conexaotarot.com.br",
      password: "123456",
      role: "reader",
      phone: "11999990003",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      balance: 2130.00,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_reader_pending_1",
      name: "Solange Mística",
      email: "solange@conexaotarot.com.br",
      password: "123456",
      role: "reader",
      phone: "11977776666",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      balance: 0.00,
      createdAt: new Date().toISOString()
    }
  ],
  readers: [
    {
      id: "reader_1",
      userId: "usr_reader_1",
      name: "Helena Siqueira",
      title: "Mestra em Tarô de Marselha & Terapeuta Floral",
      bio: "Com mais de 12 anos dedicados aos mistérios oraculares, conduzo leituras profundas e acolhedoras com foco em direcionamento amoroso, equilíbrio emocional e abertura de caminhos financeiros.",
      oracles: ["Tarô de Marselha", "Rider Waite", "Terapia Floral", "Chakras"],
      pricePerMinute: 3.20,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      status: "available",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.98,
      consultationsCount: 1420,
      whatsapp: "5511999990001",
      experienceYears: 12,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: true
    },
    {
      id: "reader_2",
      userId: "usr_reader_2",
      name: "Alexandre Cósmico",
      title: "Astrologia Kármica & Runas Nórdicas",
      bio: "Especialista em trânsitos planetários, Runas dos Deuses e Tarô Mitológico. Minhas consultas trazem clareza cristalina para tomadas de decisão importantes e ciclos de vida.",
      oracles: ["Runas Nórdicas", "Tarô Mitológico", "Astrologia Kármica", "Geometria Sagrada"],
      pricePerMinute: 3.80,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      status: "available",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.92,
      consultationsCount: 890,
      whatsapp: "5511999990002",
      experienceYears: 9,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: true
    },
    {
      id: "reader_3",
      userId: "usr_reader_3",
      name: "Yara do Oriente",
      title: "Alta Sacerdotisa de Baralho Cigano & Búzios",
      bio: "Descendente de linhagem cigana e oraculista consagrada. Leitura direta, sem rodeios e com respostas precisas para o amor, família, negócios e proteção espiritual.",
      oracles: ["Baralho Cigano (Lenormand)", "Jogo de Búzios", "Mesa Radiônica", "Banhos de Ervas"],
      pricePerMinute: 3.50,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      status: "available",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.99,
      consultationsCount: 2310,
      whatsapp: "5511999990003",
      experienceYears: 15,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: true
    },
    {
      id: "reader_4",
      userId: "usr_reader_4",
      name: "Dra. Serena Luz",
      title: "Taróloga Terapêutica & Harmonização Energética",
      bio: "Psicoterapeuta holística unindo arquétipos do tarô ao despertar da consciência. Consultas profundas para desfazer bloqueios e resgatar o amor-próprio.",
      oracles: ["Tarô Terapêutico", "Pêndulo Hebreu", "Alinhamento Energético", "Tarô das Sombras"],
      pricePerMinute: 2.90,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      status: "busy",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.88,
      consultationsCount: 654,
      whatsapp: "5511999990004",
      experienceYears: 7,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: false
    },
    {
      id: "reader_5",
      userId: "usr_reader_5",
      name: "Daniel Esotérico",
      title: "Tarô dos Anjos & Cabala Prática",
      bio: "Conexão com as 72 inteligências angélicas e sabedoria cabalística. Encontre mensagens divinas de conforto, iluminação e caminhos de superação.",
      oracles: ["Tarô dos Anjos", "Cabala Mística", "Salmos de Poder", "Tarô Egípcio"],
      pricePerMinute: 3.90,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      status: "available",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.95,
      consultationsCount: 1120,
      whatsapp: "5511999990005",
      experienceYears: 10,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: false
    },
    {
      id: "reader_6",
      userId: "usr_reader_6",
      name: "Morgana das Ervas",
      title: "Tarô das Bruxas & Sabedoria Ancestral",
      bio: "Praticante de bruxaria natural e oráculos intuitivos. Revelações sobre feitiços naturais, banhos de atração, prosperidade e cortes de energias densas.",
      oracles: ["Tarô das Bruxas", "Oráculo das Deusas", "Fitoterapia Mágica", "Leitura de Chamas"],
      pricePerMinute: 2.80,
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80",
      status: "available",
      approvalStatus: "approved",
      isApproved: true,
      rating: 4.91,
      consultationsCount: 520,
      whatsapp: "5511999990006",
      experienceYears: 6,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: false
    },
    {
      id: "reader_pending_1",
      userId: "usr_reader_pending_1",
      name: "Solange Mística",
      title: "Terapeuta Holística & Leitora de Baralho Cigano",
      bio: "Atuo há 4 anos com cartas ciganas e radiestesia. Busco aprovação para começar a atender clientes na Conexão Tarot.",
      oracles: ["Baralho Cigano (Lenormand)", "Radiestesia"],
      pricePerMinute: 2.90,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      status: "offline",
      approvalStatus: "pending", // Em análise!
      isApproved: false,
      rating: 5.0,
      consultationsCount: 0,
      whatsapp: "5511977776666",
      experienceYears: 4,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      featured: false,
      appliedAt: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ],
  consultations: [
    {
      id: "cons_101",
      clientId: "usr_client_1",
      clientName: "Camila Ribeiro",
      readerId: "reader_1",
      readerName: "Helena Siqueira",
      type: "video",
      status: "completed",
      durationMinutes: 15,
      cost: 48.00,
      platformFee: 9.60, // 20%
      readerEarnings: 38.40, // 80%
      rating: 5,
      review: "A Helena foi surrealmente precisa! Descreveu detalhes da minha vida que ninguém sabia e me deu uma paz indescritível.",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "cons_102",
      clientId: "usr_client_1",
      clientName: "Camila Ribeiro",
      readerId: "reader_3",
      readerName: "Yara do Oriente",
      type: "audio",
      status: "completed",
      durationMinutes: 20,
      cost: 70.00,
      platformFee: 14.00, // 20%
      readerEarnings: 56.00, // 80%
      rating: 5,
      review: "Adorei o atendimento por ligação com a Yara. Muito carinho e direcionamento certeiro no amor.",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ],
  appointments: [],
  transactions: [
    {
      id: "tx_1",
      userId: "usr_client_1",
      type: "credit_recharge",
      amount: 100.00,
      status: "completed",
      description: "Recarga de Créditos via PIX",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
    }
  ],
  pricingPackages: [
    { id: "pkg_1", title: "Iniciação Esotérica", price: 30.00, minutesEst: 10, bonus: 0, tag: "Mais Econômico" },
    { id: "pkg_2", title: "Direcionamento dos Arcanos", price: 60.00, minutesEst: 20, bonus: 5, tag: "Mais Popular", featured: true },
    { id: "pkg_3", title: "Clareza Cósmica Integral", price: 100.00, minutesEst: 35, bonus: 15, tag: "+25% Bônus" },
    { id: "pkg_4", title: "Mestre da Sabedoria", price: 200.00, minutesEst: 75, bonus: 40, tag: "Melhor Custo/Minuto" }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler banco de dados:", err);
    return INITIAL_DATA;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Erro ao escrever no banco de dados:", err);
  }
}

export const db = {
  // Usuários
  getUsers: () => readDb().users,
  findUserByEmail: (email) => readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: (id) => readDb().users.find(u => u.id === id),
  createUser: (userData) => {
    const data = readDb();
    const newUser = {
      id: "usr_" + Date.now(),
      balance: userData.role === 'client' ? 25.00 : 0.00, // R$ 25 de bônus de boas-vindas para clientes testarem!
      createdAt: new Date().toISOString(),
      ...userData
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },
  updateUser: (id, updates) => {
    const data = readDb();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      writeDb(data);
      return data.users[index];
    }
    return null;
  },

  // Oraculistas
  getReaders: () => readDb().readers,
  findReaderById: (id) => readDb().readers.find(r => r.id === id || r.userId === id),
  createReader: (readerData) => {
    const data = readDb();
    const newReader = {
      id: "reader_" + Date.now(),
      status: "offline", // Inicia offline até aprovação
      approvalStatus: "pending", // Em análise!
      isApproved: false,
      rating: 5.0,
      consultationsCount: 0,
      videoCallEnabled: true,
      audioCallEnabled: true,
      whatsappEnabled: true,
      appliedAt: new Date().toISOString(),
      ...readerData
    };
    data.readers.push(newReader);
    writeDb(data);
    return newReader;
  },
  updateReader: (id, updates) => {
    const data = readDb();
    const index = data.readers.findIndex(r => r.id === id || r.userId === id);
    if (index !== -1) {
      data.readers[index] = { ...data.readers[index], ...updates };
      writeDb(data);
      return data.readers[index];
    }
    return null;
  },
  approveReader: (id) => {
    const data = readDb();
    const index = data.readers.findIndex(r => r.id === id || r.userId === id);
    if (index !== -1) {
      data.readers[index].approvalStatus = 'approved';
      data.readers[index].isApproved = true;
      data.readers[index].status = 'available';
      data.readers[index].approvedAt = new Date().toISOString();
      writeDb(data);
      return data.readers[index];
    }
    return null;
  },
  rejectReader: (id, reason) => {
    const data = readDb();
    const index = data.readers.findIndex(r => r.id === id || r.userId === id);
    if (index !== -1) {
      data.readers[index].approvalStatus = 'rejected';
      data.readers[index].isApproved = false;
      data.readers[index].status = 'offline';
      data.readers[index].rejectionReason = reason || 'Não atende aos critérios da curadoria neste momento.';
      writeDb(data);
      return data.readers[index];
    }
    return null;
  },

  // Consultas
  getConsultations: (filter = {}) => {
    const data = readDb();
    let res = data.consultations;
    if (filter.clientId) res = res.filter(c => c.clientId === filter.clientId);
    if (filter.readerId) res = res.filter(c => c.readerId === filter.readerId);
    return res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  createConsultation: (consData) => {
    const data = readDb();
    const newCons = {
      id: "cons_" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "in_progress",
      ...consData
    };
    data.consultations.unshift(newCons);
    writeDb(data);
    return newCons;
  },
  updateConsultation: (id, updates) => {
    const data = readDb();
    const index = data.consultations.findIndex(c => c.id === id);
    if (index !== -1) {
      data.consultations[index] = { ...data.consultations[index], ...updates };
      writeDb(data);
      return data.consultations[index];
    }
    return null;
  },

  // Agendamentos de consultas
  getAppointments: (filter = {}) => {
    const data = readDb();
    let res = data.appointments || [];
    if (filter.clientId) res = res.filter(a => a.clientId === filter.clientId);
    if (filter.readerId) res = res.filter(a => a.readerId === filter.readerId);
    return [...res].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  },
  findAppointmentById: (id) => (readDb().appointments || []).find(a => a.id === id),
  createAppointment: (appData) => {
    const data = readDb();
    if (!data.appointments) data.appointments = [];
    const newApp = {
      id: "appt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      status: "pending",
      createdAt: new Date().toISOString(),
      ...appData
    };
    data.appointments.push(newApp);
    writeDb(data);
    return newApp;
  },
  updateAppointment: (id, updates) => {
    const data = readDb();
    if (!data.appointments) data.appointments = [];
    const index = data.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      data.appointments[index] = { ...data.appointments[index], ...updates, updatedAt: new Date().toISOString() };
      writeDb(data);
      return data.appointments[index];
    }
    return null;
  },

  // Transações & Créditos
  getTransactions: (userId) => {
    const data = readDb();
    return data.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  createTransaction: (txData) => {
    const data = readDb();
    const newTx = {
      id: "tx_" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "completed",
      ...txData
    };
    data.transactions.unshift(newTx);
    writeDb(data);
    return newTx;
  },

  // Pacotes de Crédito
  getPricingPackages: () => readDb().pricingPackages,

  // Reset/Seed inicial se necessário
  resetDb: () => {
    writeDb(INITIAL_DATA);
    return INITIAL_DATA;
  }
};
