import React from 'react';
import { 
  Sparkles, 
  Wallet, 
  LogOut, 
  Flame,
  LayoutDashboard,
  Compass,
  Layers
} from 'lucide-react';

export default function Navbar({ 
  user, 
  readerProfile, 
  onOpenAuth, 
  onLogout, 
  onOpenWallet, 
  onOpenReaderDashboard,
  onOpenAdmin,
  onOpenReaderRegister,
  onOpenDailyCard,
  onOpenProfile
}) {
  return (
    <header className="sticky top-0 z-40 bg-[#08090e]/95 backdrop-blur-md border-b border-[#d4af37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Minimalista de Tarô */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {/* Ícone de Carta de Tarô Minimalista */}
          <div className="w-10 h-12 rounded-lg bg-[#10131f] border border-[#d4af37]/40 p-1 shadow-md flex flex-col items-center justify-center group-hover:border-[#d4af37] transition-all relative overflow-hidden">
            <div className="w-full h-full border border-[#d4af37]/25 rounded flex items-center justify-center">
              <span className="text-xs text-[#d4af37] font-serif">✦</span>
            </div>
          </div>

          <div>
            <span className="text-xl font-bold font-cinzel tracking-wider text-[#f3eed9] block group-hover:text-[#d4af37] transition-colors">
              Conexão Tarot
            </span>
            <span className="text-[9px] text-[#d4af37]/80 tracking-widest uppercase font-semibold">
              Tarô Online & Orientação Espiritual
            </span>
          </div>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <a href="#oraculistas" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            Tarólogos & Oraculistas
          </a>
          
          <button 
            onClick={onOpenDailyCard}
            className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5 text-[#f3eed9] cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-[#d4af37] animate-pulse" />
            Carta do Dia
          </button>

          <a href="#como-funciona" className="hover:text-[#d4af37] transition-colors">
            Como Funciona
          </a>

          <button 
            onClick={onOpenReaderRegister}
            className="hover:text-[#d4af37] transition-colors text-slate-400 cursor-pointer"
          >
            Seja um Tarólogo
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              
              {/* Se for cliente: Mostra saldo e botão de recarga */}
              {user.role === 'client' && (
                <div className="flex items-center gap-2.5 bg-[#10131f] border border-[#d4af37]/30 px-3.5 py-1.5 rounded-xl shadow-inner">
                  <Wallet className="w-4 h-4 text-[#d4af37]" />
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 leading-none">Saldo</p>
                    <p className="text-sm font-bold text-[#f3eed9] font-cinzel">
                      R$ {Number(user.balance || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <button 
                    onClick={onOpenWallet}
                    className="ml-1 bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    + Créditos
                  </button>
                </div>
              )}

              {/* Se for oraculista: Botão de acesso à Página Completa do Oraculista */}
              {user.role === 'reader' && (
                <button
                  onClick={onOpenReaderDashboard}
                  className="flex items-center gap-2 bg-[#141829] hover:bg-[#1c223a] border border-[#d4af37]/40 text-[#f3eed9] text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#d4af37]" />
                  <span>Painel do Oraculista</span>
                </button>
              )}

              {/* Se for admin: Botão discreto para a Página Completa de Gestão */}
              {user.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-2 bg-[#141829] hover:bg-[#1c223a] border border-[#d4af37]/40 text-[#f3eed9] text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Compass className="w-4 h-4 text-[#d4af37]" />
                  <span>Gestão Central</span>
                </button>
              )}

              {/* Usuário info & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={onOpenProfile}
                  title="Meu perfil"
                  className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-[#141829] transition-colors cursor-pointer text-left"
                >
                <img 
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-[#d4af37]/40 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-tight max-w-[120px] truncate">{user.name}</p>
                  <p className="text-[10px] text-[#d4af37] capitalize leading-tight">
                    {user.role === 'admin' ? 'Gestão' : user.role === 'reader' ? 'Tarólogo' : 'Consulente'}
                  </p>
                </div>
                </button>
                <button 
                  onClick={onLogout}
                  title="Sair"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAuth('login')}
                className="text-slate-300 hover:text-[#d4af37] text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button 
                onClick={() => onOpenAuth('register')}
                className="bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-[#d4af37]/15 transition-all active:scale-95 cursor-pointer"
              >
                Cadastre-se
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
