import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Video,
  Phone,
  MessageSquare,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { TYPE_LABEL, formatDateTime, money } from '../utils/contact';

const TYPES = [
  { id: 'video', label: 'Vídeo', Icon: Video },
  { id: 'audio', label: 'Áudio', Icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare }
];
const DURATIONS = [15, 30, 60];
const FIRST_HOUR = 8;
const LAST_HOUR = 22; // último horário às 21:30
const DAYS_AHEAD = 14;
const MIN_NOTICE_MS = 30 * 60000;

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ScheduleModal({ reader, currentUser, onClose, onViewAppointments }) {
  const [type, setType] = useState('video');
  const [duration, setDuration] = useState(30);
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const loadBusy = async () => {
    try {
      setBusy(await api.getReaderBusySlots(reader.id));
    } catch {
      setBusy([]);
    } finally {
      setLoadingBusy(false);
    }
  };

  useEffect(() => {
    loadBusy();
  }, [reader.id]);

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const slots = useMemo(() => {
    const [y, m, d] = selectedDay.split('-').map(Number);
    const now = Date.now();
    const list = [];
    for (let h = FIRST_HOUR; h < LAST_HOUR; h++) {
      for (const min of [0, 30]) {
        const start = new Date(y, m - 1, d, h, min, 0, 0);
        const startMs = start.getTime();
        const tooSoon = startMs < now + MIN_NOTICE_MS;
        const taken = busy.some((b) => {
          const bStart = new Date(b.scheduledAt).getTime();
          return startMs < bStart + b.durationMinutes * 60000 && bStart < startMs + duration * 60000;
        });
        list.push({ label: `${pad(h)}:${pad(min)}`, start, disabled: tooSoon || taken, taken });
      }
    }
    return list;
  }, [selectedDay, busy, duration]);

  // Se a duração mudar e o horário escolhido deixar de caber, limpa a escolha
  useEffect(() => {
    if (selectedTime && slots.find((s) => s.label === selectedTime)?.disabled) {
      setSelectedTime('');
    }
  }, [slots, selectedTime]);

  const estimated = reader.pricePerMinute * duration;
  const selectedDayLabel = (() => {
    const [y, m, d] = selectedDay.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  })();

  const handleSubmit = async () => {
    setError('');
    const slot = slots.find((s) => s.label === selectedTime);
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
        scheduledAt: slot.start.toISOString(),
        notes: notes.trim()
      });
      setCreated(appt);
    } catch (err) {
      setError(err.message || 'Não foi possível agendar.');
      loadBusy(); // atualiza horários caso alguém tenha reservado antes
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
          <div className="grid grid-cols-3 gap-2">
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

        {/* Dia */}
        <div>
          <span className="block text-xs font-cinzel font-bold text-[#d4af37] mb-2">Escolha o dia</span>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const key = dayKey(d);
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

        {/* Horário */}
        <div>
          <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#d4af37] mb-2">
            <Clock className="w-3.5 h-3.5" />
            Escolha o horário
          </span>
          {loadingBusy ? (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-spin" /> Consultando a agenda...
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  disabled={slot.disabled}
                  onClick={() => setSelectedTime(slot.label)}
                  title={slot.taken ? 'Horário já reservado' : undefined}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    slot.disabled
                      ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed line-through'
                      : selectedTime === slot.label
                      ? 'bg-[#2a2211] border-[#d4af37] text-[#f3eed9] cursor-pointer'
                      : 'bg-[#10131f] border-[#d4af37]/25 text-slate-200 hover:border-[#d4af37] cursor-pointer'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
          {!loadingBusy && slots.every((s) => s.disabled) && (
            <p className="text-[11px] text-amber-300/90 mt-2">Sem horários livres neste dia. Tente outro dia.</p>
          )}
        </div>

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
          Nada é cobrado agora: o valor é debitado do seu saldo apenas ao final do atendimento.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedTime}
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
