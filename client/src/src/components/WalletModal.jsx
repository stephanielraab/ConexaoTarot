import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  History,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function WalletModal({ 
  user, 
  onClose, 
  onBalanceUpdated 
}) {
  const [tab, setTab] = useState('recharge'); // 'recharge' | 'history'
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  
  // PIX Checkout State
  const [showPix, setShowPix] = useState(false);
  const [pixPayload, setPixPayload] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Transactions
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadPackages();
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      const pkgs = await api.getPackages();
      setPackages(pkgs);
      if (pkgs.length > 1) {
        setSelectedPackage(pkgs[1]); // Seleciona o 'Mais Popular'
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const txs = await api.getTransactions(user.id);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setCustomAmount('');
  };

  const handleGeneratePix = () => {
    let amount = 0;
    let bonus = 0;
    let title = '';

    if (customAmount && parseFloat(customAmount) > 0) {
      amount = parseFloat(customAmount);
      bonus = 0;
      title = `Recarga Avulsa R$ ${amount.toFixed(2)}`;
    } else if (selectedPackage) {
      amount = selectedPackage.price;
      bonus = selectedPackage.bonus || 0;
      title = selectedPackage.title;
    } else {
      alert('Selecione um pacote ou digite um valor.');
      return;
    }

    const pixCode = `00020126580014br.gov.bcb.pix0136conexaotarot-pagamentos@banco.com.br520400005303986540${amount.toFixed(2)}5802BR5920CONEXAO TAROT BRASIL6009SAO PAULO62070503***6304E64A`;

    setPixPayload({
      amount,
      bonus,
      title,
      pixCode
    });
    setShowPix(true);
  };

  const handleCopyCode = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimulatePaymentApproval = async () => {
    if (!pixPayload) return;
    setLoading(true);
    try {
      const res = await api.rechargeBalance(user.id, pixPayload.amount, pixPayload.bonus);
      onBalanceUpdated(res.user);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowPix(false);
      setPixPayload(null);
      loadTransactions();
      alert(`🎉 Recarga de R$ ${(pixPayload.amount + pixPayload.bonus).toFixed(2)} aprovada com sucesso! Seus minutos já estão disponíveis.`);
    } catch (err) {
      alert(err.message || 'Erro ao creditar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e101b] border border-[#d4af37]/40 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141724] border border-[#d4af37]/40 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-cinzel text-[#f3eed9]">Carteira & Minutos de Consulta</h3>
              <p className="text-xs text-slate-400 font-light">Recarregue e utilize imediatamente com qualquer oraculista</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="px-6 pt-5 shrink-0">
          <div className="bg-[#141724] border border-[#d4af37]/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-slate-400">Saldo Atual Disponível</span>
              <p className="text-2xl font-bold font-cinzel text-[#d4af37]">
                R$ {Number(user?.balance || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Tempo estimado</span>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end font-cinzel">
                <Clock className="w-4 h-4" />
                ~{Math.floor(Number(user?.balance || 0) / 3.3)} min de atendimento
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-[#d4af37]/15 pb-2">
            <button
              onClick={() => { setTab('recharge'); setShowPix(false); }}
              className={`text-xs font-bold font-cinzel px-4 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'recharge' 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-[#d4af37]'
              }`}
            >
              Comprar Minutos (PIX)
            </button>
            <button
              onClick={() => { setTab('history'); setShowPix(false); }}
              className={`text-xs font-bold font-cinzel px-4 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'history' 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-[#d4af37]'
              }`}
            >
              Extrato & Histórico
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {tab === 'recharge' && !showPix && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-medium">
                Escolha um dos pacotes sagrados com bônus inclusos:
              </p>

              {/* Grid de Pacotes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#141724] border-[#d4af37] shadow-xl ring-1 ring-[#d4af37]'
                          : 'bg-[#090a10] border-[#d4af37]/25 hover:border-[#d4af37]/60'
                      }`}
                    >
                      {pkg.tag && (
                        <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#d4af37] to-[#aa8420] text-slate-950 text-[10px] font-bold font-cinzel px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                          {pkg.tag}
                        </span>
                      )}

                      <div>
                        <h4 className="text-xs font-bold font-cinzel text-[#f3eed9] mb-1">{pkg.title}</h4>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-xl font-bold font-cinzel text-[#d4af37]">
                            R$ {pkg.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-light">
                          Aprox. <strong className="text-[#f3eed9] font-medium">{pkg.minutesEst} min</strong> de atendimento
                        </p>
                      </div>

                      {pkg.bonus > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#d4af37]/20 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+ R$ {pkg.bonus.toFixed(2)} bônus de cortesia</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Valor Avulso */}
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Ou digite outro valor desejado (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPackage(null);
                    }}
                    placeholder="Ex: 50,00"
                    className="w-full bg-[#090a10] border border-[#d4af37]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Security info */}
              <div className="bg-[#141724]/70 border border-[#d4af37]/25 rounded-xl p-3 flex items-center gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Liberação instantânea dos minutos via PIX com ativação em menos de 10 segundos.</span>
              </div>

              {/* CTA Gerar PIX */}
              <button
                onClick={handleGeneratePix}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8420] hover:from-[#e5c368] hover:to-[#c59b27] text-slate-950 font-bold font-cinzel text-xs uppercase tracking-wider shadow-xl shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                Continuar para Pagamento PIX
              </button>
            </div>
          )}

          {/* TELA DE PAGAMENTO PIX */}
          {tab === 'recharge' && showPix && pixPayload && (
            <div className="text-center space-y-4 animate-fadeIn">
              <div className="bg-[#141724] border border-[#d4af37]/30 rounded-2xl p-4 inline-block mx-auto">
                <p className="text-xs text-slate-400">Valor da recarga:</p>
                <p className="text-2xl font-bold font-cinzel text-[#d4af37]">
                  R$ {pixPayload.amount.toFixed(2).replace('.', ',')}
                </p>
                {pixPayload.bonus > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    + R$ {pixPayload.bonus.toFixed(2)} bônus incluso!
                  </p>
                )}
              </div>

              {/* QR Code Container */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center relative border-2 border-[#d4af37]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload.pixCode)}`}
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 font-light">
                Abra o app do seu banco e escaneie o QR Code acima
              </p>

              {/* Copia e Cola Code */}
              <div className="bg-[#090a10] border border-[#d4af37]/30 rounded-xl p-3 flex items-center gap-2 text-left">
                <input
                  type="text"
                  readOnly
                  value={pixPayload.pixCode}
                  className="bg-transparent text-[11px] text-slate-400 flex-1 truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-[#141724] hover:bg-[#1f2438] border border-[#d4af37]/40 text-[#f3eed9] text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Simular Aprovação Instantânea */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSimulatePaymentApproval}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold font-cinzel text-xs shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? 'Confirmando...' : 'Confirmar Pagamento PIX (Simular Aprovação)'}
                </button>

                <button
                  onClick={() => setShowPix(false)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Escolher outro pacote
                </button>
              </div>
            </div>
          )}

          {/* HISTÓRICO DE TRANSAÇÕES */}
          {tab === 'history' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  Nenhuma transação registrada ainda.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-[#090a10] border border-[#d4af37]/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#f3eed9]">{tx.description || 'Transação'}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold font-cinzel ${tx.type === 'credit_recharge' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'credit_recharge' ? '+' : '-'} R$ {Number(tx.amount || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <p className="text-[9px] text-emerald-400 uppercase font-semibold">Concluído</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
