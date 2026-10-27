import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Phone, 
  Mail, 
  Lock, 
  User, 
  Award, 
  Layers, 
  Clock, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { api } from '../services/api';

const ORACLES_LIST = [
  'Tarô de Marselha',
  'Tarô de Rider Waite',
  'Tarô do Amor',
  'Tarô Mitológico',
  'Baralho Cigano (Lenormand)',
  'Jogo de Búzios',
  'Runas Nórdicas',
  'Astrologia & Mapa Astral'
];

export default function ReaderRegisterPage({ onBack, onSuccess, onOpenLogin }) {
  const [name, setName] = useState('');
  const [spiritualName, setSpiritualName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [pricePerMinute, setPricePerMinute] = useState('3.50');
  const [selectedOracles, setSelectedOracles] = useState(['Tarô de Marselha', 'Tarô de Rider Waite']);
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleOracle = (orc) => {
    if (selectedOracles.includes(orc)) {
      if (selectedOracles.length > 1) {
        setSelectedOracles(selectedOracles.filter(o => o !== orc));
      }
    } else {
      setSelectedOracles([...selectedOracles, orc]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.register({
        name: spiritualName.trim() || name.trim(),
        email: email.trim(),
        password: password,
        role: 'reader',
        phone: phone.trim(),
        bio: bio.trim(),
        pricePerMinute: parseFloat(pricePerMinute),
        experienceYears: parseInt(experienceYears),
        oracles: selectedOracles
      });

      onSuccess(data.user, data.readerProfile);
    } catch (err) {
      setError(err.message || 'Erro ao submeter candidatura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen tarot-cards-bg text-[#e2e8f0] pb-24">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 border-b border-[#d4af37]/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141824] border border-[#d4af37]/25 text-slate-300 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Portal</span>
          </button>

          <span className="text-xs text-slate-400">
            Já possui cadastro como oraculista?{' '}
            <button
              onClick={onOpenLogin}
              className="text-[#d4af37] font-bold hover:underline cursor-pointer"
            >
              Fazer Login
            </button>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest bg-[#262013] border border-[#d4af37]/30 px-3.5 py-1 rounded-full">
            Inscrição Profissional de Oraculistas
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-cinzel mt-4 mb-3">
            Atenda Consulentes no Conexão Tarot
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Seja bem-vindo(a) ao santuário sagrado. Una sua mediunidade e sabedoria oracular a uma plataforma segura com recebimento direto de 80% do valor de cada minuto de consulta.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#262013] border border-[#d4af37]/35 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-[#d4af37]" />
            </div>
            <h4 className="text-sm font-bold text-white font-cinzel mb-1">Repasse Justo de 80%</h4>
            <p className="text-xs text-slate-400">Você recebe 80% líquido dos minutos consumidos, com transferência rápida via PIX.</p>
          </div>

          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#1b2236] border border-[#d4af37]/35 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-[#d4af37]" />
            </div>
            <h4 className="text-sm font-bold text-white font-cinzel mb-1">Tecnologia Oracular</h4>
            <p className="text-xs text-slate-400">Vídeo chamadas, ligações de voz e mesa virtual interativa de tarô ao vivo com o cliente.</p>
          </div>

          <div className="bg-[#0f121d] border border-[#d4af37]/20 rounded-2xl p-4.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#142820] border border-emerald-500/35 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white font-cinzel mb-1">Horário 100% Livre</h4>
            <p className="text-xs text-slate-400">Basta ativar o botão Disponível no seu painel para receber chamadas quando quiser.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#0f121d] border border-[#d4af37]/35 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
          
          <div className="mb-6 pb-4 border-b border-[#d4af37]/20">
            <h3 className="text-xl font-bold text-white font-cinzel">
              Ficha de Candidatura do Especialista
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Preencha com exatidão para a análise da nossa equipe de curadoria
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Nomes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome Completo (Documental)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome civil"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome Profissional / Espiritual (Como aparecerá para os consulentes)
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spiritualName}
                    onChange={(e) => setSpiritualName(e.target.value)}
                    placeholder="Ex: Mestre Thoth Siqueira, Yara do Oriente"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: E-mail, Senha e WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="oraculista@email.com"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  WhatsApp Oficial (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11999998888"
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Anos de Experiência e Tarifa Desejada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tempo de Prática / Experiência com Oráculos
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="2">2 anos de atuação</option>
                    <option value="4">3 a 5 anos de atuação</option>
                    <option value="8">6 a 10 anos de atuação</option>
                    <option value="15">Mais de 10 anos de sacerdócio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tarifa por Minuto Sugerida (R$)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.10"
                    min="1.50"
                    max="15.00"
                    required
                    value={pricePerMinute}
                    onChange={(e) => setPricePerMinute(e.target.value)}
                    className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Você receberá 80% deste valor por cada minuto atendido.
                </span>
              </div>
            </div>

            {/* Oráculos que domina */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Selecione os oráculos e linhas que você atende:
              </label>
              <div className="flex flex-wrap gap-2">
                {ORACLES_LIST.map((orc) => {
                  const active = selectedOracles.includes(orc);
                  return (
                    <button
                      type="button"
                      key={orc}
                      onClick={() => toggleOracle(orc)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        active 
                          ? 'bg-[#d4af37] text-slate-950 font-bold shadow-md shadow-[#d4af37]/20 ring-1 ring-[#d4af37]' 
                          : 'bg-[#131724] border border-[#d4af37]/25 text-slate-300 hover:text-white'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{orc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio e Filosofia */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Carta de Apresentação & Biografia Oracular
              </label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte sobre sua trajetória espiritual, seus estudos, como você acolhe os consulentes e quais direcionamentos você oferece..."
                className="w-full bg-[#131724] border border-[#d4af37]/30 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            {/* Termos de Curadoria */}
            <div className="bg-[#121624] border border-[#d4af37]/25 rounded-2xl p-4.5 flex items-start gap-3.5">
              <ShieldCheck className="w-6 h-6 text-[#d4af37] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-slate-300">
                <p className="font-bold text-white font-cinzel">Processo Sagrado de Curadoria</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Ao submeter sua inscrição, você concorda que o cadastro passará por análise prévia e uma breve validação via WhatsApp. Assim que aprovado pelo Administrador, seu perfil entrará no ar e você receberá 80% do valor de todas as consultas realizadas.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e5c368] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold text-sm shadow-xl shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Submetendo Candidatura...' : 'Enviar Inscrição para Análise da Curadoria'}</span>
            </button>

          </form>

        </div>

      </main>

    </div>
  );
}
