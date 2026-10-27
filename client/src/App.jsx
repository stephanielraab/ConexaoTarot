import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FilterBar from './components/FilterBar';
import ReaderCard from './components/ReaderCard';
import ReaderModal from './components/ReaderModal';
import CallRoom from './components/CallRoom';
import ConsultationSummaryModal from './components/ConsultationSummaryModal';
import WalletModal from './components/WalletModal';
import AuthModal from './components/AuthModal';
import ReaderDashboardPage from './components/ReaderDashboardPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import ReaderRegisterPage from './components/ReaderRegisterPage';
import ProfilePage from './components/ProfilePage';
import ScheduleModal from './components/ScheduleModal';
import DailyCardModal from './components/DailyCardModal';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

import { api } from './services/api';
import { getSocket } from './services/socket';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  // Navegação de páginas completas: 'home' | 'reader-dashboard' | 'admin-dashboard' | 'reader-register'
  const [currentView, setCurrentView] = useState('home');

  // Usuário e autenticação
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('conexao_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [readerProfile, setReaderProfile] = useState(() => {
    const saved = localStorage.getItem('conexao_reader');
    return saved ? JSON.parse(saved) : null;
  });

  // Oraculistas
  const [readers, setReaders] = useState([]);
  const [loadingReaders, setLoadingReaders] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedOracle, setSelectedOracle] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Modais
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [dailyCardModalOpen, setDailyCardModalOpen] = useState(false);
  const [selectedReader, setSelectedReader] = useState(null);
  const [scheduleReader, setScheduleReader] = useState(null);

  // Página de perfil: 'data' | 'appointments'
  const [profileTab, setProfileTab] = useState('data');
  const [profileReturnView, setProfileReturnView] = useState('home');

  // Consulta Ativa (Vídeo / Áudio Room)
  const [activeCall, setActiveCall] = useState(null);
  
  // Resumo pós-consulta
  const [summaryData, setSummaryData] = useState(null);

  const socket = getSocket();

  // Carregar oraculistas
  useEffect(() => {
    loadReaders();

    // Ouvir atualizações de status dos oraculistas em tempo real
    socket.on('reader-status-updated', ({ readerId, status }) => {
      setReaders(prev => prev.map(r => r.id === readerId ? { ...r, status } : r));
      if (readerProfile && readerProfile.id === readerId) {
        setReaderProfile(prev => ({ ...prev, status }));
      }
    });

    return () => {
      socket.off('reader-status-updated');
    };
  }, []);

  // Atalho discreto via hash URL (#admin)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        if (currentUser && currentUser.role === 'admin') {
          setCurrentView('admin-dashboard');
        } else {
          setAuthModal({ open: true, mode: 'login' });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  const loadReaders = async () => {
    try {
      setLoadingReaders(true);
      const data = await api.getReaders();
      setReaders(data);
    } catch (err) {
      console.error("Erro ao carregar oraculistas:", err);
    } finally {
      setLoadingReaders(false);
    }
  };

  // Gerenciamento de Login e Logout
  const handleAuthSuccess = (user, profile) => {
    setCurrentUser(user);
    setReaderProfile(profile);
    localStorage.setItem('conexao_user', JSON.stringify(user));
    if (profile) {
      localStorage.setItem('conexao_reader', JSON.stringify(profile));
    } else {
      localStorage.removeItem('conexao_reader');
    }

    // Redirecionamento automático conforme perfil
    if (user.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else if (user.role === 'reader') {
      setCurrentView('reader-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setReaderProfile(null);
    localStorage.removeItem('conexao_user');
    localStorage.removeItem('conexao_reader');
    setCurrentView('home');
    window.location.hash = '';
  };

  // Abre o Meu Perfil lembrando de onde o usuário veio
  const openProfile = (tab = 'data') => {
    if (!currentUser) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    setProfileReturnView(currentView === 'profile' ? 'home' : currentView);
    setProfileTab(tab);
    setCurrentView('profile');
    window.scrollTo({ top: 0 });
  };

  // Dados do perfil salvos: atualiza sessão, localStorage e vitrine
  const handleUserUpdated = (updatedUser, updatedReader) => {
    const merged = { ...currentUser, ...updatedUser };
    setCurrentUser(merged);
    localStorage.setItem('conexao_user', JSON.stringify(merged));
    if (updatedReader) {
      setReaderProfile(updatedReader);
      localStorage.setItem('conexao_reader', JSON.stringify(updatedReader));
    }
    loadReaders();
  };

  // Clique em "Agendar": exige login de consulente
  const handleSchedule = (reader) => {
    if (!currentUser) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    if (currentUser.role !== 'client') {
      alert('O agendamento é feito com uma conta de consulente. Entre com sua conta de cliente para marcar uma consulta.');
      return;
    }
    setScheduleReader(reader);
  };

  const handleBalanceUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('conexao_user', JSON.stringify(updatedUser));
  };

  // Atualizar status do oraculista
  const handleStatusChange = async (newStatus) => {
    if (!readerProfile) return;
    try {
      const updated = await api.updateReaderStatus(readerProfile.id, newStatus);
      setReaderProfile(updated);
      localStorage.setItem('conexao_reader', JSON.stringify(updated));
    } catch (err) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  // Iniciar Atendimento (Vídeo, Áudio ou WhatsApp)
  const handleStartConsultation = async (reader, type, appointmentId = null) => {
    // 1. Verificar se usuário está autenticado
    if (!currentUser) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }

    // 2. Se o usuário for o próprio oraculista
    if (currentUser.role === 'reader' && readerProfile?.id === reader.id) {
      alert('Você não pode iniciar um atendimento consigo mesmo.');
      return;
    }

    // 3. Verificar saldo mínimo do cliente (mínimo 3 minutos)
    const minRequired = reader.pricePerMinute * 3;
    if (currentUser.balance < minRequired) {
      const confirmed = window.confirm(
        `Seu saldo atual é de R$ ${currentUser.balance.toFixed(2)}. É necessário pelo menos R$ ${minRequired.toFixed(2)} (equivalente a 3 minutos) para consultar com ${reader.name}.\n\nDeseja recarregar seus créditos agora via PIX?`
      );
      if (confirmed) {
        setWalletModalOpen(true);
      }
      return;
    }

    try {
      const data = await api.startConsultation(currentUser.id, reader.id, type, appointmentId);

      // Se for atendimento por WhatsApp
      if (type === 'whatsapp') {
        if (data.whatsappLink) {
          window.open(data.whatsappLink, '_blank');
          alert(`Atendimento com ${reader.name} iniciado! O WhatsApp do oraculista foi aberto em uma nova aba com os dados do seu atendimento.`);
        }
        return;
      }

      // Se for Vídeo Chamada ou Ligação de Áudio
      setActiveCall({
        consultation: data.consultation,
        reader,
        maxMinutes: data.maxMinutes,
        type
      });

    } catch (err) {
      alert(err.message || 'Erro ao iniciar atendimento');
    }
  };

  // Encerramento da Consulta
  const handleEndCall = async (durationMinutes) => {
    if (!activeCall) return;

    try {
      const res = await api.endConsultation(activeCall.consultation.id, durationMinutes);
      
      // Atualizar saldo do cliente localmente
      if (currentUser.role === 'client') {
        const updated = { ...currentUser, balance: res.remainingBalance };
        setCurrentUser(updated);
        localStorage.setItem('conexao_user', JSON.stringify(updated));
      }

      // Salvar dados de resumo para avaliação
      setSummaryData({
        consultationId: activeCall.consultation.id,
        durationMinutes: res.minutes,
        cost: res.cost,
        readerName: activeCall.reader.name
      });

      setActiveCall(null);
      loadReaders(); // Atualiza status do oraculista para disponível
    } catch (err) {
      console.error(err);
      setActiveCall(null);
    }
  };

  const handleReviewSubmit = async (consultationId, rating, review) => {
    try {
      await api.reviewConsultation(consultationId, rating, review);
      loadReaders();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtragem e Ordenação dos Oraculistas
  const filteredReaders = readers
    .filter(r => {
      if (onlyAvailable && r.status !== 'available') return false;
      if (selectedOracle && !r.oracles.some(o => o.toLowerCase().includes(selectedOracle.toLowerCase()))) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesOracle = r.oracles.some(o => o.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesOracle) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.pricePerMinute - b.pricePerMinute;
      if (sortBy === 'price_desc') return b.pricePerMinute - a.pricePerMinute;
      if (sortBy === 'consultations') return b.consultationsCount - a.consultationsCount;
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (b.status === 'available' && a.status !== 'available') return 1;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  // RENDERIZAÇÃO: MEU PERFIL (dados da conta + agendamentos)
  if (currentView === 'profile' && currentUser) {
    return (
      <>
        <ProfilePage
          user={currentUser}
          readers={readers}
          initialTab={profileTab}
          onBack={() => {
            setCurrentView(profileReturnView);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onUserUpdated={handleUserUpdated}
          onStartConsultation={handleStartConsultation}
        />
        {activeCall && (
          <CallRoom
            consultation={activeCall.consultation}
            reader={activeCall.reader}
            currentUser={currentUser}
            onEndCall={handleEndCall}
          />
        )}
        {summaryData && (
          <ConsultationSummaryModal
            summaryData={summaryData}
            onClose={() => setSummaryData(null)}
            onSubmitReview={handleReviewSubmit}
          />
        )}
      </>
    );
  }

  // RENDERIZAÇÃO: PÁGINA COMPLETA DO ORACULISTA
  if (currentView === 'reader-dashboard') {
    return (
      <ReaderDashboardPage
        user={currentUser}
        readerProfile={readerProfile}
        onBack={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => openProfile('data')}
        onProfileUpdated={(updated) => {
          setReaderProfile(updated);
          localStorage.setItem('conexao_reader', JSON.stringify(updated));
          loadReaders();
        }}
      />
    );
  }

  // RENDERIZAÇÃO: PÁGINA COMPLETA DO ADMINISTRADOR (COMISSÃO 20% & CURADORIA)
  if (currentView === 'admin-dashboard') {
    return (
      <AdminDashboardPage
        user={currentUser}
        onBack={() => {
          setCurrentView('home');
          window.location.hash = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReaderApproved={() => loadReaders()}
        onOpenProfile={() => openProfile('data')}
      />
    );
  }

  // RENDERIZAÇÃO: PÁGINA COMPLETA DE CADASTRO/CANDIDATURA DE ORACULISTA
  if (currentView === 'reader-register') {
    return (
      <ReaderRegisterPage
        onBack={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSuccess={() => {
          setCurrentView('home');
          alert('Candidatura enviada com sucesso! Seu perfil está em curadoria pela nossa equipe.');
        }}
        onOpenLogin={() => {
          setCurrentView('home');
          setAuthModal({ open: true, mode: 'login' });
        }}
      />
    );
  }

  // RENDERIZAÇÃO: PORTAL PRINCIPAL (HOME)
  return (
    <div className="min-h-screen tarot-cards-bg text-slate-100 flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-[#f3eed9]">
      
      {/* Navbar Superior */}
      <Navbar
        user={currentUser}
        readerProfile={readerProfile}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onLogout={handleLogout}
        onOpenWallet={() => setWalletModalOpen(true)}
        onOpenReaderDashboard={() => setCurrentView('reader-dashboard')}
        onOpenAdmin={() => {
          if (currentUser?.role === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setAuthModal({ open: true, mode: 'login' });
          }
        }}
        onOpenReaderRegister={() => setCurrentView('reader-register')}
        onOpenDailyCard={() => setDailyCardModalOpen(true)}
        onStatusChange={handleStatusChange}
        onOpenProfile={() => openProfile('data')}
      />

      {/* Hero Principal Minimalista com Cartas de Tarô */}
      <HeroSection
        onOpenDailyCard={() => setDailyCardModalOpen(true)}
        onExploreReaders={() => {
          const el = document.getElementById('oraculistas');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Vitrine de Oraculistas */}
      <main id="oraculistas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold font-cinzel uppercase tracking-wider text-[#d4af37] mb-1">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Tarólogos Disponíveis para Consulta</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-[#f3eed9]">
              Escolha seu Guia Espiritual
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-cinzel">
            {filteredReaders.length} {filteredReaders.length === 1 ? 'profissional disponível' : 'profissionais disponíveis'}
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedOracle={selectedOracle}
          onOracleChange={setSelectedOracle}
          onlyAvailable={onlyAvailable}
          onOnlyAvailableChange={setOnlyAvailable}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Grid de Oraculistas */}
        {loadingReaders ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <Sparkles className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
            <p className="text-xs font-cinzel text-[#d4af37]">Embaralhando e conectando aos tarólogos...</p>
          </div>
        ) : filteredReaders.length === 0 ? (
          <div className="py-16 text-center bg-[#0e101b] border border-[#d4af37]/25 rounded-2xl p-8">
            <AlertCircle className="w-10 h-10 text-[#d4af37] mx-auto mb-3" />
            <h3 className="text-base font-bold font-cinzel text-white mb-1">Nenhum oraculista encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 font-light">
              Tente limpar os filtros de busca ou escolher outro oráculo para visualizar todos os profissionais.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedOracle(''); setOnlyAvailable(false); }}
              className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8420] rounded-xl text-xs font-bold text-slate-950 transition-all cursor-pointer font-cinzel uppercase"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReaders.map((reader) => (
              <ReaderCard
                key={reader.id}
                reader={reader}
                onSelectReader={setSelectedReader}
                onStartConsultation={handleStartConsultation}
                onSchedule={handleSchedule}
              />
            ))}
          </div>
        )}

      </main>

      {/* Como Funciona & Segurança */}
      <HowItWorks
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenWallet={() => setWalletModalOpen(true)}
      />

      {/* Rodapé com acesso restrito */}
      <Footer
        onOpenAdmin={() => {
          if (currentUser?.role === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setAuthModal({ open: true, mode: 'login' });
          }
        }}
      />

      {/* MODAIS GLOBAIS */}
      {/* 1. Perfil Detalhado do Oraculista */}
      {selectedReader && (
        <ReaderModal
          reader={selectedReader}
          onClose={() => setSelectedReader(null)}
          onStartConsultation={handleStartConsultation}
          onSchedule={handleSchedule}
        />
      )}

      {/* 1b. Agendamento de consulta */}
      {scheduleReader && (
        <ScheduleModal
          reader={scheduleReader}
          currentUser={currentUser}
          onClose={() => setScheduleReader(null)}
          onViewAppointments={() => openProfile('appointments')}
        />
      )}

      {/* 2. Autenticação Exclusiva de Consulente (Sem contas demo) */}
      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: 'login' })}
          onSuccess={handleAuthSuccess}
          onOpenReaderRegister={() => {
            setAuthModal({ open: false, mode: 'login' });
            setCurrentView('reader-register');
          }}
        />
      )}

      {/* 3. Carteira & Recarga PIX Instantânea */}
      {walletModalOpen && (
        <WalletModal
          user={currentUser}
          onClose={() => setWalletModalOpen(false)}
          onBalanceUpdated={handleBalanceUpdated}
        />
      )}

      {/* 4. Tiragem Diária Grátis com Arcanos */}
      {dailyCardModalOpen && (
        <DailyCardModal
          onClose={() => setDailyCardModalOpen(false)}
          onConsultNow={() => {
            const el = document.getElementById('oraculistas');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 5. Sala de Chamada Ativa (Vídeo ou Ligação) */}
      {activeCall && (
        <CallRoom
          consultation={activeCall.consultation}
          reader={activeCall.reader}
          currentUser={currentUser}
          onEndCall={handleEndCall}
        />
      )}

      {/* 6. Resumo & Avaliação pós-consulta */}
      {summaryData && (
        <ConsultationSummaryModal
          summaryData={summaryData}
          onClose={() => setSummaryData(null)}
          onSubmitReview={handleReviewSubmit}
        />
      )}

    </div>
  );
}
