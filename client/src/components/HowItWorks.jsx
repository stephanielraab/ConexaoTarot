import React from 'react';
import { 
  UserPlus, 
  Search, 
  Clock, 
  ShieldCheck, 
  Lock, 
  HeartHandshake, 
  Sparkles
} from 'lucide-react';

export default function HowItWorks({ onOpenAuth, onOpenWallet }) {
  return (
    <div id="como-funciona" className="py-20 border-t border-[#d4af37]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold font-cinzel text-[#d4af37] uppercase tracking-widest bg-[#10131f] border border-[#d4af37]/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <span>✦</span> Atendimento Ágil & Descomplicado
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-cinzel text-[#f3eed9] mt-4 mb-3">
            Como Funciona a Consulta no Conexão Tarot?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
            Sem burocracia ou esperas desnecessárias. Conecte-se com tarólogos em 4 etapas rápidas:
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 rounded-2xl p-6 relative flex flex-col justify-between hover:border-[#d4af37]/60 transition-all backdrop-blur-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-cinzel font-bold text-lg mb-4">
                I
              </div>
              <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-2">Cadastre-se Grátis</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Crie sua conta de consulente em menos de 1 minuto com total privacidade e discrição.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#d4af37]/15 text-[11px] text-[#d4af37] font-semibold flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Rápido e 100% sigiloso</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 rounded-2xl p-6 relative flex flex-col justify-between hover:border-[#d4af37]/60 transition-all backdrop-blur-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-cinzel font-bold text-lg mb-4">
                II
              </div>
              <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-2">Adquira Minutos</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Escolha o pacote de créditos desejado. Liberação imediata via PIX automático seguro.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#d4af37]/15 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Seus minutos nunca expiram</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 rounded-2xl p-6 relative flex flex-col justify-between hover:border-[#d4af37]/60 transition-all backdrop-blur-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-cinzel font-bold text-lg mb-4">
                III
              </div>
              <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-2">Escolha o Especialista</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Filtre por Tarô de Marselha, Rider-Waite, Baralho Cigano ou Runas e veja quem está Online.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#d4af37]/15 text-[11px] text-[#d4af37] font-semibold flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Avaliações reais de clientes</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#0b0d14]/90 border border-[#d4af37]/25 rounded-2xl p-6 relative flex flex-col justify-between hover:border-[#d4af37]/60 transition-all backdrop-blur-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-cinzel font-bold text-lg mb-4">
                IV
              </div>
              <h3 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-2">Inicie a Consulta</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Atendimento por Vídeo Chamada, Ligação ou WhatsApp Direto. Cobrança transparente por minuto.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#d4af37]/15 text-[11px] text-[#d4af37] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Respostas claras e acolhedoras</span>
            </div>
          </div>

        </div>

        {/* Security & Confidentiality Highlight */}
        <div id="seguranca" className="mt-16 bg-[#0b0d14]/90 border border-[#d4af37]/30 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-1">Sigilo e Privacidade Absoluta</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Suas perguntas são 100% confidenciais. Chamadas não são gravadas nem arquivadas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-1">Curadoria de Especialistas</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Tarólogos passam por avaliação prática e análise prévia antes de atender no portal oficial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#10131f] border border-[#d4af37]/40 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-cinzel text-[#f3eed9] mb-1">Cobrança Justa por Minuto</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Você controla o tempo e encerra quando desejar. O saldo restante permanece na sua carteira.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
