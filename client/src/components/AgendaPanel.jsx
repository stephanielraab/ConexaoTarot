import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Video,
  Phone,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  BellRing,
  CalendarOff,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import ScheduleEditor from './ScheduleEditor';
import WeeklyHoursBars from './WeeklyHoursBars';
import { STATUS_LABEL, TYPE_LABEL } from '../utils/contact';
import { defaultSchedule, formatRanges, summarizeSchedule } from '../utils/schedule';
import { upcomingDays, apptDayKey, apptTime, apptEndTime, dayTitle, fullDateLabel, tzLabel } from '../utils/agenda';

const READER_SHARE = 0.8;

const STATUS_STYLE = {
  pending: 'bg-amber-950 text-amber-300 border-amber-500/60',
  confirmed: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
  declined: 'bg-rose-950 text-rose-300 border-rose-500/60',
  cancelled: 'bg-slate-900 text-slate-400 border-slate-700',
  completed: 'bg-[#1b2238] text-[#d4af37] border-[#d4af37]/50'
};

const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

// Uma linha de agendamento (usada nos pedidos pendentes, nos dias e no histórico)
function AppointmentRow({ a, tz, showDate, busy, onAct }) {
  const TypeIcon = a.type === 'audio' ? Phone : Video;
  const earnings = a.pricePerMinute * a.durationMinutes * READER_SHARE;

  return (
    <div className="bg-[#0e101b] border border-[#d4af37]/20 rounded-2xl p-3.5 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 text-center bg-[#141826] border border-[#d4af37]/30 rounded-xl px-2.5 py-1.5">
            {showDate && <p className="text-[10px] text-slate-400">{fullDateLabel(a.scheduledAt, tz)}</p>}
            <p className="text-sm font-bold font-cinzel text-[#f3eed9] leading-tight">{apptTime(a.scheduledAt, tz)}</p>
            <p className="text-[10px] text-slate-500">até {apptEndTime(a.scheduledAt, a.durationMinutes, tz)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{a.clientName}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <TypeIcon className="w-3.5 h-3.5 text-[#d4af37]" />
              {TYPE_LABEL[a.type]} · {a.durationMinutes} min
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5">Você recebe cerca de {money(earnings)}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[a.status]}`}>
          {STATUS_LABEL[a.status]}
        </span>
      </div>

      {a.notes && <p className="text-xs text-slate-300/90 bg-[#10131f] rounded-xl px-3 py-2 mt-3 font-light">“{a.notes}”</p>}

      {(a.status === 'pending' || a.status === 'confirmed') && (
        <div className="flex flex-wrap gap-2 mt-3">
          {a.status === 'pending' && (
            <>
              <button
                disabled={busy}
                onClick={() => onAct(a, 'confirm')}
                className="px-3.5 py-2 rounded-xl bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold hover:bg-emerald-800 cursor-pointer transition-colors disabled:opacity-60"
              >
                Confirmar
              </button>
              <button
                disabled={busy}
                onClick={() => onAct(a, 'decline')}
                className="px-3.5 py-2 rounded-xl bg-[#10131f] border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-950/50 cursor-pointer transition-colors disabled:opacity-60"
              >
                Recusar
              </button>
            </>
          )}
          {a.status === 'confirmed' && (
            <button
              disabled={busy}
              onClick={() => onAct(a, 'cancel')}
              className="px-3.5 py-2 rounded-xl bg-[#10131f] border border-slate-700 text-slate-400 text-xs font-semibold hover:text-rose-300 hover:border-rose-500/50 cursor-pointer transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgendaPanel({ readerProfile, onReaderUpdated }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const schedule = readerProfile?.schedule || defaultSchedule();
  const tz = schedule.timezone || 'America/Sao_Paulo';

  const load = async () => {
    try {
      setAppointments(await api.getAppointments());
      setError('');
    } catch (err) {
      setError(err.message || 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('appointment-requested', load);
    socket.on('appointment-updated', load);
    return () => {
      socket.off('appointment-requested', load);
      socket.off('appointment-updated', load);
    };
  }, []);

  const act = async (appt, action) => {
    if (action === 'cancel' && !window.confirm('Cancelar esta consulta confirmada? O cliente será avisado.')) return;
    setBusyId(appt.id);
    try {
      const updated = await api.updateAppointment(appt.id, null, action);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Dados derivados ----------
  const now = Date.now();
  const isActive = (a) =>
    ['pending', 'confirmed'].includes(a.status) && Date.parse(a.scheduledAt) + a.durationMinutes * 60000 > now;
  const active = appointments.filter(isActive).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const pending = active.filter((a) => a.status === 'pending');
  const confirmed = active.filter((a) => a.status === 'confirmed');
  const history = appointments
    .filter((a) => !isActive(a))
    .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt))
    .slice(0, 15);

  const days = upcomingDays(tz, 15);
  const dayKeys = new Set(days.map((d) => d.key));
  const byDay = {};
  for (const a of active) {
    const key = apptDayKey(a.scheduledAt, tz);
    (byDay[key] ||= []).push(a);
  }
  const beyond = active.filter((a) => !dayKeys.has(apptDayKey(a.scheduledAt, tz)));
  const todayCount = (byDay[days[0].key] || []).length;
  const activeWeekDays = Object.values(schedule.weekly).filter((r) => r.length > 0).length;
  const summary = summarizeSchedule(schedule);

  const kpis = [
    { label: 'Hoje', value: todayCount, hint: 'consultas marcadas', tone: 'text-white' },
    { label: 'Aguardando você', value: pending.length, hint: 'pedidos para responder', tone: pending.length ? 'text-amber-300' : 'text-white' },
    { label: 'Confirmadas', value: confirmed.length, hint: 'nos próximos dias', tone: 'text-emerald-300' },
    { label: 'Dias de atendimento', value: activeWeekDays, hint: 'por semana', tone: 'text-[#d4af37]' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold font-cinzel text-[#f3eed9] flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#d4af37]" /> Minha Agenda
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
          Aqui você vê, num só lugar, os horários em que atende e as consultas marcadas pelos clientes.
          Os horários abaixo estão no <strong className="text-slate-200">{tzLabel(tz)}</strong>.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>}

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className={`text-3xl font-extrabold font-cinzel mt-1 ${k.tone}`}>{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Pedidos aguardando resposta */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BellRing className="w-4 h-4" /> Aguardando sua resposta ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((a) => (
              <AppointmentRow key={a.id} a={a} tz={tz} showDate busy={busyId === a.id} onAct={act} />
            ))}
          </div>
        </section>
      )}

      {/* Horários de atendimento */}
      <section className="bg-[#0b0d14] border border-[#d4af37]/25 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37]" /> Meus horários de atendimento
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> {tzLabel(tz)} · a parte dourada é quando você atende
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3.5 py-2 rounded-xl bg-[#1b2238] border border-[#d4af37]/40 text-xs font-bold text-[#f3eed9] hover:bg-[#252f4d] cursor-pointer transition-colors flex items-center gap-1.5"
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5 text-[#d4af37]" />}
            {editing ? 'Fechar edição' : 'Editar horários'}
          </button>
        </div>

        {editing ? (
          <ScheduleEditor
            readerProfile={readerProfile}
            onSaved={(updated) => {
              onReaderUpdated(updated);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <WeeklyHoursBars schedule={schedule} />
            {summary.length === 0 && (
              <p className="text-xs text-amber-300/90 mt-4">
                Nenhum dia ativo: por enquanto ninguém consegue agendar com você. Toque em “Editar horários”.
              </p>
            )}
            {readerProfile?.schedule == null && (
              <p className="text-[11px] text-slate-500 mt-4">
                Você ainda não personalizou seus horários, então estamos usando o padrão (todos os dias, das 8h às 22h).
              </p>
            )}
          </>
        )}
      </section>

      {/* Próximos dias */}
      <section>
        <h3 className="text-xs font-cinzel font-bold text-[#d4af37] uppercase tracking-wider mb-3">Próximos 15 dias</h3>
        {loading ? (
          <p className="text-xs text-[#d4af37] font-cinzel flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando agenda...
          </p>
        ) : (
          <div className="space-y-2.5">
            {days.map((day) => {
              const ranges = schedule.weekly[String(day.dow)] || [];
              const blocked = schedule.blockedDates?.includes(day.key);
              const list = byDay[day.key] || [];
              const works = ranges.length > 0 && !blocked;

              // Dia sem atendimento e sem consulta: linha compacta
              if (!works && list.length === 0) {
                return (
                  <div key={day.key} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0c0e17] border border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 font-semibold">{dayTitle(day)}</span>
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <CalendarOff className="w-3 h-3" /> {blocked ? 'Folga marcada' : 'Sem atendimento'}
                    </span>
                  </div>
                );
              }

              return (
                <div key={day.key} className="bg-[#0b0d14] border border-[#d4af37]/20 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold font-cinzel ${day.index === 0 ? 'text-[#d4af37]' : 'text-[#f3eed9]'}`}>
                      {dayTitle(day)}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#d4af37]" />
                      {works ? `Atende ${formatRanges(ranges)}` : blocked ? 'Folga marcada' : 'Fora do seu horário'}
                    </span>
                  </div>

                  {list.length === 0 ? (
                    <p className="text-[11px] text-slate-500 mt-2">Nenhuma consulta marcada neste dia.</p>
                  ) : (
                    <div className="space-y-2.5 mt-3">
                      {list.map((a) => (
                        <AppointmentRow key={a.id} a={a} tz={tz} busy={busyId === a.id} onAct={act} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {beyond.length > 0 && (
          <div className="mt-5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mais adiante</h4>
            <div className="space-y-2.5">
              {beyond.map((a) => (
                <AppointmentRow key={a.id} a={a} tz={tz} showDate busy={busyId === a.id} onAct={act} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Histórico */}
      {history.length > 0 && (
        <section>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-cinzel font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            Histórico recente ({history.length})
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showHistory && (
            <div className="space-y-2.5 mt-3 opacity-80">
              {history.map((a) => (
                <AppointmentRow key={a.id} a={a} tz={tz} showDate busy={false} onAct={act} />
              ))}
            </div>
          )}
        </section>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        No horário marcado o cliente chama você pelo site. Deixe o site aberto (pode ser no celular) com o status{' '}
        <strong className="text-slate-300">Online</strong>.
      </p>
    </div>
  );
}
