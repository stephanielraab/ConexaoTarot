import React, { useState } from 'react';
import { X, Sparkles, Flame, RotateCw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { tarotDeck } from '../data/tarotDeckClient';

export default function DailyCardModal({ onClose, onConsultNow }) {
  const [drawnCard, setDrawnCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDrawCard = () => {
    const random = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
    setDrawnCard(random);
    setIsFlipped(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 }
      });
    } catch (e) {}
  };

  const handleReset = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setDrawnCard(null);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-[#d4af37]/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10131f] border border-[#d4af37]/40 text-[#d4af37] text-xs font-cinzel font-semibold mb-2">
            <span>✦</span>
            <span>Oráculo Diário • Tarô Gratuito</span>
          </div>
          <h3 className="text-xl font-bold font-cinzel text-[#f3eed9]">Carta do Dia & Orientação</h3>
          <p className="text-xs text-slate-400 font-light mt-1">
            Respire fundo, mentalize sua questão e toque na carta para revelar a mensagem do tarô para o seu momento.
          </p>
        </div>

        {/* Card Stage */}
        <div className="my-6 flex justify-center perspective-1000">
          {!drawnCard ? (
            <div
              onClick={handleDrawCard}
              className="w-52 h-80 rounded-2xl border-2 border-[#d4af37] shadow-2xl relative overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group"
            >
              <img 
                src="/tarot-gold-card.jpg" 
                alt="Carta de Tarô Dourada" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50 p-4 flex flex-col justify-between items-center text-center">
                <span className="text-[10px] text-[#f3eed9] font-cinzel tracking-widest uppercase bg-black/70 px-3 py-0.5 rounded-full border border-[#d4af37]/40 shadow-sm">
                  ✦ Baralho Dourado ✦
                </span>

                <div className="w-12 h-12 rounded-full border border-[#d4af37] bg-black/75 flex items-center justify-center my-auto group-hover:scale-110 transition-transform shadow-xl">
                  <Sparkles className="w-6 h-6 text-[#d4af37] animate-pulse" />
                </div>

                <div className="bg-black/80 px-3.5 py-1.5 rounded-xl border border-[#d4af37]/40 backdrop-blur-sm">
                  <p className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-widest">
                    Toque para Revelar
                  </p>
                  <p className="text-[9px] text-slate-300 mt-0.5 font-cinzel">Sintonizando os Arcanos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-52 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-2xl bg-[#10131f] p-3 animate-fadeIn">
              <div className="w-full h-64 rounded-xl overflow-hidden border border-[#d4af37]/40 mb-3 bg-black">
                <img
                  src={drawnCard.image}
                  alt={drawnCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold font-cinzel text-[#d4af37] uppercase tracking-widest block">
                Arcano Nº {drawnCard.number}
              </span>
              <h4 className="text-base font-bold font-cinzel text-[#f3eed9] mb-1">{drawnCard.name}</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3 font-light">
                {drawnCard.summary}
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {drawnCard.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[9px] bg-[#0b0d14] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/30"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {drawnCard && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => { onClose(); onConsultNow(); }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-xl shadow-[#d4af37]/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Aprofundar com um Tarólogo Online</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Tirar Outra Carta
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
