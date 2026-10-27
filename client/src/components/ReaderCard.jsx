import React from 'react';
import { 
  Star, 
  Video, 
  Phone, 
  MessageSquare, 
  Award,
  Info,
  CalendarDays
} from 'lucide-react';

export default function ReaderCard({ 
  reader, 
  onSelectReader, 
  onStartConsultation,
  onSchedule
}) {
  const isAvailable = reader.status === 'available';
  const isBusy = reader.status === 'busy';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectReader(reader)}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onSelectReader(reader); }}
      aria-label={`Ver perfil e agendar com ${reader.name}`}
      className="bg-[#0e101b] border border-[#d4af37]/25 hover:border-[#d4af37]/70 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#d4af37]/10 flex flex-col justify-between relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
    >
      
      {/* Top Section */}
      <div>
        <div className="flex gap-4 items-start">
          
          {/* Avatar with Status indicator */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#d4af37] via-[#947625] to-[#141724] shadow-md">
              <img 
                src={reader.avatar} 
                alt={reader.name} 
                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Status Beacon badge */}
            <span 
              className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-md ${
                isAvailable 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80 beacon-pulse' 
                  : isBusy 
                  ? 'bg-amber-950 text-amber-300 border-amber-500/80' 
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : isBusy ? 'bg-amber-400' : 'bg-slate-500'}`} />
              {isAvailable ? 'Online' : isBusy ? 'Ocupado' : 'Offline'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 
                onClick={() => onSelectReader(reader)}
                className="text-base font-bold font-cinzel text-[#f3eed9] hover:text-[#d4af37] transition-colors truncate cursor-pointer"
              >
                {reader.name}
              </h3>
              <button 
                onClick={(e) => { e.stopPropagation(); onSelectReader(reader); }}
                className="text-slate-400 hover:text-[#d4af37] p-1 rounded-lg transition-colors cursor-pointer"
                title="Ver perfil completo"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#d4af37]/80 font-medium line-clamp-1 mb-2">
              {reader.title}
            </p>

            {/* Rating and stats */}
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1 text-[#d4af37] font-bold">
                <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                <span>{reader.rating.toFixed(2)}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="text-slate-400 text-[11px]">
                {reader.consultationsCount} consultas
              </div>
            </div>

            {/* Experience badge */}
            {reader.experienceYears && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-[#d4af37]/90 font-cinzel">
                <Award className="w-3 h-3 text-[#d4af37]" />
                <span>{reader.experienceYears} anos de vivência</span>
              </div>
            )}
          </div>
        </div>

        {/* Short Bio */}
        <p className="text-xs text-slate-300/80 mt-4 line-clamp-2 leading-relaxed font-light">
          {reader.bio}
        </p>

        {/* Oracle Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {reader.oracles.slice(0, 3).map((orc, i) => (
            <span 
              key={i} 
              className="text-[10px] font-medium bg-[#141724] border border-[#d4af37]/25 text-[#f3eed9] px-2 py-0.5 rounded-md"
            >
              {orc}
            </span>
          ))}
          {reader.oracles.length > 3 && (
            <span className="text-[10px] text-slate-400 px-1 py-0.5">
              +{reader.oracles.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Price & Call Actions */}
      <div className="mt-5 pt-4 border-t border-[#d4af37]/15">
        
        {/* Price row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">Tarifa do oráculo:</span>
          <div className="text-right">
            <span className="text-sm font-bold font-cinzel text-[#d4af37]">
              R$ {reader.pricePerMinute.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium"> / min</span>
          </div>
        </div>

        {/* Action Buttons for Video, Audio, WhatsApp */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* Video Call Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onStartConsultation(reader, 'video'); }}
            disabled={!isAvailable}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAvailable
                ? 'bg-[#1b2238] hover:bg-[#252f4d] border border-[#d4af37]/40 text-[#f3eed9] shadow-md active:scale-95'
                : 'bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title={isAvailable ? "Iniciar Vídeo Chamada" : "Oraculista indisponível"}
          >
            <Video className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[11px] font-cinzel">Vídeo</span>
          </button>

          {/* Audio Call Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onStartConsultation(reader, 'audio'); }}
            disabled={!isAvailable}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAvailable
                ? 'bg-[#1b2238] hover:bg-[#252f4d] border border-[#d4af37]/40 text-[#f3eed9] shadow-md active:scale-95'
                : 'bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title={isAvailable ? "Iniciar Ligação de Áudio" : "Oraculista indisponível"}
          >
            <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[11px] font-cinzel">Ligação</span>
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onStartConsultation(reader, 'whatsapp'); }}
            disabled={!isAvailable}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAvailable
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 shadow-md active:scale-95'
                : 'bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title={isAvailable ? "Atendimento por WhatsApp" : "Oraculista indisponível"}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-cinzel">WhatsApp</span>
          </button>

        </div>

        {/* Agendar: sempre disponível, mesmo com o oraculista offline/ocupado */}
        <button
          onClick={(e) => { e.stopPropagation(); onSchedule(reader); }}
          className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CalendarDays className="w-4 h-4" />
          Agendar consulta
        </button>

      </div>

    </div>
  );
}
