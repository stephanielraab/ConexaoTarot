import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// Resumo mostrado ao oraculista quando o atendimento termina
export default function ReaderCallSummaryModal({ summary, onClose }) {
  const none = !summary || summary.cost === 0;
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-[#d4af37]/40 rounded-3xl max-w-sm w-full p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold font-cinzel text-[#f3eed9]">Atendimento encerrado</h3>
        {none ? (
          <p className="text-xs text-slate-300 mt-3">Esta chamada não chegou a ser conectada, então não houve cobrança.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400 mt-3">
              {summary.minutes} min com {summary.clientName}
            </p>
            <p className="text-3xl font-bold font-cinzel text-[#d4af37] mt-2">
              R$ {Number(summary.readerEarnings).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">já creditado no seu saldo (80% do valor)</p>
          </>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
