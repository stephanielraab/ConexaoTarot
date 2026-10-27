import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ 
  initialMode = 'login', 
  onClose, 
  onSuccess,
  onOpenReaderRegister 
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Client form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await api.login(email.trim(), password);
        onSuccess(data.user, data.readerProfile);
        onClose();
      } else {
        const data = await api.register({
          name: name.trim(),
          email: email.trim(),
          password: password,
          role: 'client',
          phone: phone.trim()
        });
        onSuccess(data.user, data.readerProfile);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f111a] border border-[#d4af37]/40 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#262013] border border-[#d4af37]/50 p-0.5 mx-auto mb-3 shadow-lg shadow-[#d4af37]/15 flex items-center justify-center">
            <span className="text-xl">𓂀</span>
          </div>
          <h3 className="text-xl font-bold text-white font-cinzel">
            {mode === 'login' ? 'Acesso ao Portal' : 'Cadastro de Consulente'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' 
              ? 'Conecte-se para realizar consultas e gerenciar seu saldo' 
              : 'Cadastre-se para consultar com oraculistas ao vivo'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#141724] p-1 rounded-2xl border border-[#d4af37]/25 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register' 
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome completo (só no cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-[#141724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-[#141724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">WhatsApp (opcional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11999998888"
                  className="w-full bg-[#141724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold text-xs shadow-lg shadow-[#d4af37]/15 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar no Portal' : 'Criar Conta de Consulente'}
          </button>
        </form>

        {/* Separated Reader Registration Link */}
        <div className="mt-6 pt-5 border-t border-[#d4af37]/20 text-center">
          <p className="text-xs text-slate-400 mb-2">
            Você é tarólogo(a) ou oraculista?
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenReaderRegister) onOpenReaderRegister();
            }}
            className="text-xs font-bold text-[#d4af37] hover:text-[#f3eed9] transition-colors inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
          >
            <span>Candidate-se para atender na Conexão Tarot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
