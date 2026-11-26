import React, { useEffect, useState } from 'react';
import { Radio, BellRing, Smartphone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getSocket } from '../services/socket';

// Mostra ao oraculista se ele está pronto para receber chamadas (inclusive pelo celular)
export default function ReaderReadinessCard({ status }) {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  useEffect(() => {
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, []);

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return;
    setPerm(await Notification.requestPermission());
  };

  const ready = connected && status === 'available';
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;

  return (
    <div className={`mb-8 rounded-3xl border p-5 sm:p-6 ${ready ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-[#0f121d] border-[#d4af37]/25'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${ready ? 'bg-emerald-950 border-emerald-500/60' : 'bg-[#262013] border-[#d4af37]/40'}`}>
          <Radio className={`w-5 h-5 ${ready ? 'text-emerald-400 animate-pulse' : 'text-[#d4af37]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-cinzel text-[#f3eed9]">
            {ready ? 'Você está online e pronto(a) para receber chamadas' : 'Você ainda não está recebendo chamadas'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {!connected
              ? 'Sem conexão com o servidor no momento. Verifique sua internet; reconectamos sozinhos.'
              : status !== 'available'
              ? 'Mude seu status para “Online” (no topo da página) para aparecer na vitrine e receber chamadas.'
              : 'Os clientes chamam você aqui pelo site e a chamada toca nesta tela. Pode atender de qualquer lugar, no computador ou no celular.'}
          </p>

          <ul className="mt-3 space-y-1.5 text-[11px] text-slate-400">
            <li className="flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 shrink-0" />
              <span>
                No celular, <strong className="text-slate-200">mantenha o site aberto</strong> (a tela fica acesa sozinha enquanto você está Online) e adicione à tela inicial pelo menu do navegador para abrir com um toque.
              </span>
            </li>
            {perm !== 'unsupported' && (
              <li className="flex items-start gap-2">
                <BellRing className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 shrink-0" />
                {perm === 'granted' ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Avisos de chamada ativados (quando o site estiver em segundo plano).
                  </span>
                ) : perm === 'denied' ? (
                  <span>Avisos bloqueados no navegador. Libere nas configurações do site para ser avisado(a) em segundo plano.</span>
                ) : (
                  <span>
                    <button onClick={askPermission} className="text-[#d4af37] font-bold underline underline-offset-2 cursor-pointer">
                      Ativar avisos de chamada
                    </button>{' '}
                    para ser avisado(a) quando o site estiver em segundo plano.
                  </span>
                )}
              </li>
            )}
            {insecure && (
              <li className="flex items-start gap-2 text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Este endereço não é seguro (sem https). O navegador do celular bloqueia câmera e microfone nesse caso.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
