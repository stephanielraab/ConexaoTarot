// Datas da agenda no FUSO do oraculista (os horários dele valem nesse fuso).
import { DAY_SHORT } from './schedule';

const pad = (n) => String(n).padStart(2, '0');

export function partsInZone(ms, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const o = {};
  for (const p of dtf.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute };
}

export const dayKeyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// Próximos `count` dias a partir de hoje (no fuso informado)
export function upcomingDays(timeZone, count = 15, nowMs = Date.now()) {
  const t = partsInZone(nowMs, timeZone);
  return Array.from({ length: count }, (_, i) => {
    const c = new Date(Date.UTC(t.y, t.m - 1, t.d + i));
    const y = c.getUTCFullYear();
    const m = c.getUTCMonth() + 1;
    const d = c.getUTCDate();
    return { key: dayKeyOf(y, m, d), dow: c.getUTCDay(), y, m, d, index: i };
  });
}

export function apptDayKey(iso, timeZone) {
  const p = partsInZone(Date.parse(iso), timeZone);
  return dayKeyOf(p.y, p.m, p.d);
}

export function apptTime(iso, timeZone) {
  const p = partsInZone(Date.parse(iso), timeZone);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

export function apptEndTime(iso, minutes, timeZone) {
  return apptTime(new Date(Date.parse(iso) + minutes * 60000).toISOString(), timeZone);
}

// "Hoje · 17/11", "Amanhã · 18/11", "Qua · 19/11"
export function dayTitle(day) {
  const date = `${pad(day.d)}/${pad(day.m)}`;
  if (day.index === 0) return `Hoje · ${date}`;
  if (day.index === 1) return `Amanhã · ${date}`;
  return `${DAY_SHORT[day.dow]} · ${date}`;
}

// "Quarta, 19/11" a partir de um ISO (para listas que não estão agrupadas por dia)
export function fullDateLabel(iso, timeZone) {
  const p = partsInZone(Date.parse(iso), timeZone);
  const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return `${DAY_SHORT[dow]}, ${pad(p.d)}/${pad(p.m)}`;
}

export const tzLabel = (tz) =>
  ({
    'America/Sao_Paulo': 'horário de Brasília',
    'America/Manaus': 'horário de Manaus',
    'America/Cuiaba': 'horário de Cuiabá',
    'America/Rio_Branco': 'horário do Acre',
    'America/Noronha': 'horário de Fernando de Noronha',
    'Europe/Lisbon': 'horário de Lisboa'
  }[tz] || tz);
