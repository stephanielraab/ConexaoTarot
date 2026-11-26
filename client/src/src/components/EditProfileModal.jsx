import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80'
];

export default function EditProfileModal({ 
  user, 
  onClose, 
  onUserUpdated 
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || PRESET_AVATARS[0]);
  
  // Senha
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('A confirmação da nova senha não confere.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar.trim()
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await api.updateUser(user.id, payload);
      setSuccessMsg('Cadastro atualizado com sucesso!');
      
      if (onUserUpdated) {
        onUserUpdated(res.user, res.readerProfile);
      }

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-[#d4af37]/40 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10131f] border border-[#d4af37]/40 text-[#d4af37] text-xs font-cinzel font-semibold mb-2">
            <span>✦</span>
            <span>Editar Cadastro & Acesso</span>
          </div>
          <h3 className="text-xl font-bold font-cinzel text-[#f3eed9]">
            {user?.role === 'admin' ? 'Perfil do Administrador' : 'Perfil do Oraculista'}
          </h3>
          <p className="text-xs text-slate-400 font-light mt-1">
            Altere seu nome, foto de perfil, e-mail, telefone e senha de acesso.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 pb-3 border-b border-[#d4af37]/15">
            <div className="relative group">
              <img 
                src={avatar || PRESET_AVATARS[0]} 
                alt="Avatar Preview" 
                className="w-20 h-20 rounded-full object-cover border-2 border-[#d4af37] shadow-xl p-0.5 bg-[#10131f]"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-[11px] text-slate-400 mb-1 text-center">
                URL da Foto de Perfil:
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Presets Gallery */}
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block mb-1 text-center font-cinzel">
                Ou selecione uma foto pronta:
              </span>
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {PRESET_AVATARS.map((pic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(pic)}
                    className={`w-8 h-8 rounded-full overflow-hidden border transition-all cursor-pointer ${
                      avatar === pic ? 'border-[#d4af37] scale-110 shadow-md ring-2 ring-[#d4af37]/40' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={pic} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Nome Completo / Exibição:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              E-mail de Acesso:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              WhatsApp / Celular com DDD:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-2 border-t border-[#d4af37]/15">
            <span className="text-xs font-cinzel font-bold text-[#d4af37] block mb-2">
              Alterar Senha de Acesso (Opcional)
            </span>
            <p className="text-[11px] text-slate-400 font-light mb-3">
              Deixe os campos abaixo em branco caso deseje manter a senha atual.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nova Senha:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {password && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Confirmar Nova Senha:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#10131f] border border-[#d4af37]/30 text-slate-300 hover:bg-[#181d30] text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
