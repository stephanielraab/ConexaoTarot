// Agenda semanal do oraculista (cliente). As mesmas regras são validadas no servidor.

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // segunda ... domingo
export const DAY_NAMES = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
export const DAY_SHORT = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };
export const MAX_RANGES_PER_DAY = 3;

export const TIMEZONES = [
  { id: 'America/Sao_Paulo', label: 'Brasília (Brasil)' },
  { id: 'America/Manaus', label: 'Manaus' },
  { id: 'America/Cuiaba', label: 'Cuiabá' },
  { id: 'America/Rio_Branco', label: 'Rio Branco' },
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
  { id: 'Europe/Lisbon', label: 'Lisboa (Portugal)' }
];

export const defaultSchedule = () => {
  const weekly = {};
  for (let d = 0; d < 7; d++) weekly[String(d)] = [{ start: '08:00', end: '22:00' }];
  return { timezone: 'America/Sao_Paulo', weekly, blockedDates: [] };
};

// Cópia segura para editar (garante as 7 chaves)
export const cloneSchedule = (s) => {
  const base = s || defaultSchedule();
  const weekly = {};
  for (let d = 0; d < 7; d++) weekly[String(d)] = (base.weekly?.[String(d)] || []).map((r) => ({ ...r }));
  return { timezone: base.timezone || 'America/Sao_Paulo', weekly, blockedDates: [...(base.blockedDates || [])] };
};

export const toMinutes = (hhmm) => {
  if (hhmm === '24:00') return 1440;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const pad = (n) => String(n).padStart(2, '0');
export const minutesToHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// 00:00 ... 23:30 (início) e 00:30 ... 24:00 (fim)
export const START_OPTIONS = Array.from({ length: 48 }, (_, i) => minutesToHHMM(i * 30));
export const END_OPTIONS = Array.from({ length: 48 }, (_, i) => minutesToHHMM((i + 1) * 30));

// Mesmas regras do servidor; retorna texto de erro ou ''
export function scheduleError(schedule) {
  for (let d = 0; d < 7; d++) {
    const ranges = [...(schedule.weekly[String(d)] || [])].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 0; i < ranges.length; i++) {
      if (toMinutes(ranges[i].start) >= toMinutes(ranges[i].end)) {
        return `${DAY_NAMES[d]}: o início do turno precisa ser antes do fim.`;
      }
      if (i > 0 && toMinutes(ranges[i].start) < toMinutes(ranges[i - 1].end)) {
        return `${DAY_NAMES[d]}: há turnos sobrepostos.`;
      }
    }
  }
  return '';
}

export const formatHour = (hhmm) => hhmm.replace(':00', 'h').replace(':30', 'h30');
export const formatRanges = (ranges) => ranges.map((r) => `${formatHour(r.start)}–${formatHour(r.end)}`).join(' e ');

const rangeText = (ranges) => ranges.map((r) => `${r.start.replace(':00', 'h').replace(':30', 'h30')}–${r.end.replace(':00', 'h').replace(':30', 'h30')}`).join(' e ');

// Resumo legível: "Seg–Sex 09h–18h · Sáb 10h–14h"
export function summarizeSchedule(schedule) {
  if (!schedule) return [];
  const groups = [];
  for (const d of DAY_ORDER) {
    const ranges = schedule.weekly?.[String(d)] || [];
    if (!ranges.length) continue;
    const text = rangeText(ranges);
    const last = groups[groups.length - 1];
    if (last && last.text === text && DAY_ORDER.indexOf(last.lastDay) === DAY_ORDER.indexOf(d) - 1) {
      last.lastDay = d;
    } else {
      groups.push({ firstDay: d, lastDay: d, text });
    }
  }
  return groups.map((g) => ({
    days: g.firstDay === g.lastDay ? DAY_SHORT[g.firstDay] : `${DAY_SHORT[g.firstDay]}–${DAY_SHORT[g.lastDay]}`,
    text: g.text
  }));
}
