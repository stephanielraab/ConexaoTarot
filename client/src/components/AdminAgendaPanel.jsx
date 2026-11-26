import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, Video, Phone, ChevronDown, ChevronUp, Loader2, AlertTriangle, Users } from 'lucide-react';
import { api } from '../services/api';
import WeeklyHoursBars from './WeeklyHoursBars';
import { STATUS_LABEL, TYPE_LABEL } from '../utils/contact';
import { defaultSchedule, summarizeSchedule } from '../utils/schedule';
import { apptTime, apptEndTime, fullDateLabel, tzLabel } from '../utils/agenda';

const STATUS_STYLE = {
  pending: 'bg-amber-950 text-amber-300 border-amber-500/60',
  confirmed: 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
};

// Visão geral para a gestão: quando cada oraculista atende e o que já está marcado com ele(a).
export default function AdminAgendaPanel({ readers }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});

  useEffect(() => {
    api
      .getAppointments()
      .then(setAppointments)
      .catch((err) => setError(err.message || 'Não foi possível carregar os agendamentos.'))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const active = appointments
    .filter((a) => ['pending', 'confirmed'].includes(a.status) && Date.parse(a.scheduledAt) + a.durationMinutes * 60000 > now)
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

  const rows = readers.map((r) => {
    const schedule = r.schedule || defaultSchedule();
    const summary = summarizeSchedule(schedule);
    return {
      reader: r,
      schedule,
      summary,
      custom: !!r.schedule,
      appts: active.filter((a) => a.readerId === r.id),
      noDays: summary.length === 0
    };
  });

  const withoutDays = rows.filter((x) => x.noDays).length;
  const totalPending = active.filter((a) => a.status === 'pending').length;

  const kpis = [
    { label: 'Oraculistas ativos', value: rows.length, tone: 'text-white' },
    { label: 'Consultas marcadas', value: active.length, tone: 'text-emerald-300' },
    { label: 'Aguardando confirmação', value: totalPending, tone: totalPending ? 'text-amber-300' : 'text-white' },
    { label: 'Sem horários ativos', value: withoutDays, tone: withoutDays ? 'text-rose-300' : 'text-white' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#d4af37]" /> Agenda dos oraculistas
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Veja quando cada oraculista atende e quais consultas já estão marcadas. Cada oraculista edita os próprios horários
          no painel dele; aqui você só acompanha.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className={`text-3xl font-extrabold font-cinzel mt-1 ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-[#d4af37] font-cinzel flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando agendas...
        </p>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center bg-[#0f121d] border border-[#d4af37]/20 rounded-3xl text-xs text-slate-400">
          <Users className="w-10 h-10 text-[#d4af37]/60 mx-auto mb-3" />
          Nenhum oraculista aprovado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ reader, schedule, summary, custom, appts, noDays }) => {
            const tz = schedule.timezone || 'America/Sao_Paulo';
            const isOpen = !!open[reader.id];
            return (
              <div key={reader.id} className="bg-[#0b0d14] border border-[#d4af37]/20 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={reader.avatar} alt={reader.name} className="w-11 h-11 rounded-xl object-cover border border-[#d4af37]/40 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{reader.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {appts.length === 0
                          ? 'Nenhuma consulta marcada'
                          : `${appts.length} consulta${appts.length > 1 ? 's' : ''} marcada${appts.length > 1 ? 's' : ''}`}
                        {' · '}
                        {tzLabel(tz)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen({ ...open, [reader.id]: !isOpen })}
                    className="px-3 py-1.5 rounded-lg bg-[#141826] border border-[#d4af37]/25 text-[11px] font-semibold text-slate-300 hover:border-[#d4af37]/60 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {isOpen ? 'Recolher' : 'Ver semana e consultas'}
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Resumo dos horários */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {noDays ? (
                    <span className="text-[11px] text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Sem dias ativos: ninguém consegue agendar
                    </span>
                  ) : (
                    summary.map((g) => (
                      <span key={g.days} className="text-[11px] text-slate-200 bg-[#141826] border border-[#d4af37]/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#d4af37]" />
                        <strong className="text-[#f3eed9]">{g.days}</strong> {g.text}
                      </span>
                    ))
                  )}
                  {!custom && !noDays && (
                    <span className="text-[10px] text-slate-500 self-center">(padrão: ainda não personalizou)</span>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Semana</p>
                      <WeeklyHoursBars schedule={schedule} />
                      {schedule.blockedDates?.length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-3">
                          Folgas: {schedule.blockedDates.map((b) => b.split('-').reverse().join('/')).join(', ')}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Próximas consultas</p>
                      {appts.length === 0 ? (
                        <p className="text-xs text-slate-500">Nada marcado por enquanto.</p>
                      ) : (
                        <ul className="space-y-2">
                          {appts.slice(0, 8).map((a) => {
                            const TypeIcon = a.type === 'audio' ? Phone : Video;
                            return (
                              <li key={a.id} className="bg-[#10131f] border border-[#d4af37]/15 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white">
                                    {fullDateLabel(a.scheduledAt, tz)} · {apptTime(a.scheduledAt, tz)}–{apptEndTime(a.scheduledAt, a.durationMinutes, tz)}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                                    <TypeIcon className="w-3 h-3 text-[#d4af37]" />
                                    {a.clientName} · {TYPE_LABEL[a.type]}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[a.status]}`}>
                                  {STATUS_LABEL[a.status]}
                                </span>
                              </li>
                            );
                          })}
                          {appts.length > 8 && <li className="text-[11px] text-slate-500">+ {appts.length - 8} consulta(s) mais adiante</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
