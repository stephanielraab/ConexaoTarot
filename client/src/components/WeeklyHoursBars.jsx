import React from 'react';
import { DAY_ORDER, DAY_SHORT, toMinutes, formatRanges, defaultSchedule } from '../utils/schedule';

// Semana em barras de 24h: a parte dourada mostra quando o oraculista atende em cada dia.
export default function WeeklyHoursBars({ schedule }) {
  const weekly = (schedule || defaultSchedule()).weekly;

  return (
    <div className="space-y-1.5">
      {DAY_ORDER.map((d) => {
        const ranges = weekly[String(d)] || [];
        return (
          <div key={d} className="flex items-center gap-2 sm:gap-3">
            <span className={`w-9 shrink-0 text-[11px] font-semibold ${ranges.length ? 'text-slate-200' : 'text-slate-600'}`}>
              {DAY_SHORT[d]}
            </span>
            <div className="relative flex-1 h-3 rounded-full bg-[#141826] border border-[#d4af37]/10 overflow-hidden">
              {ranges.map((r, i) => (
                <span
                  key={i}
                  className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#d4af37] to-[#aa8420]"
                  style={{
                    left: `${(toMinutes(r.start) / 1440) * 100}%`,
                    width: `${((toMinutes(r.end) - toMinutes(r.start)) / 1440) * 100}%`
                  }}
                />
              ))}
            </div>
            <span className="w-24 sm:w-36 shrink-0 text-[10px] sm:text-[11px] text-slate-400 text-right truncate">
              {ranges.length ? formatRanges(ranges) : 'Folga'}
            </span>
          </div>
        );
      })}
      {/* Régua de horas */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="w-9 shrink-0" />
        <div className="relative flex-1 h-3 text-[9px] text-slate-500">
          {[0, 6, 12, 18, 24].map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2"
              style={{ left: `${(h / 24) * 100}%`, ...(h === 0 ? { transform: 'none' } : h === 24 ? { transform: 'translateX(-100%)' } : {}) }}
            >
              {h}h
            </span>
          ))}
        </div>
        <span className="w-24 sm:w-36 shrink-0" />
      </div>
    </div>
  );
}
