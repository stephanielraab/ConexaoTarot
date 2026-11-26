import React from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';

const ORACLES = [
  'Todos',
  'Tarô de Marselha',
  'Tarô Rider-Waite',
  'Tarô do Amor',
  'Baralho Cigano (Lenormand)',
  'Tarô Mitológico',
  'Runas',
  'Búzios',
  'Astrologia'
];

export default function FilterBar({ 
  search, 
  onSearchChange, 
  selectedOracle, 
  onOracleChange,
  onlyAvailable,
  onOnlyAvailableChange,
  sortBy,
  onSortChange
}) {
  return (
    <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por tarólogo, oráculo ou especialidade..."
            className="w-full bg-[#08090e] border border-[#d4af37]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>

        {/* Status and Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Toggle only available */}
          <button
            onClick={() => onOnlyAvailableChange(!onlyAvailable)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              onlyAvailable
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-[#08090e] border border-[#d4af37]/25 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlyAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Disponíveis Agora</span>
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-2 bg-[#08090e] border border-[#d4af37]/25 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-slate-400 text-xs">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-[#08090e]">Destaques</option>
              <option value="rating" className="bg-[#08090e]">Melhor Avaliação</option>
              <option value="price_asc" className="bg-[#08090e]">Menor Preço/min</option>
              <option value="price_desc" className="bg-[#08090e]">Maior Preço/min</option>
              <option value="consultations" className="bg-[#08090e]">Mais Consultas</option>
            </select>
          </div>

        </div>

      </div>

      {/* Oracle Pills Horizontal Slider */}
      <div className="mt-4 pt-4 border-t border-[#d4af37]/15 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-[#d4af37] font-cinzel font-semibold shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Oráculos:
        </span>
        {ORACLES.map((oracle) => {
          const isSelected = (oracle === 'Todos' && !selectedOracle) || selectedOracle === oracle;
          return (
            <button
              key={oracle}
              onClick={() => onOracleChange(oracle === 'Todos' ? '' : oracle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 font-bold shadow-md shadow-[#d4af37]/15'
                  : 'bg-[#08090e] border border-[#d4af37]/20 text-slate-300 hover:border-[#d4af37]/50 hover:text-white'
              }`}
            >
              {oracle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
