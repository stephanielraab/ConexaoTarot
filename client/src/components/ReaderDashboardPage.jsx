import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Calendar, 
  Phone, 
  Star, 
  Save, 
  CheckCircle2, 
  Video, 
  MessageSquare, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  CreditCard,
  History,
  UserCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ReaderDashboardPage({ 
  user, 
  readerProfile, 
  onBack, 
  onProfileUpdated,
  onOpenProfile
}) {
  const [status, setStatus] = useState(readerProfile?.status || 'available');
  const [pricePerMinute, setPricePerMinute] = useState(readerProfile?.pricePerMinute || 3.50);
  const [whatsapp, setWhatsapp] = useState(readerProfile?.whatsapp || '');
  const [title, setTitle] = useState(readerProfile?.title || '');
  const [bio, setBio] = useState(readerProfile?.bio || '');
  const [oracles, setOracles] = useState(readerProfile?.oracles || ['Tarô de Marselha', 'Tarô Rider-Waite']);

  // Agendamentos e atendimentos
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Saque PIX
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  // Edição
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const isPending = readerProfile?.approvalStatus === 'pending' || !readerProfile?.isApproved;

  useEffect(() => {
    if (readerProfile?.id) {
      loadConsultations();
    }
  }, [readerProfile]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await api.getConsultations(readerProfile.id, 'reader');
      setConsultations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');

    try {
      const updated = await api.updateReaderProfile(readerProfile.id, {
        status: isPending ? 'offline' : status,
        pricePerMinute: parseFloat(pricePerMinute),
        whatsapp,
        title,
        bio,
        oracles
      });

      onProfileUpdated(updated);
      setSaveSuccess('Perfil oracular atualizado com sucesso!');
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      alert(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (isPending) return;
    setStatus(newStatus);
    try {
      const updated = await api.updateReaderStatus(readerProfile.id, newStatus);
      onProfileUpdated(updated);
    } catch (err) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    if (!pixKey.trim()) {
      alert('Informe a chave PIX para repasse.');
      return;
    }
    setWithdrawalSuccess(true);
    setTimeout(() => setWithdrawalSuccess(false), 5000);
  };

  const totalEarnings = consultations.reduce(
    (acc, c) => acc + (c.readerEarnings || (c.cost ? c.cost * 0.8 : 0)), 
    0
  );

  return (
    <div className="min-h-screen tarot-cards-bg text-[#e2e8f0] pb-24">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 border-b border-[#d4af37]/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Vitrine</span>
            </button>

            <div className="hidden sm:block border-l border-[#d4af37]/20 pl-4">
              <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold block">
                Painel do Oraculista
              </span>
              <h1 className="text-base font-bold text-white font-cinzel leading-none">
                {readerProfile?.name || user?.name}
              </h1>
            </div>
          </div>

          {/* Live Status Switcher */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Meu Perfil</span>
            </button>
            {isPending ? (
              <div className="flex items-center gap-2 bg-[#2a2211] border border-[#d4af37]/40 px-3.5 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-[#d4af37] animate-spin" />
                <span className="text-xs font-bold text-[#f3eed9]">Em Análise pela Curadoria</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#121622] border border-[#d4af37]/25 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleStatusChange('available')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    status === 'available'
                      ? 'bg-[#18392b] text-emerald-300 border border-emerald-500/60 shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Disponível
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('busy')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    status === 'busy'
                      ? 'bg-[#3b2d13] text-amber-300 border border-amber-500/60 shadow-md shadow-amber-950/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟡 Em Atendimento
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('offline')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    status === 'offline'
                      ? 'bg-[#1f2433] text-slate-300 border border-slate-600 shadow-md'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ⚪ Offline
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Banner: Em Análise */}
        {isPending && (
          <div className="mb-8 p-6 bg-[#161a29] border border-[#d4af37]/40 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#262013] border border-[#d4af37]/50 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#d4af37] animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-[#f3eed9] font-cinzel">
                  Inscrição Oracular em Fase de Curadoria
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  Seu cadastro foi recebido com reverência. Para assegurar a fidelidade e excelência sagrada dos atendimentos, nossa equipe realiza uma breve entrevista pelo seu WhatsApp cadastrado (<strong className="text-white">{whatsapp || readerProfile?.whatsapp}</strong>). Assim que seu perfil for aprovado pela gestão, ele passará a figurar na vitrine pública!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial KPI Cards: Valores a Receber & Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Valores a Receber (80%) */}
          <div className="bg-[#0f121d] border border-[#d4af37]/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Saldo a Receber
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#262013] border border-[#d4af37]/40 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-cinzel">
              R$ {Number(user?.balance || totalEarnings || 0).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Repasse líquido garantido (80%)
            </p>
          </div>

          {/* Card 2: Consultas Realizadas */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Atendimentos Totais
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#141826] border border-slate-700 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-300" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-cinzel">
              {readerProfile?.consultationsCount || consultations.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Histórico de consultas finalizadas
            </p>
          </div>

          {/* Card 3: Avaliação dos Consulentes */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Avaliação Média
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2b2210] border border-[#d4af37]/40 flex items-center justify-center">
                <Star className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#d4af37] font-cinzel">
              {readerProfile?.rating ? readerProfile.rating.toFixed(2) : '5.00'} ⭐
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Índice de satisfação dos clientes
            </p>
          </div>

          {/* Card 4: Valor por Minuto */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sua Tarifa
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#141826] border border-slate-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-cinzel">
              R$ {Number(pricePerMinute).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cobrança por minuto configurada
            </p>
          </div>

        </div>

        {/* Two Column Layout: Agendamentos & Saque PIX / Configurações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 Cols): Agendamentos & Atendimentos Detalhados */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-[#0f121d] border border-[#d4af37]/25 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d4af37]/15">
                <div>
                  <h2 className="text-lg font-bold text-white font-cinzel">
                    Agendamentos & Histórico de Atendimentos
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registro de todas as consultas efetuadas por vídeo, áudio e WhatsApp
                  </p>
                </div>
                <span className="text-xs font-bold text-[#d4af37] bg-[#241e12] border border-[#d4af37]/30 px-3 py-1 rounded-full">
                  {consultations.length} atendimentos
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Carregando consultas...
                </div>
              ) : consultations.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">Nenhum atendimento realizado ainda</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Quando estiver com o status 🟢 Disponível, as solicitações de vídeo chamada e ligação aparecerão aqui em tempo real.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {consultations.map((c) => (
                    <div 
                      key={c.id} 
                      className="bg-[#131724] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all rounded-2xl p-4.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#1b2236] border border-[#d4af37]/30 flex items-center justify-center font-bold text-[#d4af37]">
                            {c.type === 'video' ? <Video className="w-5 h-5" /> : c.type === 'audio' ? <Phone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{c.clientName || 'Consulente'}</h4>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#1f2840] text-slate-300">
                                {c.type === 'video' ? 'Vídeo Chamada' : c.type === 'audio' ? 'Ligação' : 'WhatsApp'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Duração: <strong>{c.durationMinutes || 1} min</strong>
                            </p>
                          </div>
                        </div>

                        {/* Values */}
                        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Seu repasse (80%):</span>
                          <span className="text-base font-extrabold text-[#d4af37] font-cinzel">
                            + R$ {((c.readerEarnings || (c.cost ? c.cost * 0.8 : 0))).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            (Total bruto: R$ {Number(c.cost || 0).toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      </div>

                      {/* Review if exists */}
                      {c.review && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                          <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37] shrink-0 mt-0.5" />
                          <p className="text-slate-300 italic">
                            "{c.review}" — <span className="text-[#d4af37] font-semibold">{c.rating} estrelas</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Módulo de Saque PIX */}
            <div className="bg-[#0f121d] border border-[#d4af37]/25 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#262013] border border-[#d4af37]/40 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-cinzel">
                    Valores a Receber & Solicitação de Saque PIX
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre sua chave PIX para transferência do seu saldo líquido de 80%
                  </p>
                </div>
              </div>

              {withdrawalSuccess && (
                <div className="mb-4 p-4 bg-[#143224] border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Solicitação de saque PIX enviada com sucesso! O repasse será creditado na sua conta em até 1 dia útil.
                  </span>
                </div>
              )}

              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Tipo de Chave PIX</label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="cpf">CPF / CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone (Celular)</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Chave PIX de Destino</label>
                    <input
                      type="text"
                      required
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Digite sua chave PIX completa"
                      className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-400">
                    Saldo disponível para saque agora: <strong className="text-[#d4af37]">R$ {Number(user?.balance || totalEarnings || 0).toFixed(2).replace('.', ',')}</strong>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold text-xs shadow-lg shadow-[#d4af37]/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Solicitar Repasse via PIX</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column: Configuração do Perfil Oracular */}
          <div className="space-y-6">
            
            <div className="bg-[#0f121d] border border-[#d4af37]/25 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white font-cinzel mb-1">
                Configurações do Perfil
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Altere seus dados públicos de atendimento
              </p>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-[#143224] border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Price per minute */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Tarifa por Minuto (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="1.00"
                      value={pricePerMinute}
                      onChange={(e) => setPricePerMinute(e.target.value)}
                      className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    WhatsApp de Atendimento (com DDD)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="5511999990000"
                      className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Utilizado para os clientes iniciarem consultas via WhatsApp
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Título / Linha Oracular
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Especialista em Tarô de Marselha e Baralho Cigano"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Apresentação Profissional (Biografia)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Descreva sua experiência, seus instrumentos oraculares e como você conduz as consultas..."
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-[#1d2336] hover:bg-[#252e46] border border-[#d4af37]/40 hover:border-[#d4af37] text-[#f3eed9] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#d4af37]" />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
                </button>

              </form>
            </div>

            {/* Info Card */}
            <div className="bg-[#121624] border border-[#d4af37]/20 rounded-3xl p-5 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#d4af37] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Condições da Parceria Conexão Tarot</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Você recebe 80% do valor de todos os minutos consumidos em suas consultas. Os repasses são processados via PIX sem taxas abusivas. Mantenha seu WhatsApp sempre atualizado.
              </p>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
