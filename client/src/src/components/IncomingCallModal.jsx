import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, Loader2, CalendarCheck } from 'lucide-react';

// Toque + vibração enquanto a chamada está tocando
function useRingtone(active) {
  useEffect(() => {
    if (!active) return undefined;
    let ctx = null;
    let timer = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const beep = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.55);
      };
      const cycle = () => {
        ctx.resume?.();
        beep();
        setTimeout(beep, 650);
        navigator.vibrate?.([400, 200, 400]);
      };
      cycle();
      timer = setInterval(cycle, 2500);
    } catch { /* navegador sem áudio liberado: segue só o aviso visual */ }
    return () => {
      clearInterval(timer);
      try { ctx?.close?.(); } catch { /* ok */ }
      navigator.vibrate?.(0);
    };
  }, [active]);
}

export default function IncomingCallModal({ call, onAccept, onDecline }) {
  const total = Math.ceil((call.ringTimeoutMs || 45000) / 1000);
  const [left, setLeft] = useState(total);
  const [busy, setBusy] = useState(false);

  useRingtone(true);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const isVideo = call.type === 'video';
  const maxMin = call.maxMinutes;

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#05060c]/95 backdrop-blur-md flex flex-col items-center justify-between text-center px-6 animate-fadeIn"
      style={{ height: '100dvh', paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      role="alertdialog"
      aria-label="Chamada recebida"
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-[#d4af37] font-cinzel font-semibold">
          {call.scheduled ? 'Consulta agendada' : 'Nova chamada'} · {isVideo ? 'Vídeo' : 'Áudio'}
        </p>
        {call.scheduled && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-3 py-1">
            <CalendarCheck className="w-3.5 h-3.5" /> Cliente com horário marcado
          </p>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute -inset-5 rounded-full border border-[#d4af37]/40 animate-ping" />
          <div className="absolute -inset-10 rounded-full border border-purple-500/20 animate-pulse" />
          <img
            src={call.clientAvatar}
            alt={call.clientName}
            className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-[#d4af37]/60 shadow-2xl bg-slate-900"
          />
        </div>
        <h2 className="text-2xl font-bold font-cinzel text-[#f3eed9]">{call.clientName}</h2>
        <p className="text-sm text-purple-200 mt-2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
          quer ser atendido(a) agora ({left}s)
        </p>
        <p className="text-[11px] text-slate-500 mt-3 max-w-xs">
          Você recebe R$ {(call.pricePerMinute * 0.8).toFixed(2)} por minuto
          {maxMin ? ` · saldo do cliente para até ${maxMin} min` : ''}.
        </p>
      </div>

      <div className="flex items-center justify-center gap-10 w-full">
        <button
          onClick={() => { setBusy(true); onDecline(); }}
          disabled={busy}
          className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-60"
          aria-label="Recusar chamada"
        >
          <span className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
            <PhoneOff className="w-7 h-7" />
          </span>
          <span className="text-xs text-slate-300">Recusar</span>
        </button>
        <button
          onClick={() => { setBusy(true); onAccept(); }}
          disabled={busy}
          className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-60"
          aria-label="Atender chamada"
        >
          <span className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition-all animate-pulse">
            {isVideo ? <Video className="w-9 h-9" /> : <Phone className="w-9 h-9" />}
          </span>
          <span className="text-xs text-slate-200 font-semibold">{busy ? 'Conectando…' : 'Atender'}</span>
        </button>
      </div>
    </div>
  );
}
