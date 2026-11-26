import React, { useState } from 'react';
import { Plus, Trash2, Save, CheckCircle2, CalendarOff, Copy, Globe } from 'lucide-react';
import { api } from '../services/api';
import {
  DAY_ORDER,
  DAY_NAMES,
  TIMEZONES,
  MAX_RANGES_PER_DAY,
  START_OPTIONS,
  END_OPTIONS,
  cloneSchedule,
  defaultSchedule,
  scheduleError,
  summarizeSchedule
} from '../utils/schedule';

const PRESETS = [
  {
    label: 'Comercial (seg–sex, 9h–18h)',
    build: () => {
      const s = defaultSchedule();
      for (let d = 0; d < 7; d++) s.weekly[String(d)] = [1, 2, 3, 4, 5].includes(d) ? [{ start: '09:00', end: '18:00' }] : [];
      return s;
    }
  },
  {
    label: 'Noite (todos os dias, 19h–24h)',
    build: () => {
      const s = defaultSchedule();
      for (let d = 0; d < 7; d++) s.weekly[String(d)] = [{ start: '19:00', end: '24:00' }];
      return s;
    }
  },
  { label: 'Todos os dias, 8h–22h', build: defaultSchedule }
];

const selectCls =
  'bg-[#10131f] border border-[#d4af37]/30 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]';

export default function ScheduleEditor({ readerProfile, onSaved }) {
  const [sched, setSched] = useState(() => cloneSchedule(readerProfile?.schedule));
  const [newBlocked, setNewBlocked] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const touch = (fn) => {
    setSched((prev) => {
      const next = cloneSchedule(prev);
      fn(next);
      return next;
    });
    setSuccess('');
  };

  const toggleDay = (d, on) =>
    touch((s) => {
      s.weekly[String(d)] = on ? [{ start: '09:00', end: '18:00' }] : [];
    });

  const addRange = (d) =>
    touch((s) => {
      const list = s.weekly[String(d)];
      const last = list[list.length - 1];
      list.push(last && last.end !== '24:00' ? { start: last.end, end: '24:00' } : { start: '09:00', end: '12:00' });
    });

  const updateRange = (d, i, field, value) =>
    touch((s) => {
      s.weekly[String(d)][i][field] = value;
    });

  const removeRange = (d, i) =>
    touch((s) => {
      s.weekly[String(d)].splice(i, 1);
    });

  const copyToAll = (d) =>
    touch((s) => {
      const src = s.weekly[String(d)];
      for (let k = 0; k < 7; k++) s.weekly[String(k)] = src.map((r) => ({ ...r }));
    });

  const addBlocked = () => {
    if (!newBlocked) return;
    touch((s) => {
      if (!s.blockedDates.includes(newBlocked)) s.blockedDates.push(newBlocked);
      s.blockedDates.sort();
    });
    setNewBlocked('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const problem = scheduleError(sched);
    if (problem) return setError(problem);

    setSaving(true);
    try {
      const updated = await api.updateReaderProfile(readerProfile.id, { schedule: sched });
      onSaved(updated);
      setSuccess('Agenda salva! Os clientes já veem seus novos horários.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar a agenda.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const summary = summarizeSchedule(sched);
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzOptions = TIMEZONES.some((t) => t.id === browserTz) ? TIMEZONES : [{ id: browserTz, label: `${browserTz} (seu aparelho)` }, ...TIMEZONES];
  if (!tzOptions.some((t) => t.id === sched.timezone)) tzOptions.push({ id: sched.timezone, label: sched.timezone });

  return (
    <div className="bg-[#0b0d14] border border-[#d4af37]/25 rounded-3xl p-5 sm:p-8 space-y-6">
      <div>
        <h3 className="text-sm font-bold font-cinzel text-[#f3eed9]">Meus horários de atendimento</h3>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Defina quando você aceita consultas agendadas. Os clientes só conseguem marcar dentro destes horários.
          Para atendimentos imediatos, é só deixar seu status como <strong className="text-[#d4af37]">Online</strong> com o site aberto.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {success}
        </div>
      )}

      {/* Atalhos */}
      <div>
        <span className="block text-[11px] font-cinzel font-bold text-[#d4af37] mb-2">Atalhos</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => touch((s) => Object.assign(s, { weekly: p.build().weekly }))}
              className="px-3 py-1.5 rounded-lg bg-[#10131f] border border-[#d4af37]/30 text-[11px] text-slate-200 hover:border-[#d4af37] transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fuso */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-cinzel font-bold text-[#d4af37] mb-2">
          <Globe className="w-3.5 h-3.5" /> Fuso horário dos seus horários
        </label>
        <select
          value={sched.timezone}
          onChange={(e) => touch((s) => { s.timezone = e.target.value; })}
          className={`${selectCls} w-full sm:w-auto`}
        >
          {tzOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-500 mt-1">O cliente vê cada horário convertido para o fuso dele.</p>
      </div>

      {/* Dias da semana */}
      <div className="space-y-2">
        {DAY_ORDER.map((d) => {
          const ranges = sched.weekly[String(d)];
          const on = ranges.length > 0;
          return (
            <div key={d} className="bg-[#10131f] border border-[#d4af37]/15 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleDay(d, e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                  <span className={`text-sm font-semibold ${on ? 'text-[#f3eed9]' : 'text-slate-500'}`}>{DAY_NAMES[d]}</span>
                </label>
                {!on && <span className="text-[11px] text-slate-500">Folga</span>}
                {on && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToAll(d)}
                      title="Copiar para todos os dias"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#d4af37] hover:bg-[#1a1f33] cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {ranges.length < MAX_RANGES_PER_DAY && (
                      <button
                        type="button"
                        onClick={() => addRange(d)}
                        className="px-2 py-1 rounded-lg text-[11px] text-[#d4af37] hover:bg-[#1a1f33] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Turno
                      </button>
                    )}
                  </div>
                )}
              </div>

              {on && (
                <div className="mt-3 space-y-2">
                  {ranges.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 w-6">das</span>
                      <select value={r.start} onChange={(e) => updateRange(d, i, 'start', e.target.value)} className={selectCls}>
                        {START_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <span className="text-[11px] text-slate-400">às</span>
                      <select value={r.end} onChange={(e) => updateRange(d, i, 'end', e.target.value)} className={selectCls}>
                        {END_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeRange(d, i)}
                        title="Remover turno"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Folgas */}
      <div>
        <span className="flex items-center gap-1.5 text-[11px] font-cinzel font-bold text-[#d4af37] mb-2">
          <CalendarOff className="w-3.5 h-3.5" /> Dias de folga / férias
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            min={today}
            value={newBlocked}
            onChange={(e) => setNewBlocked(e.target.value)}
            className={`${selectCls} flex-1 sm:flex-none`}
          />
          <button
            type="button"
            onClick={addBlocked}
            disabled={!newBlocked}
            className="px-3 py-1.5 rounded-lg bg-[#1b2238] border border-[#d4af37]/40 text-xs font-bold text-[#f3eed9] hover:bg-[#252f4d] disabled:opacity-40 cursor-pointer transition-colors"
          >
            Bloquear dia
          </button>
        </div>
        {sched.blockedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {sched.blockedDates.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 bg-[#241e12] border border-[#d4af37]/30 text-[11px] text-[#f3eed9] rounded-full pl-3 pr-1.5 py-1">
                {b.split('-').reverse().join('/')}
                <button
                  type="button"
                  onClick={() => touch((s) => { s.blockedDates = s.blockedDates.filter((x) => x !== b); })}
                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  aria-label={`Remover folga de ${b}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prévia */}
      <div className="bg-[#10131f] border border-[#d4af37]/20 rounded-2xl p-4">
        <span className="block text-[11px] font-cinzel font-bold text-[#d4af37] mb-2">Como o cliente vê</span>
        {summary.length === 0 ? (
          <p className="text-xs text-amber-300/90">Nenhum dia ativo: ninguém conseguirá agendar com você.</p>
        ) : (
          <ul className="text-xs text-slate-200 space-y-1">
            {summary.map((g) => (
              <li key={g.days}>
                <strong className="text-[#f3eed9]">{g.days}</strong> · {g.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvando...' : 'Salvar meus horários'}
      </button>
    </div>
  );
}
