import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  CalendarDays,
  Clock,
  Video,
  MessageSquare,
  Upload,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import {
  TYPE_LABEL,
  STATUS_LABEL,
  formatDateTime,
  formatPhone,
  maskPhone,
  whatsappLink,
  stripCountry,
  money
} from '../utils/contact';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
];

const ROLE_LABEL = { admin: 'Gestão', reader: 'Tarólogo(a)', client: 'Consulente' };

const STATUS_STYLE = {
  pending: 'bg-amber-950 text-amber-300 border-amber-500/60',
  confirmed: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
  declined: 'bg-rose-950 text-rose-300 border-rose-500/60',
  cancelled: 'bg-slate-900 text-slate-400 border-slate-700',
  completed: 'bg-[#1b2238] text-[#d4af37] border-[#d4af37]/50'
};

// Recorta no centro e reduz a foto para 400x400 (JPEG) antes de enviar
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      reject(new Error('Use uma imagem PNG, JPG ou WEBP.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas
          .getContext('2d')
          .drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 400, 400);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage({
  user,
  readers = [],
  initialTab = 'data',
  onBack,
  onUserUpdated,
  onStartConsultation
}) {
  const [tab, setTab] = useState(initialTab);
  const hasAppointments = user.role !== 'admin';

  // ----- Dados -----
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(maskPhone(user.phone || ''));
  const [avatar, setAvatar] = useState(user.avatar || PRESET_AVATARS[0]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  const emailChanged = email.trim().toLowerCase() !== (user.email || '').toLowerCase();
  const needsCurrentPassword = emailChanged || password.length > 0;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setError('');
      setAvatar(await fileToAvatar(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) return setError('Informe seu nome.');
    if (!email.trim()) return setError('Informe seu e-mail.');
    const digits = stripCountry(phone);
    if (digits && digits.length < 10) return setError('Telefone incompleto. Informe DDD + número.');
    if (user.role === 'reader' && !digits) return setError('Oraculistas precisam manter um WhatsApp cadastrado.');
    if (password) {
      if (password.length < 6) return setError('A nova senha deve ter no mínimo 6 caracteres.');
      if (password !== confirmPassword) return setError('A confirmação da nova senha não confere.');
    }
    if (needsCurrentPassword && !currentPassword) {
      return setError('Informe sua senha atual para alterar o e-mail ou a senha.');
    }

    setSaving(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), phone: digits, avatar };
      if (password) payload.password = password;
      if (needsCurrentPassword) payload.currentPassword = currentPassword;

      const res = await api.updateUser(user.id, payload);
      onUserUpdated(res.user, res.readerProfile);
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Dados atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ----- Agendamentos -----
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptError, setApptError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadAppointments = async () => {
    try {
      setLoadingAppts(true);
      setAppointments(await api.getAppointments(user.id));
      setApptError('');
    } catch (err) {
      setApptError(err.message);
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    if (tab === 'appointments' && hasAppointments) loadAppointments();
  }, [tab]);

  const act = async (appt, action) => {
    if (action === 'cancel' && !window.confirm('Deseja cancelar este agendamento?')) return;
    setBusyId(appt.id);
    try {
      const updated = await api.updateAppointment(appt.id, user.id, action);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const isActive = (a) => ['pending', 'confirmed'].includes(a.status) && new Date(a.scheduledAt).getTime() + a.durationMinutes * 60000 > now;
  const upcoming = appointments.filter(isActive);
  const past = appointments.filter((a) => !isActive(a)).reverse();
  const pendingForReader = user.role === 'reader' ? upcoming.filter((a) => a.status === 'pending').length : 0;

  const renderAppointment = (a) => {
    const when = formatDateTime(a.scheduledAt);
    const isReaderView = user.role === 'reader';
    const startMs = new Date(a.scheduledAt).getTime();
    // Cliente pode iniciar de 10 min antes até o fim da janela
    const canStart =
      !isReaderView &&
      a.status === 'confirmed' &&
      now >= startMs - 10 * 60000 &&
      now <= startMs + a.durationMinutes * 60000;
    const reader = readers.find((r) => r.id === a.readerId);
    const contactPhone = isReaderView ? a.clientPhone : a.readerWhatsapp;
    const contactName = isReaderView ? a.clientName : a.readerName;
    const waText = `Olá ${contactName}! Sobre nossa consulta de ${TYPE_LABEL[a.type].toLowerCase()} agendada na Conexão Tarot para ${when.full}.`;

    return (
      <div key={a.id} className="bg-[#0e101b] border border-[#d4af37]/25 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!isReaderView && (
              <img src={a.readerAvatar} alt={a.readerName} className="w-12 h-12 rounded-xl object-cover border border-[#d4af37]/40 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold font-cinzel text-[#f3eed9] truncate">
                {isReaderView ? a.clientName : a.readerName}
              </p>
              <p className="text-xs text-[#d4af37] flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {when.full} · {a.durationMinutes} min
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {TYPE_LABEL[a.type]} · estimado {money(a.pricePerMinute * a.durationMinutes)}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[a.status]}`}>
            {STATUS_LABEL[a.status]}
          </span>
        </div>

        {a.notes && (
          <p className="text-xs text-slate-300/90 bg-[#10131f] rounded-xl px-3 py-2 mt-3 font-light">“{a.notes}”</p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {isReaderView && a.status === 'pending' && (
            <>
              <button
                disabled={busyId === a.id}
                onClick={() => act(a, 'confirm')}
                className="px-3.5 py-2 rounded-xl bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold hover:bg-emerald-800 cursor-pointer transition-colors"
              >
                Confirmar
              </button>
              <button
                disabled={busyId === a.id}
                onClick={() => act(a, 'decline')}
                className="px-3.5 py-2 rounded-xl bg-[#10131f] border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-950/50 cursor-pointer transition-colors"
              >
                Recusar
              </button>
            </>
          )}

          {canStart && reader && (
            <button
              onClick={() => onStartConsultation(reader, a.type, a.id)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 text-xs font-bold font-cinzel flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              Iniciar atendimento agora
            </button>
          )}

          {a.status === 'confirmed' && contactPhone && (
            <a
              href={whatsappLink(contactPhone, waText)}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-900/90 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Falar no WhatsApp
            </a>
          )}

          {['pending', 'confirmed'].includes(a.status) && (
            <button
              disabled={busyId === a.id}
              onClick={() => act(a, 'cancel')}
              className="px-3.5 py-2 rounded-xl bg-[#10131f] border border-slate-700 text-slate-400 text-xs font-semibold hover:text-rose-300 hover:border-rose-500/50 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {a.status === 'pending' && !isReaderView && (
          <p className="text-[11px] text-slate-500 mt-3">
            O contato por WhatsApp é liberado assim que o oraculista confirmar.
          </p>
        )}
      </div>
    );
  };

  const inputCls =
    'w-full bg-[#10131f] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]';

  return (
    <div className="min-h-screen tarot-cards-bg text-[#e2e8f0] pb-24">
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 border-b border-[#d4af37]/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold block">Meu Perfil</span>
            <h1 className="text-base font-bold text-white font-cinzel leading-none">{user.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Cartão lateral — contatos clicáveis */}
        <aside className="bg-[#0e101b] border border-[#d4af37]/25 rounded-3xl p-6 h-fit text-center">
          <img
            src={avatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#d4af37] p-0.5 bg-[#10131f] mx-auto shadow-xl"
          />
          <h2 className="text-base font-bold font-cinzel text-[#f3eed9] mt-3">{user.name}</h2>
          <span className="inline-block text-[10px] font-semibold text-[#d4af37] bg-[#241e12] border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full mt-1">
            {ROLE_LABEL[user.role]}
          </span>
          <div className="mt-5 space-y-2 text-left text-xs">
            <a
              href={`mailto:${user.email}`}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#10131f] border border-[#d4af37]/15 hover:border-[#d4af37]/60 text-slate-200 transition-colors break-all"
            >
              <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
              {user.email}
            </a>
            {user.phone && (
              <a
                href={whatsappLink(user.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#10131f] border border-[#d4af37]/15 hover:border-emerald-500/60 text-slate-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                {formatPhone(user.phone)}
              </a>
            )}
          </div>
        </aside>

        {/* Conteúdo com abas */}
        <section>
          <div className="flex gap-2 mb-5 border-b border-[#d4af37]/15">
            <button
              onClick={() => setTab('data')}
              className={`px-4 py-2.5 text-xs font-bold font-cinzel border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === 'data' ? 'border-[#d4af37] text-[#f3eed9]' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Meus dados
              </span>
            </button>
            {hasAppointments && (
              <button
                onClick={() => setTab('appointments')}
                className={`px-4 py-2.5 text-xs font-bold font-cinzel border-b-2 -mb-px transition-colors cursor-pointer ${
                  tab === 'appointments' ? 'border-[#d4af37] text-[#f3eed9]' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Agendamentos
                  {pendingForReader > 0 && (
                    <span className="bg-[#d4af37] text-slate-950 rounded-full px-1.5 text-[10px]">{pendingForReader}</span>
                  )}
                </span>
              </button>
            )}
          </div>

          {tab === 'data' && (
            <form onSubmit={handleSave} className="bg-[#0b0d14] border border-[#d4af37]/25 rounded-3xl p-6 sm:p-8 space-y-5">
              {error && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{error}</div>}
              {success && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {success}
                </div>
              )}

              {/* Foto */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-[#d4af37]/15">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative group shrink-0 cursor-pointer"
                  title="Trocar foto"
                >
                  <img src={avatar} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-[#d4af37] p-0.5 bg-[#10131f]" />
                  <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
                <div className="flex-1 w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-[#1b2238] border border-[#d4af37]/40 text-[#f3eed9] text-xs font-bold flex items-center gap-1.5 hover:bg-[#252f4d] cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    Enviar foto do aparelho
                  </button>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    <span className="text-[10px] text-slate-400 font-cinzel shrink-0">Ou escolha:</span>
                    {PRESET_AVATARS.map((pic) => (
                      <button
                        key={pic}
                        type="button"
                        onClick={() => setAvatar(pic)}
                        className={`w-8 h-8 rounded-full overflow-hidden border shrink-0 transition-all cursor-pointer ${
                          avatar === pic ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 scale-110' : 'border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={pic} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Nome completo / exibição</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">E-mail de acesso</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  {user.role === 'reader' ? 'WhatsApp / celular (exibido no atendimento por WhatsApp)' : 'Telefone / WhatsApp com DDD'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#d4af37]/15 space-y-3">
                <div>
                  <span className="text-xs font-cinzel font-bold text-[#d4af37] block">Alterar senha (opcional)</span>
                  <p className="text-[11px] text-slate-400 font-light">Deixe em branco para manter a senha atual.</p>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    autoComplete="new-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Mostrar ou ocultar senha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>
                )}

                {needsCurrentPassword && (
                  <div className="p-3 rounded-xl bg-[#241e12]/60 border border-[#d4af37]/30 space-y-2">
                    <p className="text-[11px] text-[#f3eed9]">
                      Por segurança, confirme sua <strong>senha atual</strong> para alterar o e-mail ou a senha.
                    </p>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Senha atual"
                        autoComplete="current-password"
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          )}

          {tab === 'appointments' && (
            <div className="space-y-6">
              {apptError && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">{apptError}</div>}

              {loadingAppts ? (
                <p className="text-xs text-[#d4af37] font-cinzel flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> Carregando agenda...
                </p>
              ) : (
                <>
                  <div>
                    <h3 className="text-xs font-cinzel font-bold text-[#d4af37] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Próximas consultas
                    </h3>
                    {upcoming.length === 0 ? (
                      <div className="bg-[#0e101b] border border-[#d4af37]/20 rounded-2xl p-6 text-center">
                        <p className="text-xs text-slate-400 mb-3">
                          {user.role === 'reader'
                            ? 'Nenhum agendamento por enquanto. Quando um cliente marcar horário com você, ele aparece aqui.'
                            : 'Você ainda não tem consultas agendadas.'}
                        </p>
                        {user.role === 'client' && (
                          <button
                            onClick={onBack}
                            className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8420] rounded-xl text-xs font-bold text-slate-950 font-cinzel cursor-pointer"
                          >
                            Escolher um oraculista
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">{upcoming.map(renderAppointment)}</div>
                    )}
                  </div>

                  {past.length > 0 && (
                    <div>
                      <h3 className="text-xs font-cinzel font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico</h3>
                      <div className="space-y-3 opacity-80">{past.map(renderAppointment)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
