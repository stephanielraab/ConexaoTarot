import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function Footer({ onOpenAdmin }) {
  return (
    <footer className="bg-[#06070b] border-t border-[#d4af37]/20 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 rounded-lg bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center">
                <span className="text-xs text-[#d4af37]">✦</span>
              </div>
              <span className="text-lg font-bold font-cinzel text-[#f3eed9] tracking-wider">
                Conexão Tarot
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              O portal mais transparente e intuitivo para suas consultas de Tarô, Baralho Cigano e Oráculos no Brasil.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente 100% Seguro e Criptografado</span>
            </div>
          </div>

          {/* Oráculos */}
          <div>
            <h4 className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-wider mb-3">
              Oráculos & Cartas
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Tarô de Marselha</a></li>
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Tarô Rider-Waite</a></li>
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Tarô do Amor & Relações</a></li>
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Baralho Cigano (Lenormand)</a></li>
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Jogo de Búzios</a></li>
              <li><a href="#oraculistas" className="hover:text-[#d4af37] transition-colors">Runas Nórdicas</a></li>
            </ul>
          </div>

          {/* Atendimento & Suporte */}
          <div>
            <h4 className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-wider mb-3">
              Canais de Consulta
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-[#f3eed9] font-medium">📹 Vídeo Chamada:</span> Tiragem de cartas ao vivo na mesa virtual</li>
              <li><span className="text-[#f3eed9] font-medium">📞 Ligação de Áudio:</span> Conversa sigilosa por voz no navegador</li>
              <li><span className="text-emerald-400 font-medium">💬 WhatsApp Oficial:</span> Atendimento flexível pelo mensageiro</li>
              <li><span className="text-[#d4af37] font-medium">⚡ PIX Automático:</span> Minutos liberados imediatamente</li>
            </ul>
          </div>

          {/* Disclaimer & Termos */}
          <div>
            <h4 className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-wider mb-3">
              Ética & Orientação
            </h4>
            <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-3">
              As leituras oraculares destinam-se ao autoconhecimento, reflexão e entretenimento espiritual. Não substituem diagnósticos médicos, tratamentos psicológicos ou consultorias jurídicas.
            </p>
            <p className="text-[10px] text-slate-500 font-cinzel">
              Proibido para menores de 18 anos.
            </p>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#d4af37]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} Conexão Tarot Brasil. Todos os direitos reservados.
            {/* Discreet hidden admin entry point */}
            <button
              onClick={onOpenAdmin}
              className="ml-2 text-slate-800 hover:text-[#d4af37]/50 transition-colors cursor-pointer text-[10px]"
              title="Acesso Reservado"
            >
              ✦
            </button>
          </p>
          <p className="flex items-center gap-1">
            Iluminando caminhos com sabedoria e acolhimento
          </p>
        </div>

      </div>
    </footer>
  );
}
