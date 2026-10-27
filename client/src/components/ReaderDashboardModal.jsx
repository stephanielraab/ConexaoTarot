import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Phone, 
  Star, 
  Save, 
  CheckCircle2, 
  Award,
  Calendar,
  Users
} from 'lucide-react';
import { api } from '../services/api';

export default function ReaderDashboardModal({ 
  user, 
  readerProfile, 
  onClose, 
  onProfileUpdated 
}) {
  const [status, setStatus] = useState(readerProfile?.status || 'available');
  const [pricePerMinute, setPricePerMinute] = useState(readerProfile?.pricePerMinute || 3.50);
  const [whatsapp, setWhatsapp] = useState(readerProfile?.whatsapp || '');
  const [title, setTitle] = useState(readerProfile?.title || '');
  const [bio, setBio] = useState(readerProfile?.bio || '');
  const [consultations, setConsultations] = useState([]);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (readerProfile?.id) {
      loadConsultations();
    }
  }, [readerProfile]);

  const loadConsultations = async () => {
    try {
      const data = await api.getConsultations(readerProfile.id, 'reader');
      setConsultations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const updated = await api.updateReaderProfile(readerProfile.id, {
        status,
        pricePerMinute: parseFloat(pricePerMinute),
        whatsapp,
        title,
        bio
      });

      onProfileUpdated(updated);
      setSuccessMsg('Perfil e configurações atualizados com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const totalEarnings = consultations.reduce((acc, c) => acc + (c.readerEarnings || (c.cost ? c.cost * 0.8 : 0)), 0);
  const isPending = readerProfile?.approvalStatus === 'pending' || !readerProfile?.isApproved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121429] border border-purple-800/60 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Painel do Oraculista</h3>
              <p className="text-xs text-purple-300">Gerencie seus atendimentos, status ao vivo e repasse de 80%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pending Approval Notice Banner */}
        {isPending && (
          <div className="mt-4 p-4 bg-amber-950/60 border-2 border-amber-500/60 rounded-2xl flex items-start gap-3.5 shadow-lg">
            <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-spin" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-amber-300 text-sm">Cadastro em Análise pela Curadoria</p>
              <p className="text-slate-300 leading-relaxed">
                Para garantir a melhor experiência para os consulentes, todos os oraculistas passam por uma análise prévia. 
                Nossa equipe entrará em contato pelo seu WhatsApp (<strong className="text-white">{whatsapp || 'cadastrado'}</strong>) para validar suas especialidades. 
                Assim que aprovado pelo Administrador, seu perfil aparecerá na vitrine pública!
              </p>
            </div>
          </div>
        )}

        {/* Stats Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 shrink-0">
          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400">Total de Ganhos</span>
            <p className="text-xl font-extrabold text-amber-300">
              R$ {totalEarnings.toFixed(2).replace('.', ',')}
            </p>
            <span className="text-[10px] text-emerald-400">Repasse líquido (80%)</span>
          </div>

          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400">Consultas Realizadas</span>
            <p className="text-xl font-extrabold text-white">
              {readerProfile?.consultationsCount || consultations.length}
            </p>
            <span className="text-[10px] text-purple-300">Atendimentos totais</span>
          </div>

          <div className="bg-[#0b0c16] border border-purple-900/40 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400">Avaliação Média</span>
            <p className="text-xl font-extrabold text-amber-400 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" />
              {readerProfile?.rating?.toFixed(2) || '5.00'}
            </p>
            <span className="text-[10px] text-slate-400">Com base em reviews</span>
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSave} className="space-y-4 flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Status selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Seu Status Atual para Atendimentos:
              </label>
              {isPending && (
                <span className="text-[10px] text-amber-400 font-bold">
                  (Bloqueado até aprovação)
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setStatus('available')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  isPending 
                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                    : status === 'available'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400 cursor-pointer'
                    : 'bg-[#0b0c16] border-purple-900/40 text-slate-400 cursor-pointer'
                }`}
              >
                🟢 Disponível
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setStatus('busy')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  isPending
                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                    : status === 'busy'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 ring-1 ring-amber-400 cursor-pointer'
                    : 'bg-[#0b0c16] border-purple-900/40 text-slate-400 cursor-pointer'
                }`}
              >
                🟡 Em Atendimento
              </button>
              <button
                type="button"
                onClick={() => setStatus('offline')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'offline'
                    ? 'bg-slate-900 border-slate-600 text-slate-200 ring-1 ring-slate-600'
                    : 'bg-[#0b0c16] border-purple-900/40 text-slate-500'
                }`}
              >
                ⚪ Offline
              </button>
            </div>
          </div>

          {/* Price per minute & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Valor por Minuto (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.10"
                  min="1.00"
                  value={pricePerMinute}
                  onChange={(e) => setPricePerMinute(e.target.value)}
                  className="w-full bg-[#0b0c16] border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">WhatsApp de Atendimento</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999990000"
                  className="w-full bg-[#0b0c16] border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">Título Profissional</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Terapeuta Floral & Taróloga de Marselha"
              className="w-full bg-[#0b0c16] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">Biografia e Filosofia</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#0b0c16] border border-purple-800/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        {/* Recent consultations list */}
        <div className="mt-6 pt-5 border-t border-purple-900/40 shrink-0">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Últimos Atendimentos Recebidos:
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {consultations.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum atendimento realizado ainda.</p>
            ) : (
              consultations.map((c) => (
                <div key={c.id} className="bg-[#0b0c16] border border-purple-900/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{c.clientName || 'Cliente'}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {c.type === 'video' ? 'Vídeo' : c.type === 'audio' ? 'Áudio' : 'WhatsApp'} • {c.durationMinutes || 1} min
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">
                      + R$ {((c.cost || 0) * 0.7).toFixed(2).replace('.', ',')}
                    </span>
                    {c.rating && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 justify-end">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {c.rating}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
