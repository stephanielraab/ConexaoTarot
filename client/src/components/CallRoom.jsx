import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Sparkles, 
  Clock, 
  Wallet, 
  MessageSquare, 
  Layers, 
  Maximize2, 
  Volume2, 
  Send,
  X,
  RotateCw
} from 'lucide-react';
import { getSocket } from '../services/socket';
import { tarotDeck } from '../data/tarotDeckClient';

export default function CallRoom({ 
  consultation, 
  reader, 
  currentUser, 
  onEndCall 
}) {
  const [callType, setCallType] = useState(consultation.type || 'video'); // 'video' | 'audio'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(consultation.type === 'audio');
  
  // Timers
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [pricePerMinute] = useState(consultation.pricePerMinute || 3.00);
  const [maxMinutes] = useState(consultation.maxMinutes || 20);

  // Mesa de Tarô Virtual
  const [isTarotOpen, setIsTarotOpen] = useState(false);
  const [tableCards, setTableCards] = useState([]);
  
  // Chat interno
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Media streams refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const socket = getSocket();
  const roomId = consultation.roomId;

  // Cronômetro do atendimento
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => {
        const next = prev + 1;
        // Se esgotar os minutos do saldo do cliente
        if (currentUser.role === 'client' && Math.floor(next / 60) >= maxMinutes) {
          clearInterval(timer);
          alert('Seus créditos se esgotaram. A chamada será finalizada.');
          handleFinishCall();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [maxMinutes, currentUser.role]);

  // Inicialização de Mídia e WebRTC
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const constraints = {
          audio: true,
          video: callType === 'video'
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) return;
        localStreamRef.current = stream;

        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Dispositivo de câmera/microfone indisponível ou permissão negada. Entrando em modo simulado.", err);
      }
    }

    initMedia();

    // Socket listeners para sala de atendimento
    socket.emit('join-room', {
      roomId,
      userName: currentUser.name,
      role: currentUser.role,
      callType
    });

    socket.on('tarot-table-sync', ({ cards }) => {
      setTableCards(cards || []);
    });

    socket.on('tarot-card-revealed', ({ card, spreadPosition, allCards }) => {
      setTableCards(allCards || []);
    });

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('call-ended-by-peer', () => {
      alert('A outra pessoa encerrou a chamada.');
      handleFinishCall(false);
    });

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.off('tarot-table-sync');
      socket.off('tarot-card-revealed');
      socket.off('chat-message');
      socket.off('call-ended-by-peer');
    };
  }, [roomId, callType]);

  // Alternar Mudo
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  // Alternar Câmera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Tirar carta de tarô na mesa virtual
  const handleDrawCard = (position = 'Conselho') => {
    const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
    socket.emit('tarot-draw-card', {
      roomId,
      card: randomCard,
      spreadPosition: position
    });
  };

  const handleClearTable = () => {
    socket.emit('tarot-clear-table', { roomId });
  };

  // Enviar mensagem no chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('chat-message', {
      roomId,
      sender: currentUser.name,
      message: newMessage.trim()
    });
    setNewMessage('');
  };

  // Encerrar chamada
  const handleFinishCall = (notifySocket = true) => {
    if (notifySocket) {
      socket.emit('end-call', { roomId });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    const finalMinutes = Math.max(1, Math.ceil(secondsElapsed / 60));
    onEndCall(finalMinutes);
  };

  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const currentCost = (Math.max(1, Math.ceil(secondsElapsed / 60)) * pricePerMinute).toFixed(2);
  const remainingMinutes = Math.max(0, maxMinutes - minutes);

  return (
    <div className="fixed inset-0 z-50 bg-[#080910] text-slate-100 flex flex-col overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="h-16 bg-[#0f1123]/90 border-b border-purple-900/40 px-4 sm:px-6 flex items-center justify-between shrink-0">
        
        {/* Info do Oraculista */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/50">
            <img src={reader.avatar} alt={reader.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{reader.name}</h3>
            <p className="text-[11px] text-purple-300">
              {callType === 'video' ? 'Vídeo Chamada ao Vivo' : 'Ligação de Voz'} • R$ {pricePerMinute.toFixed(2)}/min
            </p>
          </div>
        </div>

        {/* Live Call Timer & Cost */}
        <div className="flex items-center gap-4 bg-[#121429] border border-purple-800/40 px-4 py-1.5 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm font-bold">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="text-xs">
            <span className="text-slate-400">Total: </span>
            <span className="text-amber-300 font-bold">R$ {currentCost}</span>
          </div>

          {currentUser.role === 'client' && (
            <div className="hidden sm:block text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              {remainingMinutes} min restantes
            </div>
          )}
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTarotOpen(!isTarotOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTarotOpen 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                : 'bg-purple-950/60 hover:bg-purple-900 border border-purple-700/60 text-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Mesa de Tarô</span>
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
              isChatOpen 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-300'
            }`}
            title="Chat interno"
          >
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>

      </div>

      {/* Main Video / Audio Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        
        {/* If Video Call */}
        {callType === 'video' && !isVideoOff ? (
          <div className="w-full h-full max-w-5xl rounded-3xl overflow-hidden border border-purple-800/40 relative shadow-2xl bg-[#0d0f1e] flex items-center justify-center">
            
            {/* Remote Video Stream / Simulated Aura */}
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <img 
                src={reader.avatar} 
                alt={reader.name} 
                className="w-48 h-48 sm:w-60 sm:h-60 rounded-full object-cover border-4 border-amber-400/40 shadow-2xl purple-glow mb-4"
              />
              <div className="text-center">
                <h4 className="text-lg font-bold text-white">{reader.name}</h4>
                <p className="text-xs text-purple-300">Conectado(a) em Tempo Real • Alta Definição</p>
              </div>

              {/* Pulsing Aura Visualizer */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 rounded-full border border-purple-500/20 animate-ping" />
                <div className="w-96 h-96 rounded-full border border-amber-500/10 animate-pulse" />
              </div>
            </div>

            {/* Local Camera (PiP / Inset) */}
            <div className="absolute bottom-4 right-4 w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-xl bg-slate-900 z-20">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                Você
              </div>
            </div>

          </div>
        ) : (
          /* If Audio Only Call */
          <div className="w-full h-full max-w-4xl flex flex-col items-center justify-center text-center">
            
            {/* Cosmic Glowing Mandala for Audio Call */}
            <div className="relative mb-6">
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 shadow-2xl purple-glow flex items-center justify-center">
                <img 
                  src={reader.avatar} 
                  alt={reader.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Animated audio waves */}
              <div className="absolute -inset-4 rounded-full border-2 border-amber-400/30 animate-pulse pointer-events-none" />
              <div className="absolute -inset-8 rounded-full border border-purple-500/20 animate-ping pointer-events-none" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">{reader.name}</h3>
            <p className="text-sm text-amber-300 font-medium mb-4 flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              Ligação de Áudio Segura Ativa
            </p>

            <div className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-800/40 px-4 py-2 rounded-full text-xs text-purple-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Conexão oracular estabelecida. Converse à vontade.</span>
            </div>

          </div>
        )}

        {/* DRAWER: Mesa Virtual de Tarô em Tempo Real */}
        {isTarotOpen && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-[460px] bg-[#0e1022]/98 border-l border-purple-800/60 p-5 z-30 shadow-2xl flex flex-col backdrop-blur-xl animate-fadeIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Mesa Virtual de Tarô ao Vivo</h3>
              </div>
              <button 
                onClick={() => setIsTarotOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions: Tirar cartas */}
            <div className="py-3 flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => handleDrawCard('Conselho Cósmico')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                Tirar Carta de Conselho
              </button>

              <button
                onClick={() => handleDrawCard('Amor / Direcionamento')}
                className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 text-purple-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Tirar Carta do Amor
              </button>

              {tableCards.length > 0 && (
                <button
                  onClick={handleClearTable}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg transition-colors cursor-pointer ml-auto flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  Limpar Mesa
                </button>
              )}
            </div>

            {/* Lista de cartas tiradas na mesa */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {tableCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center mb-3">
                    <Layers className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">A mesa de cartas está aberta</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Tanto você quanto o oraculista podem puxar cartas do baralho sagrado para visualizar na tela ao mesmo tempo.
                  </p>
                </div>
              ) : (
                tableCards.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#151730] border border-purple-700/50 rounded-2xl p-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-32 rounded-xl overflow-hidden border border-amber-400/40 shrink-0 shadow-lg bg-black">
                        <img 
                          src={item.card.image} 
                          alt={item.card.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                            {item.spreadPosition || 'Arcano'}
                          </span>
                          <span className="text-xs text-slate-400 font-serif font-bold">
                            Nº {item.card.number}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1">
                          {item.card.name}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          {item.card.summary}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.card.keywords.map((kw, k) => (
                            <span key={k} className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* DRAWER: Chat de Texto em Tempo Real */}
        {isChatOpen && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-[#0e1022]/98 border-l border-purple-800/60 p-4 z-30 shadow-2xl flex flex-col backdrop-blur-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 shrink-0">
              <h3 className="text-sm font-bold text-white">Mensagens da Consulta</h3>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 p-4">
                  Envie nomes, datas de nascimento ou perguntas por aqui durante o atendimento.
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="bg-[#151730] border border-purple-900/40 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-purple-300 mb-1">
                      <span className="font-bold">{msg.sender}</span>
                      <span className="text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-200">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="pt-2 border-t border-purple-900/40 flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-[#0b0c16] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Bottom Controls Bar */}
      <div className="h-20 bg-[#0f1123]/95 border-t border-purple-900/40 px-4 sm:px-8 flex items-center justify-center gap-4 shrink-0">
        
        {/* Toggle Mic */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
            isMuted 
              ? 'bg-rose-950/80 border border-rose-500 text-rose-300' 
              : 'bg-[#151730] hover:bg-purple-900/50 border border-purple-800/50 text-slate-200'
          }`}
          title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Video (only if video call) */}
        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isVideoOff 
                ? 'bg-rose-950/80 border border-rose-500 text-rose-300' 
                : 'bg-[#151730] hover:bg-purple-900/50 border border-purple-800/50 text-slate-200'
            }`}
            title={isVideoOff ? "Ligar Câmera" : "Desligar Câmera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Switch call mode (Video <-> Audio) */}
        <button
          onClick={() => {
            const nextType = callType === 'video' ? 'audio' : 'video';
            setCallType(nextType);
            setIsVideoOff(nextType === 'audio');
          }}
          className="hidden sm:flex items-center gap-1.5 bg-[#151730] hover:bg-purple-900/50 border border-purple-800/50 text-purple-200 px-4 py-3 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
        >
          {callType === 'video' ? <Volume2 className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          <span>{callType === 'video' ? 'Mudar para Áudio' : 'Mudar para Vídeo'}</span>
        </button>

        {/* Mesa de Tarô Fast Trigger */}
        <button
          onClick={() => setIsTarotOpen(!isTarotOpen)}
          className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          title="Abrir Mesa de Tarô"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => handleFinishCall(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-sm">Encerrar Consulta</span>
        </button>

      </div>

    </div>
  );
}
