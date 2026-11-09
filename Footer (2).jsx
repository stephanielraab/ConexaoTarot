import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  Clock, 
  Phone, 
  Star, 
  Percent, 
  TrendingUp, 
  Calendar, 
  Video, 
  MessageSquare,
  Search,
  Filter,
  Check,
  UserCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function AdminDashboardPage({ 
  user, 
  onBack, 
  onReaderApproved,
  onOpenProfile
}) {
  const [tab, setTab] = useState('pending'); // 'pending' | 'consultations' | 'readers'
  const [pendingReaders, setPendingReaders] = useState([]);
  const [allReaders, setAllReaders] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, all, st, cons] = await Promise.all([
        api.getPendingReaders(),
        api.getAllReadersAdmin(),
        api.getAdminStats(),
        api.getConsultations('', 'admin')
      ]);
      setPendingReaders(pending);
      setAllReaders(all);
      setStats(st);
      setAllConsultations(cons);
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (readerId, readerName) => {
    if (!window.confirm(`Deseja aprovar o cadastro de ${readerName}? O oraculista ficará visível na vitrine pública imediatamente.`)) {
      return;
    }

    try {
      setProcessingId(readerId);
      await api.approveReader(readerId);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 }
      });

      alert(`✅ Oraculista ${readerName} aprovado(a) com sucesso!`);
      loadData();
      if (onReaderApproved) onReaderApproved();
    } catch (err) {
      alert(err.message || 'Erro ao aprovar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (readerId, readerName) => {
    const reason = window.prompt(`Motivo da reprovação de ${readerName}:`, "Perfil não atende aos requisitos mínimos no momento.");
    if (reason === null) return;

    try {
      setProcessingId(readerId);
      await api.rejectReader(readerId, reason);
      alert(`Oraculista ${readerName} foi recusado.`);
      loadData();
      if (onReaderApproved) onReaderApproved();
    } catch (err) {
      alert(err.message || 'Erro ao reprovar');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen tarot-cards-bg text-[#e2e8f0] pb-24">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 border-b border-[#d4af37]/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Portal</span>
            </button>

            <div className="hidden sm:block border-l border-[#d4af37]/20 pl-4">
              <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold block">
                Painel Central de Gestão
              </span>
              <h1 className="text-base font-bold text-white font-cinzel leading-none">
                Administração Conexão Tarot
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Meu Perfil</span>
            </button>
            <span className="text-xs font-bold text-[#d4af37] bg-[#241e12] border border-[#d4af37]/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" />
              <span>Taxa da Plataforma: 20%</span>
            </span>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* KPI Cards: Faturamento e Comissão de 20% */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Sua comissão de 20% */}
          <div className="bg-[#0f121d] border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Sua Comissão (20%)
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#262013] border border-[#d4af37]/40 flex items-center justify-center">
                <Percent className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#f3eed9] font-cinzel">
              R$ {stats ? stats.platformEarnings.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
              Retenção líquida da plataforma
            </p>
          </div>

          {/* Card 2: Faturamento Bruto (100%) */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Faturamento Bruto
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#141826] border border-slate-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-cinzel">
              R$ {stats ? stats.totalVolume.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Total de consultas movimentadas
            </p>
          </div>

          {/* Card 3: Repasse para Oraculistas (80%) */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Repasse Oraculistas (80%)
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#141826] border border-slate-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-cinzel">
              R$ {stats ? stats.readersEarnings.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Crédito dos especialistas
            </p>
          </div>

          {/* Card 4: Fila de Curadoria */}
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fila de Análise
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2b2210] border border-[#d4af37]/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#d4af37] font-cinzel">
              {pendingReaders.length}
            </p>
            <p className="text-[11px] text-amber-300/80 mt-1">
              {pendingReaders.length === 1 ? 'Candidato aguardando aprovação' : 'Candidatos aguardando aprovação'}
            </p>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#d4af37]/20 mb-8 pb-1">
          <button
            onClick={() => setTab('pending')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'pending'
                ? 'bg-[#241e12] border border-[#d4af37]/50 text-[#f3eed9] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Fila de Curadoria de Oraculistas</span>
            {pendingReaders.length > 0 && (
              <span className="bg-[#d4af37] text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingReaders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('consultations')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'consultations'
                ? 'bg-[#241e12] border border-[#d4af37]/50 text-[#f3eed9] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Histórico de Consultas & Agendamentos</span>
          </button>

          <button
            onClick={() => setTab('readers')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'readers'
                ? 'bg-[#241e12] border border-[#d4af37]/50 text-[#f3eed9] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Oraculistas Ativos ({allReaders.filter(r => r.approvalStatus === 'approved').length})</span>
          </button>
        </div>

        {/* Tab 1: Fila de Curadoria */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {pendingReaders.length === 0 ? (
              <div className="py-16 text-center bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl p-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white font-cinzel mb-1">
                  Fila de Curadoria Vazia
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Todos os oraculistas que se cadastraram já foram avaliados e aprovados pela sua administração.
                </p>
              </div>
            ) : (
              pendingReaders.map((reader) => (
                <div
                  key={reader.id}
                  className="bg-[#0f121d] border border-[#d4af37]/35 rounded-3xl p-6 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                    
                    {/* Reader Details */}
                    <div className="flex gap-4 items-start flex-1">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37]/50 shrink-0">
                        <img src={reader.avatar} alt={reader.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white font-cinzel">{reader.name}</h4>
                          <span className="text-[10px] font-bold bg-[#262013] text-[#d4af37] border border-[#d4af37]/40 px-2 py-0.5 rounded-full">
                            ⏳ Em Análise
                          </span>
                        </div>

                        <p className="text-xs text-[#d4af37] font-medium">{reader.title}</p>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{reader.bio}</p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {reader.oracles?.map((orc, i) => (
                            <span key={i} className="text-[10px] bg-[#161a29] border border-[#d4af37]/25 text-[#f3eed9] px-2 py-0.5 rounded">
                              {orc}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <span className="text-white font-bold">
                            Tarifa solicitada: R$ {reader.pricePerMinute?.toFixed(2)}/min
                          </span>
                          <span>•</span>
                          <span>Experiência: {reader.experienceYears || 3} anos</span>
                          <span>•</span>
                          <span>WhatsApp: <strong className="text-white">{reader.whatsapp}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:w-52 gap-2.5 shrink-0 w-full lg:w-52 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      {reader.whatsapp && (
                        <a
                          href={`https://wa.me/${reader.whatsapp}?text=${encodeURIComponent(`Olá ${reader.name}! Sou da curadoria do Conexão Tarot. Recebemos sua inscrição oracular e gostaríamos de realizar uma rápida entrevista antes de aprovar seu perfil.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 bg-[#112d20] hover:bg-[#163b2a] border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Entrevistar via WhatsApp</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleApprove(reader.id, reader.name)}
                        disabled={processingId === reader.id}
                        className="w-full py-3 px-3 bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingId === reader.id ? 'Aprovando...' : 'Aprovar Oraculista'}</span>
                      </button>

                      <button
                        onClick={() => handleReject(reader.id, reader.name)}
                        disabled={processingId === reader.id}
                        className="w-full py-2 px-3 bg-[#141824] hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        Recusar Solicitação
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Histórico Geral de Consultas */}
        {tab === 'consultations' && (
          <div className="bg-[#0f121d] border border-[#d4af37]/25 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white font-cinzel mb-1">
              Registro Geral de Atendimentos da Plataforma
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Detalhamento de cada consulta com divisão automática: 20% retenção da plataforma e 80% repasse ao oraculista
            </p>

            <div className="space-y-3">
              {allConsultations.map((c) => {
                const totalCost = Number(c.cost || 0);
                const platformShare = c.platformFee || totalCost * 0.20;
                const readerShare = c.readerEarnings || totalCost * 0.80;

                return (
                  <div 
                    key={c.id}
                    className="bg-[#131724] border border-[#d4af37]/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.clientName || 'Consulente'}</span>
                        <span className="text-slate-500">atendido(a) por</span>
                        <span className="font-bold text-[#d4af37]">{c.readerName}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#1f2840] text-slate-300">
                          {c.type === 'video' ? 'Vídeo' : c.type === 'audio' ? 'Áudio' : 'WhatsApp'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Duração: <strong>{c.durationMinutes || 1} min</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-6 sm:text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sua taxa (20%):</span>
                        <span className="text-sm font-bold text-emerald-400">
                          + R$ {platformShare.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Oraculista (80%):</span>
                        <span className="text-sm font-bold text-[#d4af37]">
                          R$ {readerShare.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Bruto:</span>
                        <span className="text-sm font-extrabold text-white font-cinzel">
                          R$ {totalCost.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Oraculistas Aprovados */}
        {tab === 'readers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReaders
              .filter(r => r.approvalStatus === 'approved')
              .map((r) => (
                <div 
                  key={r.id}
                  className="bg-[#0f121d] border border-[#d4af37]/25 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={r.avatar} alt={r.name} className="w-14 h-14 rounded-2xl object-cover border border-[#d4af37]/40" />
                      <div>
                        <h4 className="text-sm font-bold text-white font-cinzel">{r.name}</h4>
                        <p className="text-xs text-[#d4af37] line-clamp-1">{r.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          r.status === 'available' ? 'bg-[#153424] text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status === 'available' ? '🟢 Online' : r.status === 'busy' ? '🟡 Ocupado' : '⚪ Offline'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                      {r.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Tarifa: </span>
                      <strong className="text-[#d4af37]">R$ {r.pricePerMinute?.toFixed(2)}/min</strong>
                    </div>
                    <div className="text-slate-400">
                      {r.consultationsCount} consultas • {r.rating} ⭐
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

      </main>

    </div>
  );
}
