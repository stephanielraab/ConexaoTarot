// Agenda de atendimento de cada oraculista.
//
// schedule = {
//   timezone: 'America/Sao_Paulo',
//   weekly: { '0': [], '1': [{ start: '09:00', end: '12:00' }, ...], ... '6': [] },   // 0 = domingo
//   blockedDates: ['2026-11-02']                                                        // folgas
// }
//
// Os horários valem no fuso do oraculista. O cliente recebe instantes (ISO/UTC)
// e os vê no próprio fuso, então tudo bate mesmo com pessoas em lugares diferentes.

export const SLOT_STEP_MIN = 30;
export const MIN_NOTICE_MIN = 30;
export const DAYS_AHEAD = 14;
export const MAX_RANGES_PER_DAY = 3;
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const HHMM = /^([01]\d|2[0-3]):(00|30)$/;

// Padrão para quem ainda não configurou: todos os dias, das 08h às 22h
export function defaultSchedule() {
  const weekly = {};
  for (let d = 0; d < 7; d++) weekly[String(d)] = [{ start: '08:00', end: '22:00' }];
  return { timezone: DEFAULT_TIMEZONE, weekly, blockedDates: [] };
}

export const getSchedule = (reader) => reader?.schedule || defaultSchedule();

export const toMinutes = (hhmm) => {
  if (hhmm === '24:00') return 1440;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: tz });
    return typeof tz === 'string' && tz.length > 0;
  } catch {
    return false;
  }
}

// Valida e normaliza o que o oraculista enviou. Retorna { ok, schedule } ou { ok:false, error }
export function validateSchedule(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Agenda inválida.' };

  const timezone = input.timezone || DEFAULT_TIMEZONE;
  if (!isValidTimezone(timezone)) return { ok: false, error: 'Fuso horário inválido.' };

  const weekly = {};
  for (let d = 0; d < 7; d++) {
    const key = String(d);
    const ranges = Array.isArray(input.weekly?.[key]) ? input.weekly[key] : [];
    if (ranges.length > MAX_RANGES_PER_DAY) {
      return { ok: false, error: `Use no máximo ${MAX_RANGES_PER_DAY} turnos por dia.` };
    }
    const clean = [];
    for (const r of ranges) {
      if (!r || !HHMM.test(r.start) || !(HHMM.test(r.end) || r.end === '24:00')) {
        return { ok: false, error: 'Horários devem estar em intervalos de 30 minutos (ex: 09:00, 09:30).' };
      }
      if (toMinutes(r.start) >= toMinutes(r.end)) {
        return { ok: false, error: 'Em cada turno, o início precisa ser antes do fim.' };
      }
      clean.push({ start: r.start, end: r.end });
    }
    clean.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < clean.length; i++) {
      if (toMinutes(clean[i].start) < toMinutes(clean[i - 1].end)) {
        return { ok: false, error: 'Há turnos sobrepostos no mesmo dia.' };
      }
    }
    weekly[key] = clean;
  }

  const blocked = Array.isArray(input.blockedDates) ? input.blockedDates : [];
  if (blocked.length > 90) return { ok: false, error: 'Muitas folgas cadastradas (máximo 90).' };
  const blockedDates = [];
  for (const b of blocked) {
    if (typeof b !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b) || isNaN(Date.parse(b + 'T00:00:00Z'))) {
      return { ok: false, error: 'Data de folga inválida.' };
    }
    if (!blockedDates.includes(b)) blockedDates.push(b);
  }
  blockedDates.sort();

  return { ok: true, schedule: { timezone, weekly, blockedDates } };
}

// ---------- Fusos horários (sem bibliotecas externas) ----------

function partsInZone(ms, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const o = {};
  for (const p of dtf.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, s: +o.second };
}

// Diferença (ms) entre o relógio local do fuso e o UTC naquele instante
function zoneOffsetMs(ms, timeZone) {
  const p = partsInZone(ms, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

// "2026-11-03 09:30 em America/Sao_Paulo" -> instante UTC (ms)
export function zonedToUtcMs(y, m, d, h, mi, timeZone) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let result = guess - zoneOffsetMs(guess, timeZone);
  result = guess - zoneOffsetMs(result, timeZone); // corrige em viradas de horário de verão
  return result;
}

// ---------- Horários livres ----------

// busy: [{ scheduledAt, durationMinutes }]. Retorna lista de ISO (UTC) em que cabe uma consulta de `duration` min.
export function availableSlots(schedule, duration, busy = [], nowMs = Date.now()) {
  const tz = schedule.timezone || DEFAULT_TIMEZONE;
  const today = partsInZone(nowMs, tz);
  const busyRanges = busy.map(b => {
    const s = new Date(b.scheduledAt).getTime();
    return [s, s + b.durationMinutes * 60000];
  });
  const earliest = nowMs + MIN_NOTICE_MIN * 60000;
  const slots = [];

  for (let i = 0; i < DAYS_AHEAD + 1; i++) {
    const civil = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const y = civil.getUTCFullYear();
    const m = civil.getUTCMonth() + 1;
    const d = civil.getUTCDate();
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (schedule.blockedDates?.includes(dateKey)) continue;

    const ranges = schedule.weekly?.[String(civil.getUTCDay())] || [];
    for (const r of ranges) {
      const startMin = toMinutes(r.start);
      const endMin = toMinutes(r.end);
      for (let t = startMin; t + duration <= endMin; t += SLOT_STEP_MIN) {
        const startMs = zonedToUtcMs(y, m, d, Math.floor(t / 60), t % 60, tz);
        if (startMs < earliest) continue;
        const endMs = startMs + duration * 60000;
        if (busyRanges.some(([bs, be]) => startMs < be && bs < endMs)) continue;
        slots.push(new Date(startMs).toISOString());
      }
    }
  }
  return slots;
}
