import React from 'react';
import { 
  Sparkles, 
  Video, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Star, 
  Layers,
  Moon
} from 'lucide-react';

export default function HeroSection({ onOpenDailyCard, onExploreReaders }) {
  return (
    <div className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      
      {/* Elementos Decorativos de Fundo com o Modelo da Carta de Tarô Dourada */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        
        {/* Carta Flutuante de Fundo 1 (Esquerda - Inclinada a -12deg) */}
        <div className="absolute -top-4 -left-10 sm:left-4 w-40 sm:w-52 h-68 sm:h-84 rounded-2xl border border-[#d4af37]/30 shadow-2xl -rotate-12 overflow-hidden opacity-30 sm:opacity-40 hidden sm:block">
          <img 
            src="/tarot-gold-card.jpg" 
            alt="Carta de Tarô Dourada" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Carta Flutuante de Fundo 2 (Direita - Inclinada a +12deg) */}
        <div className="absolute -top-2 -right-10 sm:right-4 w-40 sm:w-52 h-68 sm:h-84 rounded-2xl border border-[#d4af37]/30 shadow-2xl rotate-12 overflow-hidden opacity-30 sm:opacity-40 hidden sm:block">
          <img 
            src="/tarot-gold-card.jpg" 
            alt="Carta de Tarô Dourada" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Carta Flutuante de Fundo 3 (Inferior Central - Fundo Suave) */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-60 h-84 rounded-2xl border border-[#d4af37]/20 shadow-xl rotate-3 overflow-hidden opacity-15">
          <img 
            src="/tarot-gold-card.jpg" 
            alt="Carta de Tarô Dourada" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Golden ambient aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-[#d4af37]/12 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#1a2238]/40 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Minimalist Tarot Pill */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#10131f]/90 border border-[#d4af37]/35 text-[#f3eed9] text-xs font-cinzel font-semibold shadow-lg shadow-black/40 backdrop-blur-sm">
            <span className="text-xs text-[#d4af37]">✦</span>
            <span className="tracking-widest uppercase text-[11px] text-[#d4af37]">
              Consultas de Tarô Online Ao Vivo
            </span>
            <span className="w-1 h-1 rounded-full bg-[#d4af37]"></span>
            <span className="text-slate-300 font-normal">Sem Espera • Sigilo Total</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-cinzel tracking-wide text-[#f3eed9] leading-tight mb-5">
            Ilumine seus Caminhos com os{' '}
            <span className="gold-gradient-text block sm:inline">
              Arcanos do Tarô
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed mb-8 max-w-2xl mx-auto">
            Orientação clara e acolhedora para o <strong className="text-[#d4af37] font-medium">amor</strong>, <strong className="text-[#d4af37] font-medium">trabalho</strong> e <strong className="text-[#d4af37] font-medium">decisões de vida</strong>. Conecte-se com tarólogos experientes e receba respostas imediatas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button 
              onClick={onExploreReaders}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs uppercase tracking-wider shadow-xl shadow-[#d4af37]/20 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Consultar Tarólogos Agora</span>
            </button>

            <button 
              onClick={onOpenDailyCard}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#10131f] hover:bg-[#181d30] border border-[#d4af37]/40 text-[#f3eed9] font-cinzel font-semibold text-xs uppercase tracking-wider transition-all hover:border-[#d4af37] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Moon className="w-4 h-4 text-[#d4af37]" />
              <span>Tirar Carta do Dia (Grátis)</span>
            </button>
          </div>
        </div>

        {/* Minimalist Classic Tarot Cards Showcase */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/80 font-cinzel font-semibold">
              ✦ Cartas em Destaque no Portal ✦
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: O Mago (The Magician) */}
            <div className="bg-[#0b0d14] border border-[#d4af37]/25 rounded-2xl p-5 hover:border-[#d4af37] transition-all duration-300 hover:-translate-y-1 group shadow-lg">
              <div className="aspect-[2/3] rounded-xl bg-gradient-to-b from-[#101322] to-[#07080d] border border-[#d4af37]/20 p-4 flex flex-col justify-between relative overflow-hidden mb-4 group-hover:border-[#d4af37]/50">
                <div className="flex items-center justify-between text-[#d4af37]/70 text-[10px] font-cinzel">
                  <span>I</span>
                  <span>THE MAGICIAN</span>
                  <span>I</span>
                </div>
                <div className="text-center my-auto">
                  <div className="w-14 h-14 rounded-full border border-[#d4af37]/35 mx-auto flex items-center justify-center text-xl text-[#d4af37] mb-2 bg-[#0e111d] shadow-inner group-hover:scale-110 transition-transform">
                    ∞
                  </div>
                  <h4 className="font-cinzel font-bold text-sm text-[#f3eed9] tracking-wider">
                    O Mago
                  </h4>
                  <p className="text-[10px] text-[#d4af37] font-cinzel tracking-widest uppercase mt-0.5">
                    Iniciativa & Poder
                  </p>
                </div>
                <div className="text-center text-[9px] text-slate-500 font-cinzel tracking-widest border-t border-[#d4af37]/15 pt-2">
                  DOMÍNIO DOS RECURSOS
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center leading-relaxed font-light">
                O poder de manifestar metas, transformar planos em realidade e abrir novos caminhos na vida prática.
              </p>
            </div>

            {/* Card 2: A Carta Dourada Astrológica (Modelo Sol & Luas enviado pelo usuário) */}
            <div className="bg-[#10131f] border-2 border-[#d4af37] rounded-2xl p-5 hover:border-[#e5c368] transition-all duration-300 hover:-translate-y-1.5 group shadow-xl shadow-[#d4af37]/15 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4af37] text-slate-950 px-3 py-0.5 rounded-full text-[9px] font-bold font-cinzel uppercase tracking-widest shadow-md">
                Baralho Dourado
              </div>
              <div className="aspect-[2/3] rounded-xl border border-[#d4af37]/50 relative overflow-hidden mb-4 group-hover:border-[#d4af37] shadow-inner bg-black">
                <img 
                  src="/tarot-gold-card.jpg" 
                  alt="Carta de Tarô Dourada do Usuário" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between text-[#f3eed9] text-[10px] font-cinzel font-bold">
                    <span>XIX</span>
                    <span>THE SUN & MOON</span>
                    <span>XIX</span>
                  </div>
                  <div className="text-center">
                    <h4 className="font-cinzel font-bold text-sm text-[#f3eed9] tracking-wider drop-shadow">
                      O Sol Astrológico
                    </h4>
                    <p className="text-[9px] text-[#d4af37] font-cinzel tracking-widest uppercase mt-0.5">
                      Harmonia Cósmica
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 text-center leading-relaxed font-light">
                O relógio astrológico dourado com a união sagrada do Sol e da Lua, trazendo clareza cristalina para suas decisões.
              </p>
            </div>

            {/* Card 3: A Sacerdotisa (The High Priestess) */}
            <div className="bg-[#0b0d14] border border-[#d4af37]/25 rounded-2xl p-5 hover:border-[#d4af37] transition-all duration-300 hover:-translate-y-1 group shadow-lg">
              <div className="aspect-[2/3] rounded-xl bg-gradient-to-b from-[#101322] to-[#07080d] border border-[#d4af37]/20 p-4 flex flex-col justify-between relative overflow-hidden mb-4 group-hover:border-[#d4af37]/50">
                <div className="flex items-center justify-between text-[#d4af37]/70 text-[10px] font-cinzel">
                  <span>II</span>
                  <span>THE PRIESTESS</span>
                  <span>II</span>
                </div>
                <div className="text-center my-auto">
                  <div className="w-14 h-14 rounded-full border border-[#d4af37]/35 mx-auto flex items-center justify-center text-xl text-[#d4af37] mb-2 bg-[#0e111d] shadow-inner group-hover:scale-110 transition-transform">
                    ☽
                  </div>
                  <h4 className="font-cinzel font-bold text-sm text-[#f3eed9] tracking-wider">
                    A Sacerdotisa
                  </h4>
                  <p className="text-[10px] text-[#d4af37] font-cinzel tracking-widest uppercase mt-0.5">
                    Intuição & Segredo
                  </p>
                </div>
                <div className="text-center text-[9px] text-slate-500 font-cinzel tracking-widest border-t border-[#d4af37]/15 pt-2">
                  O VÉU DOS MISTÉRIOS
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center leading-relaxed font-light">
                Revela intenções ocultas, verdades silenciosas e direciona suas escolhas pelo poder da intuição.
              </p>
            </div>

          </div>
        </div>

        {/* Consultation Methods Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left max-w-4xl mx-auto">
          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 p-4 rounded-xl flex items-center gap-3.5 hover:border-[#d4af37]/50 transition-all">
            <div className="w-11 h-11 rounded-lg bg-[#10131f] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#f3eed9] font-cinzel uppercase tracking-wider">Vídeo Chamada</p>
              <p className="text-[11px] text-slate-400">Tiragem de cartas ao vivo em tempo real</p>
            </div>
          </div>

          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 p-4 rounded-xl flex items-center gap-3.5 hover:border-[#d4af37]/50 transition-all">
            <div className="w-11 h-11 rounded-lg bg-[#10131f] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#f3eed9] font-cinzel uppercase tracking-wider">Ligação de Áudio</p>
              <p className="text-[11px] text-slate-400">Conversa direta e sigilosa no navegador</p>
            </div>
          </div>

          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 p-4 rounded-xl flex items-center gap-3.5 hover:border-[#d4af37]/50 transition-all">
            <div className="w-11 h-11 rounded-lg bg-[#10131f] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#f3eed9] font-cinzel uppercase tracking-wider">WhatsApp Oficial</p>
              <p className="text-[11px] text-slate-400">Atendimento prático e seguro no app</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 border-t border-[#d4af37]/15 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sigilo & Privacidade 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <span>Atendimento Imediato Sem Fila</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
            <span>Tarólogos Avaliados com 5 Estrelas</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>Cobrança Transparente por Minuto</span>
          </div>
        </div>

      </div>
    </div>
  );
}
