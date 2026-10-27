import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  ThumbsUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ConsultationSummaryModal({ 
  summaryData, 
  onClose, 
  onSubmitReview 
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!summaryData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview(summaryData.consultationId, rating, review);
    setSubmitted(true);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e101b] border border-[#d4af37]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-center">
        
        {/* Glow Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#141724] border border-[#d4af37]/50 p-1 mx-auto mb-4 shadow-lg">
          <div className="w-full h-full bg-[#090a10] rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold font-cinzel text-[#f3eed9] mb-1">
          Consulta Finalizada com Sucesso!
        </h3>
        <p className="text-xs text-slate-400 font-light mb-6">
          Esperamos que as revelações do tarô tenham trazido clareza e paz aos seus caminhos.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-[#090a10] border border-[#d4af37]/20 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141724] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Tempo de Duração</p>
              <p className="text-sm font-bold font-cinzel text-[#f3eed9]">
                {summaryData.durationMinutes} minutos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141724] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Valor Cobrado</p>
              <p className="text-sm font-bold font-cinzel text-[#d4af37]">
                R$ {Number(summaryData.cost || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-cinzel text-slate-300 mb-2">
                Como foi sua experiência com <strong className="text-[#d4af37]">{summaryData.readerName}</strong>?
              </label>
              
              {/* Star Rating Picker */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-[#d4af37] fill-[#d4af37]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Deixe um depoimento ou agradecimento para o oraculista (opcional)..."
                rows="3"
                className="w-full bg-[#090a10] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[#141724] border border-[#d4af37]/20 text-slate-300 font-cinzel text-xs hover:bg-[#1a2033] transition-colors cursor-pointer"
              >
                Pular Avaliação
              </button>

              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg shadow-[#d4af37]/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ThumbsUp className="w-4 h-4" />
                Enviar Avaliação
              </button>
            </div>
          </form>
        ) : (
          <div className="py-4 space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold font-cinzel text-white">Muito obrigado pelo seu feedback!</p>
            <p className="text-xs text-slate-400 font-light">Sua avaliação ajuda a fortalecer nossa comunidade e guia outros consulentes.</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 font-bold font-cinzel text-xs cursor-pointer shadow-md"
            >
              Concluir & Fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
