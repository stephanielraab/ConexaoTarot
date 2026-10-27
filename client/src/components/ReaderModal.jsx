import React from 'react';
import { 
  X, 
  Star, 
  Video, 
  Phone, 
  MessageSquare, 
  Award, 
  ShieldCheck, 
  Clock,
  CalendarDays
} from 'lucide-react';

export default function ReaderModal({ 
  reader, 
  onClose, 
  onStartConsultation,
  onSchedule
}) {
  if (!reader) return null;

  const isAvailable = reader.status === 'available';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e101b] border border-[#d4af37]/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-[#141724] border border-[#d4af37]/20 rounded-full transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-b from-[#141724] to-transparent border-b border-[#d4af37]/20">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            
            <div
              onClick={() => { onClose(); onSchedule(reader); }}
              title="Agendar consulta"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-[#d4af37] via-[#947625] to-[#141724] shadow-xl shrink-0 cursor-pointer hover:scale-105 transition-transform">
              <img 
                src={reader.avatar} 
                alt={reader.name} 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2
                  onClick={() => { onClose(); onSchedule(reader); }}
                  title="Agendar consulta"
                  className="text-xl sm:text-2xl font-bold font-cinzel text-[#f3eed9] hover:text-[#d4af37] transition-colors cursor-pointer">
                  {reader.name}
                </h2>
                <span 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAvailable 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                      : reader.status === 'busy' 
                      ? 'bg-amber-950 text-amber-300 border-amber-500' 
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {isAvailable ? '🟢 Online Agora' : reader.status === 'busy' ? '🟡 Em Atendimento' : '⚪ Offline'}
                </span>
              </div>

              <p className="text-xs text-[#d4af37] font-medium mb-3">
                {reader.title}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1 text-[#d4af37] font-bold bg-[#141724] px-2 py-1 rounded-lg border border-[#d4af37]/30">
                  <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                  <span>{reader.rating.toFixed(2)} (Avaliação Máxima)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <span>{reader.experienceYears || 8} anos de vivência</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-4 h-4 text-[#d4af37]" />
                  <span>{reader.consultationsCount} consultas</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Biography */}
          <div>
            <h4 className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-wider mb-2">
              Sobre a Linha de Atendimento & Dons
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              {reader.bio}
            </p>
          </div>

          {/* Oracles */}
          <div>
            <h4 className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-wider mb-2">
              Oráculos e Instrumentos
            </h4>
            <div className="flex flex-wrap gap-2">
              {reader.oracles.map((oracle, i) => (
                <span 
                  key={i}
                  className="bg-[#141724] border border-[#d4af37]/30 text-[#f3eed9] text-xs px-3 py-1.5 rounded-xl font-medium"
                >
                  ✦ {oracle}
                </span>
              ))}
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-[#141724]/70 border border-[#d4af37]/25 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold font-cinzel text-[#f3eed9]">Consulta 100% Confidencial e Segura</p>
              <p className="text-slate-400 font-light">Nenhuma chamada é gravada e sua identidade permanece em sigilo absoluto.</p>
            </div>
          </div>

          {/* Price & Action */}
          <div className="pt-4 border-t border-[#d4af37]/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400">Tarifa do atendimento:</span>
              <span className="text-lg font-bold font-cinzel text-[#d4af37]">
                R$ {reader.pricePerMinute.toFixed(2).replace('.', ',')} <span className="text-xs text-slate-400 font-normal">/ minuto</span>
              </span>
            </div>

            <button
              onClick={() => { onClose(); onSchedule(reader); }}
              className="w-full mb-3 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-sm shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Agendar minha consulta
            </button>
            <p className="text-[11px] text-slate-500 text-center mb-3">Ou comece agora, se o oraculista estiver online:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => { onClose(); onStartConsultation(reader, 'video'); }}
                disabled={!isAvailable}
                className={`py-3 px-3 rounded-xl font-bold font-cinzel text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAvailable 
                    ? 'bg-[#1b2238] hover:bg-[#252f4d] border border-[#d4af37]/50 text-[#f3eed9] shadow-md active:scale-95' 
                    : 'bg-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Video className="w-4 h-4 text-[#d4af37]" />
                Vídeo Chamada
              </button>

              <button
                onClick={() => { onClose(); onStartConsultation(reader, 'audio'); }}
                disabled={!isAvailable}
                className={`py-3 px-3 rounded-xl font-bold font-cinzel text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAvailable 
                    ? 'bg-[#1b2238] hover:bg-[#252f4d] border border-[#d4af37]/50 text-[#f3eed9] shadow-md active:scale-95' 
                    : 'bg-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Phone className="w-4 h-4 text-[#d4af37]" />
                Ligação de Áudio
              </button>

              <button
                onClick={() => { onClose(); onStartConsultation(reader, 'whatsapp'); }}
                disabled={!isAvailable}
                className={`py-3 px-3 rounded-xl font-bold font-cinzel text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAvailable 
                    ? 'bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/60 text-emerald-300 shadow-md active:scale-95' 
                    : 'bg-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                WhatsApp
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
