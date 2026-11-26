import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Video,
  Phone,
  Wallet,
  Star,
  Loader2,
  PlayCircle,
  Hourglass,
  Sparkles,
  ChevronRight,
  History
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { TYPE_LABEL, STATUS_LABEL, formatDateTime, money } from '../utils/contact';

const EARLY_MS = 10 * 60000; // a consulta libera 10 min antes do horário

const STATUS_STYLE = {
  pending: 'bg-amber-950 text-amber-300 border-amber-500/60',
  confirmed: 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
};

// "2 d 3 h", "3 h 20 min", "12 min", "menos de 1 min"
function untilText(ms) {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  if (totalMin < 1) return 'menos de 1 min';
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d} d${h ? ` ${h} h` : ''}`;
  if (h > 0) return `${h} h${m ? ` ${m} min` : ''}`;
  return `${m} min`;
}

const presenceOf = (reader) => {
  if (!reader) return { label: 'Indisponível', dot: 'bg-slate-500', online: false };
  if (reader.status === 'available') return { label: 'Online agora', dot: 'bg-emerald-400', online: true };
  if (reader.status === 'busy') return { label: 'Em atendimento', dot: 'bg-amber-400', online: false };
  return { label: 'Offline', dot: 'bg-slate-500', online: false };
};

export default function ClientDashboard({ user, readers = [], onStartConsultation, onGoTo, onFindReaders, onOpenWallet }) {
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    try {
      const [appts, cons] = await Promise.all([api.getAppointments(), api.getConsultations(user.id, 'client')]);
      setAppointments(appts);
      setConsultations(Array.isArray(cons) ? cons : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o seu painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('appointment-updated', load); // o oraculista confirmou ou recusou
    const tick = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      socket.off('appointment-updated', load);
      clearInterval(tick);
    };
  }, []);

  const cancel = async (a) => {
    if (!window.confirm('Deseja cancelar este agendamento?')) return;
    setBusyId(a.id);
    try {
      const updated = await api.updateAppointment(a.id, null, 'cancel');
      setAppointments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Dados derivados ----------
  const startMs = (a) => Date.parse(a.scheduledAt);
  const endMs = (a) => startMs(a) + a.durationMinutes * 60000;
  const active = appointments
    .filter((a) => ['pending', 'confirmed'].includes(a.status) && endMs(a) > now)
    .sort((a, b) => startMs(a) - startMs(b));
  const next = active.find((a) => a.status === 'confirmed') || null; // destaque: a próxima confirmada
  const others = active.filter((a) => a.id !== next?.id);
  const history = [...consultations]
    .sort((a, b) => Date.parse(b.endTime || b.startTime || 0) - Date.parse(a.endTime || a.startTime || 0))
    .slice(0, 5);

  const stateOf = (a) => {
    const s = startMs(a);
    if (a.status !== 'confirmed') return 'pending';
    if (now < s - EARLY_MS) return 'before';
    return 'open'; // dentro da janela (10 min antes até o fim)
  };

  // Botão principal de uma consulta confirmada
  const EnterButton = ({ a, big }) => {
    const state = stateOf(a);
    const reader = readers.find((r) => r.id === a.readerId);
    const open = state === 'open';
    const cls = big ? 'px-6 py-3.5 text-sm' : 'px-4 py-2.5 text-xs';
    if (!open) {
      return (
        <button
          disabled
          className={`${cls} rounded-xl bg-[#141826] border border-[#d4af37]/20 text-slate-400 font-bold flex items-center gap-2 cursor-not-allowed`}
        >
          <Hourglass className="w-4 h-4" />
          Libera em {untilText(startMs(a) - EARLY_MS - now)}
        </button>
      );
    }
    return (
      <button
        disabled={busyId === a.id || !reader}
        onClick={async () => {
          setBusyId(a.id);
          await onStartConsultation(reader, a.type, a.id);
          setBusyId(null);
        }}
        className={`${cls} rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold font-cinzel flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60`}
      >
        <PlayCircle className="w-4 h-4" />
        {busyId === a.id ? 'Conectando…' : 'Entrar na consulta'}
      </button>
    );
  };

  const kpis = [
    { label: 'Meu saldo', value: money(user.balance), tone: 'text-[#d4af37]', action: { text: '+ Créditos', fn: onOpenWallet } },
    {
      label: 'Próxima consulta',
      value: next ? formatDateTime(next.scheduledAt).date.replace('.', '') : '—',
      small: next ? formatDateTime(next.scheduledAt).time : 'nenhuma confirmada',
      tone: 'text-white'
    },
    { label: 'Agendamentos ativos', value: active.length, tone: active.length ? 'text-emerald-300' : 'text-white' },
    { label: 'Consultas realizadas', value: consultations.length, tone: 'text-white' }
  ];

  if (loading) {
    return (
      <p className="text-xs text-[#d4af37] font-cinzel flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando seu painel...
      </p>
    );
  }

  const nextReader = next ? readers.find((r) => r.id === next.readerId) : null;
  const nextPresence = presenceOf(nextReader);
  const nextState = next ? stateOf(next) : null;

  return (
    <div className="space-y-7">
      {error && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>}

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className={`text-xl sm:text-2xl font-extrabold font-cinzel mt-1 ${k.tone}`}>{k.value}</p>
            {k.small && <p className="text-[11px] text-slate-500">{k.small}</p>}
            {k.action && (
              <button onClick={k.action.fn} className="mt-1 text-[11px] font-bold text-[#d4af37] hover:underline cursor-pointer flex items-center gap-1">
                <Wallet className="w-3 h-3" /> {k.action.text}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Próxima consulta (destaque) */}
      {next ? (
        <section className="rounded-3xl border border-[#d4af37]/40 bg-gradient-to-br from-[#1a1608] via-[#0f121d] to-[#0b0d14] p-5 sm:p-7">
          <p className="text-[11px] font-cinzel font-bold uppercase tracking-widest text-[#d4af37] mb-4">Sua próxima consulta</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={next.readerAvatar}
              alt={next.readerName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#d4af37]/60 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold font-cinzel text-[#f3eed9]">{next.readerName}</h3>
              <p className="text-sm text-[#d4af37] flex items-center gap-1.5 mt-1">
                <CalendarDays className="w-4 h-4" /> {formatDateTime(next.scheduledAt).full} · {next.durationMinutes} min
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                {next.type === 'audio' ? <Phone className="w-3.5 h-3.5 text-[#d4af37]" /> : <Video className="w-3.5 h-3.5 text-[#d4af37]" />}
                {TYPE_LABEL[next.type]} · valor estimado {money(next.pricePerMinute * next.durationMinutes)}
              </p>
              <p className="text-xs mt-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${nextPresence.dot}`} />
                <span className="text-slate-300">{nextPresence.label}</span>
              </p>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
              <EnterButton a={next} big />
              {nextState === 'before' && (
                <p className="text-[11px] text-slate-400 sm:text-right">
                  Começa em <strong className="text-slate-200">{untilText(startMs(next) - now)}</strong>
                </p>
              )}
              {nextState === 'open' && !nextPresence.online && (
                <p className="text-[11px] text-amber-300 sm:text-right max-w-[230px]">
                  {nextReader?.name?.split(' ')[0] || 'O oraculista'} ainda não está online. Tente de novo em instantes.
                </p>
              )}
              {nextState === 'open' && nextPresence.online && (
                <p className="text-[11px] text-emerald-300 sm:text-right">Sua consulta já pode começar!</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-[#d4af37]/20 bg-[#0f121d] p-6 text-center">
          <Sparkles className="w-8 h-8 text-[#d4af37]/70 mx-auto mb-2" />
          <p className="text-sm font-bold font-cinzel text-[#f3eed9]">Nenhuma consulta confirmada por enquanto</p>
          <p className="text-xs text-slate-400 mt-1">
            {active.length > 0 ? 'Assim que o oraculista confirmar, ela aparece aqui em destaque.' : 'Escolha um oraculista e marque o melhor horário para você.'}
          </p>
          <button
            onClick={onFindReaders}
            className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 text-xs font-bold font-cinzel shadow-md active:scale-95 cursor-pointer"
          >
            Agendar uma consulta
          </button>
        </section>
      )}

      {/* Outros agendamentos */}
      {others.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-cinzel font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Meus agendamentos ({others.length})
            </h3>
            <button onClick={() => onGoTo('appointments')} className="text-[11px] text-slate-400 hover:text-[#d4af37] cursor-pointer flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {others.map((a) => {
              const t = formatDateTime(a.scheduledAt);
              const state = stateOf(a);
              return (
                <div key={a.id} className="bg-[#0e101b] border border-[#d4af37]/20 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={a.readerAvatar} alt={a.readerName} className="w-11 h-11 rounded-xl object-cover border border-[#d4af37]/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-cinzel text-[#f3eed9] truncate">{a.readerName}</p>
                        <p className="text-xs text-[#d4af37] flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" /> {t.full} · {a.durationMinutes} min
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {TYPE_LABEL[a.type]} · {money(a.pricePerMinute * a.durationMinutes)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {state !== 'pending' && <EnterButton a={a} />}
                    {state === 'pending' && (
                      <span className="text-[11px] text-slate-500">Você será avisado quando o oraculista confirmar.</span>
                    )}
                    <button
                      disabled={busyId === a.id}
                      onClick={() => cancel(a)}
                      className="px-3.5 py-2 rounded-xl bg-[#10131f] border border-slate-700 text-slate-400 text-xs font-semibold hover:text-rose-300 hover:border-rose-500/50 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Consultas realizadas */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-cinzel font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Consultas realizadas
          </h3>
          {history.length > 0 && <span className="text-[11px] text-slate-500">últimas {history.length}</span>}
        </div>
        {history.length === 0 ? (
          <div className="bg-[#0e101b] border border-[#d4af37]/15 rounded-2xl p-5 text-center text-xs text-slate-400">
            Você ainda não fez nenhuma consulta. Depois de cada atendimento ela fica registrada aqui.
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((c) => (
              <div key={c.id} className="bg-[#0e101b] border border-[#d4af37]/15 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#141826] border border-[#d4af37]/25 flex items-center justify-center shrink-0">
                    {c.type === 'audio' ? <Phone className="w-4 h-4 text-[#d4af37]" /> : <Video className="w-4 h-4 text-[#d4af37]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.readerName}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(c.endTime || c.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {c.durationMinutes} min ·{' '}
                      {TYPE_LABEL[c.type] || c.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-cinzel text-[#f3eed9]">{money(c.cost)}</p>
                  {c.rating ? (
                    <p className="text-[11px] text-[#d4af37] flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 fill-[#d4af37]" /> {c.rating}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600">sem avaliação</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onFindReaders}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 text-xs font-bold font-cinzel shadow-md active:scale-95 cursor-pointer"
        >
          Agendar nova consulta
        </button>
        <button
          onClick={() => onGoTo('appointments')}
          className="px-5 py-2.5 rounded-xl bg-[#141826] border border-[#d4af37]/30 text-[#f3eed9] text-xs font-bold hover:border-[#d4af37]/70 cursor-pointer transition-colors"
        >
          Histórico completo de agendamentos
        </button>
      </div>
    </div>
  );
}
