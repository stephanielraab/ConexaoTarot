import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  Clock, 
  Phone, 
  ExternalLink, 
  Star, 
  Percent, 
  TrendingUp,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function AdminModal({ user, onClose, onReaderApproved }) {
  const [tab, setTab] = useState('pending'); // 'pending' | 'active' | 'stats'
  const [pendingReaders, setPendingReaders] = useState([]);
  const [allReaders, setAllReaders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, all, st] = await Promise.all([
        api.getPendingReaders(),
        api.getAllReadersAdmin(),
        api.getAdminStats()
      ]);
      setPendingReaders(pending);
      setAllReaders(all);
      setStats(st);
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (readerId, readerName) => {
    if (!window.confirm(`Deseja aprovar o cadastro de ${readerName}? O oraculista ficará disponível para consultas na vitrine.`)) {
      return;
    }

    try {
      setProcessingId(readerId);
      await api.approveReader(readerId);
      
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121429] border border-purple-800/60 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-purple-900/40 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-950/80 via-[#181a38] to-purple-950/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0b0c16] rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Painel da Administração</h3>
                <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-purple-300">Curadoria de novos oraculistas & gestão da comissão de 20%</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0">
          
          <div className="bg-[#0b0c16] border border-amber-500/40 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              Sua Comissão (20%)
            </span>
            <p className="text-2xl font-black text-amber-300 mt-1">
              R$ {stats ? stats.platformEarnings.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <span className="text-[10px] text-slate-400">Total acumulado na plataforma</span>
          </div>

          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Faturamento Bruto</span>
            <p className="text-xl font-bold text-white mt-1">
              R$ {stats ? stats.totalVolume.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <span className="text-[10px] text-purple-300">100% de consultas geradas</span>
          </div>

          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Repasse Oraculistas (80%)</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              R$ {stats ? stats.readersEarnings.toFixed(2).replace('.', ',') : '0,00'}
            </p>
            <span className="text-[10px] text-slate-400">Pago aos profissionais</span>
          </div>

          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Aguardando Análise</span>
            <p className="text-xl font-bold text-amber-400 mt-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              {pendingReaders.length}
            </p>
            <span className="text-[10px] text-amber-300/80">Candidatos na fila</span>
          </div>

        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-purple-900/40 flex gap-2 shrink-0">
          <button
            onClick={() => setTab('pending')}
            className={`text-xs font-bold px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'pending'
                ? 'border-amber-400 text-amber-300 bg-purple-950/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>Fila de Análise e Curadoria</span>
            {pendingReaders.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingReaders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('active')}
            className={`text-xs font-bold px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'active'
                ? 'border-amber-400 text-amber-300 bg-purple-950/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>Oraculistas Aprovados Ativos ({allReaders.filter(r => r.approvalStatus === 'approved').length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* ABA 1: PENDENTES DE APROVAÇÃO */}
          {tab === 'pending' && (
            <div className="space-y-4">
              {pendingReaders.length === 0 ? (
                <div className="text-center py-12 bg-[#0b0c16]/50 rounded-2xl border border-purple-900/30 p-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white mb-1">Nenhum oraculista pendente no momento</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Todos os oraculistas que se cadastraram já foram avaliados pela sua curadoria.
                  </p>
                </div>
              ) : (
                pendingReaders.map((reader) => (
                  <div
                    key={reader.id}
                    className="bg-[#0b0c16] border border-amber-500/40 rounded-2xl p-5 shadow-xl relative"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                      
                      {/* Info do Candidato */}
                      <div className="flex gap-4 items-start flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/60 shrink-0">
                          <img src={reader.avatar} alt={reader.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{reader.name}</h4>
                            <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded-full">
                              ⏳ Em Análise
                            </span>
                          </div>

                          <p className="text-xs text-purple-300 font-medium">{reader.title}</p>
                          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{reader.bio}</p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reader.oracles.map((orc, i) => (
                              <span key={i} className="text-[10px] bg-purple-950/80 border border-purple-800/40 text-purple-200 px-2 py-0.5 rounded">
                                {orc}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
                            <span className="text-amber-300 font-bold">
                              Valor solicitado: R$ {reader.pricePerMinute?.toFixed(2)}/min
                            </span>
                            <span>•</span>
                            <span>Experiência: {reader.experienceYears || 3} anos</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              Cadastrado em: {new Date(reader.appliedAt || Date.now()).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações do Admin */}
                      <div className="flex flex-col sm:w-48 gap-2 shrink-0 w-full pt-3 sm:pt-0 border-t sm:border-t-0 border-purple-900/30">
                        {/* Botão para falar no WhatsApp antes de aprovar */}
                        {reader.whatsapp && (
                          <a
                            href={`https://wa.me/${reader.whatsapp}?text=${encodeURIComponent(`Olá ${reader.name}! Sou o administrador do Conexão Tarot. Recebemos sua inscrição para atender como oraculista e gostaria de fazer uma breve entrevista antes de aprovar seu perfil.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Entrevistar no Zap</span>
                          </a>
                        )}

                        {/* Botão Aprovar */}
                        <button
                          onClick={() => handleApprove(reader.id, reader.name)}
                          disabled={processingId === reader.id}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{processingId === reader.id ? 'Aprovando...' : 'Aprovar Oraculista'}</span>
                        </button>

                        {/* Botão Recusar */}
                        <button
                          onClick={() => handleReject(reader.id, reader.name)}
                          disabled={processingId === reader.id}
                          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                          Recusar Cadastro
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABA 2: ATIVOS */}
          {tab === 'active' && (
            <div className="space-y-3">
              {allReaders
                .filter(r => r.approvalStatus === 'approved')
                .map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img src={r.avatar} alt={r.name} className="w-12 h-12 rounded-xl object-cover border border-purple-700/50" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{r.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            r.status === 'available' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}>
                            {r.status === 'available' ? 'Online' : r.status === 'busy' ? 'Ocupado' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-xs text-purple-300/80">{r.title}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-bold text-amber-400">R$ {r.pricePerMinute?.toFixed(2)}/min</p>
                      <p className="text-[11px] text-slate-400">{r.consultationsCount} consultas • {r.rating} ⭐</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
