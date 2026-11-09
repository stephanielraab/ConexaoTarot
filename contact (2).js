import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Video,
  Phone,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { TYPE_LABEL, formatDateTime, money } from '../utils/contact';
import { summarizeSchedule } from '../utils/schedule';

const TYPES = [
  { id: 'video', label: 'Vídeo', Icon: Video },
  { id: 'audio', label: 'Áudio', Icon: Phone }
];
const DURATIONS = [15, 30, 60];
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ScheduleModal({ reader, currentUser, onClose, onViewAppointments }) {
  const [type, setType] = useState('video');
  const [duration, setDuration] = useState(30);
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  const [availability, setAvailability] = useState({ slots: [], timezone: '' });
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  // Horários livres vêm da agenda do próprio oraculista (já sem os reservados)
  const loadSlots = async (minutes = duration) => {
    try {
      setLoadingSlots(true);
      setAvailability(await api.getReaderAvailability(reader.id, minutes));
    } catch {
      setAvailability({ slots: [], timezone: '' });
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    setSelectedTime('');
    loadSlots(duration);
  }, [reader.id, duration]);

  // Agrupa por dia no fuso de quem está agendando
  const slotsByDay = useMemo(() => {
    const map = new Map();
    for (const iso of availability.slots) {
      const d = new Date(iso);
      const key = dayKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ iso, label: `${pad(d.getHours())}:${pad(d.getMinutes())}` });
    }
    return map;
  }, [availability.slots]);

  const dayKeys = useMemo(() => [...slotsByDay.keys()], [slotsByDay]);

  // Seleciona automaticamente o primeiro dia com vagas
  useEffect(() => {
    if (dayKeys.length && !slotsByDay.has(selectedDay)) setSelectedDay(dayKeys[0]);
  }, [dayKeys]);

  const slots = slotsByDay.get(selectedDay) || [];
  const scheduleSummary = summarizeSchedule(reader.schedule);
  const differentTz =
    availability.timezone && availability.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone;

  const estimated = reader.pricePerMinute * duration;
  const selectedDayLabel = (() => {
    const [y, m, d] = selectedDay.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  })();

  const handleSubmit = async () => {
    setError('');
    const slot = slots.find((sl) => sl.label === selectedTime);
    if (!slot) {
      setError('Escolha o dia e o horário da sua consulta.');
      return;
    }
    setSubmitting(true);
    try {
      const appt = await api.createAppointment({
        clientId: currentUser.id,
        readerId: reader.id,
        type,
        durationMinutes: duration,
        scheduledAt: slot.iso,
        notes: notes.trim()
      });
      setCreated(appt);
    } catch (err) {
      setError(err.message || 'Não foi possível agendar.');
      setSelectedTime('');
      loadSlots(duration); // atualiza caso alguém tenha reservado antes
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-[#d4af37]/40 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );

  // ---------- Tela de sucesso ----------
  if (created) {
    const when = formatDateTime(created.scheduledAt);
    return shell(
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold font-cinzel text-[#f3eed9]">Solicitação enviada!</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
          Pedimos a <strong className="text-white">{reader.name}</strong> que confirme sua consulta de{' '}
          <strong className="text-[#d4af37]">{TYPE_LABEL[created.type].toLowerCase()}</strong> em{' '}
          <strong className="text-white">{when.full}</strong> ({created.durationMinutes} min).
          Você acompanha a resposta em <em>Meu Perfil → Agendamentos</em>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#10131f] border border-[#d4af37]/30 text-slate-300 hover:bg-[#181d30] text-xs font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onViewAppointments();
            }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Ver meus agendamentos
          </button>
        </div>
      </div>
    );
  }

  // ---------- Formulário ----------
  return shell(
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10131f] border border-[#d4af37]/40 text-[#d4af37] text-xs font-cinzel font-semibold mb-3">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Agendar consulta</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <img
            src={reader.avatar}
            alt={reader.name}
            className="w-12 h-12 rounded-xl object-cover border border-[#d4af37]/50"
          />
          <div className="text-left">
            <h3 className="text-base font-bold font-cinzel text-[#f3eed9] leading-tight">{reader.name}</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-[#d4af37] font-bold">
                <Star className="w-3 h-3 fill-[#d4af37]" />
                {reader.rating.toFixed(2)}
              </span>
              <span>•</span>
              <span>{money(reader.pricePerMinute)} / min</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>
      )}

      <div className="space-y-5">
        {/* Tipo */}
        <div>
          <span className="block text-xs font-cinzel font-bold text-[#d4af37] mb-2">Como prefere ser atendido(a)?</span>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === id
                    ? 'bg-[#2a2211] border-[#d4af37] text-[#f3eed9] shadow-md'
                    : 'bg-[#10131f] border-[#d4af37]/25 text-slate-300 hover:border-[#d4af37]/60'
                }`}
              >
                <Icon className="w-4 h-4 text-[#d4af37]" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Duração */}
        <div>
          <span className="block text-xs font-cinzel font-bold text-[#d4af37] mb-2">Duração estimada</span>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuration(min)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  duration === min
                    ? 'bg-[#2a2211] border-[#d4af37] text-[#f3eed9] shadow-md'
                    : 'bg-[#10131f] border-[#d4af37]/25 text-slate-300 hover:border-[#d4af37]/60'
                }`}
              >
                {min} min
                <span className="block text-[10px] font-normal text-slate-400">{money(reader.pricePerMinute * min)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dia e horário */}
        {loadingSlots ? (
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-spin" /> Consultando a agenda de {reader.name.split(' ')[0]}...
          </p>
        ) : dayKeys.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#10131f] border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
            Nenhum horário livre nos próximos 14 dias para {duration} minutos.
            {duration > 15 && ' Tente uma duração menor.'}
            {scheduleSummary.length > 0 && (
              <span className="block mt-2 text-slate-400">
                Agenda de atendimento: {scheduleSummary.map((g) => `${g.days} ${g.text}`).join(' · ')}
              </span>
            )}
          </div>
        ) : (
          <>
            <div>
              <span className="block text-xs font-cinzel font-bold text-[#d4af37] mb-2">Escolha o dia</span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dayKeys.map((key) => {
                  const [y, m, dd] = key.split('-').map(Number);
                  const d = new Date(y, m - 1, dd);
                  const active = key === selectedDay;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDay(key);
                        setSelectedTime('');
                      }}
                      className={`shrink-0 w-14 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-b from-[#d4af37] to-[#aa8420] border-[#d4af37] text-slate-950'
                          : 'bg-[#10131f] border-[#d4af37]/25 text-slate-300 hover:border-[#d4af37]/60'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-semibold">
                        {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <span className="block text-base font-bold font-cinzel leading-tight">{d.getDate()}</span>
                      <span className="block text-[10px] uppercase">
                        {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#d4af37] mb-2">
                <Clock className="w-3.5 h-3.5" />
                Escolha o horário
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot.iso}
                    type="button"
                    onClick={() => setSelectedTime(slot.label)}
                    className={`py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedTime === slot.label
                        ? 'bg-[#2a2211] border-[#d4af37] text-[#f3eed9]'
                        : 'bg-[#10131f] border-[#d4af37]/25 text-slate-200 hover:border-[#d4af37]'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                {differentTz ? 'Horários exibidos no fuso do seu aparelho.' : 'Mostrando só os horários livres da agenda do oraculista.'}
              </p>
            </div>
          </>
        )}

        {/* Observações */}
        <div>
          <label className="block text-xs font-cinzel font-bold text-[#d4af37] mb-2">
            Sobre o que gostaria de conversar? <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            rows={2}
            placeholder="Ex: amor, trabalho, decisão importante..."
            className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37] resize-none"
          />
        </div>

        <div className="flex items-center justify-between text-xs bg-[#10131f] border border-[#d4af37]/20 rounded-xl px-4 py-3">
          <span className="text-slate-400">Valor estimado ({duration} min)</span>
          <span className="font-bold font-cinzel text-[#d4af37]">{money(estimated)}</span>
        </div>
        <p className="text-[11px] text-slate-500 -mt-3 text-center">
          Nada é cobrado agora. O atendimento acontece aqui no site, por vídeo ou áudio, e o valor é debitado do seu saldo só ao final.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedTime || loadingSlots}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          <span>
            {submitting
              ? 'Enviando...'
              : selectedTime
              ? `Solicitar ${selectedTime} · ${selectedDayLabel}`
              : 'Escolha um horário'}
          </span>
        </button>
      </div>
    </>
  );
}
