import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Sparkles,
  Clock,
  MessageSquare,
  Layers,
  Volume2,
  Send,
  X,
  RotateCw,
  SwitchCamera,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import { tarotDeck } from '../data/tarotDeckClient';

const READER_SHARE = 0.8;

// Props:
//  consultation: { id, roomId, type, pricePerMinute, maxMinutes, answeredAt?, serverNow?, ringTimeoutMs? }
//  reader:       perfil do oraculista (foto/nome)
//  peer:         { name, avatar } da outra pessoa (usado quando QUEM está na tela é o oraculista)
//  onEndCall():  a consulta terminou (App fecha a cobrança no servidor)
//  onCancelRinging(): cliente desistiu enquanto a chamada tocava
//  onCallFailed(reason): 'declined' | 'missed'
export default function CallRoom({
  consultation,
  reader,
  currentUser,
  peer,
  onEndCall,
  onCancelRinging,
  onCallFailed
}) {
  const isReaderRole = currentUser.role === 'reader';
  const callType = consultation.type === 'audio' ? 'audio' : 'video';
  const other = isReaderRole ? (peer || { name: 'Consulente', avatar: '' }) : { name: reader.name, avatar: reader.avatar };

  const socket = getSocket();
  const roomId = consultation.roomId;
  const pricePerMinute = consultation.pricePerMinute || 3;
  const maxMinutes = consultation.maxMinutes || 20;

  // ----- Estado da chamada -----
  const [phase, setPhase] = useState(consultation.answeredAt ? 'live' : 'ringing'); // ringing | live
  const [answeredAtMs, setAnsweredAtMs] = useState(consultation.answeredAt ? Date.parse(consultation.answeredAt) : null);
  const skewRef = useRef(consultation.serverNow ? Date.now() - consultation.serverNow : 0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [ringLeft, setRingLeft] = useState(Math.ceil((consultation.ringTimeoutMs || 45000) / 1000));

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);
  const [facing, setFacing] = useState('user');
  const [mediaError, setMediaError] = useState('');
  const [connState, setConnState] = useState('new');
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [notice, setNotice] = useState('');

  // Mesa de Tarô e chat
  const [isTarotOpen, setIsTarotOpen] = useState(false);
  const [tableCards, setTableCards] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [newMessage, setNewMessage] = useState('');

  // Refs de mídia / conexão
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaPromiseRef = useRef(null);
  const pcRef = useRef(null);
  const remoteIdRef = useRef(null);
  const remoteMsRef = useRef(null);
  const pendingIceRef = useRef([]);
  const iceServersRef = useRef(null);
  const finishedRef = useRef(false);
  const chatOpenRef = useRef(false);
  const onEndRef = useRef(onEndCall);
  onEndRef.current = onEndCall;

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // ----- Relógio: o tempo vem do instante do aceite medido no servidor -----
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = answeredAtMs ? Math.max(0, Math.floor((nowMs - skewRef.current - answeredAtMs) / 1000)) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const billedMinutes = Math.max(1, Math.ceil(elapsed / 60));
  const shownValue = isReaderRole ? billedMinutes * pricePerMinute * READER_SHARE : billedMinutes * pricePerMinute;
  const remainingMinutes = Math.max(0, maxMinutes - minutes);

  // Contagem regressiva do toque
  useEffect(() => {
    if (phase !== 'ringing') return;
    const t = setInterval(() => setRingLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ----- Encerrar -----
  const cleanup = () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    closePeer();
  };

  const finish = (notify = true) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (notify) socket.emit('end-call', { roomId });
    cleanup();
    onEndRef.current();
  };

  // Créditos do cliente acabaram
  useEffect(() => {
    if (phase === 'live' && !isReaderRole && elapsed >= maxMinutes * 60) finish(true);
  }, [elapsed, phase]);

  // ----- Câmera e microfone -----
  useEffect(() => {
    let cancelled = false;
    mediaPromiseRef.current = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('insecure');
        return null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: callType === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return null;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err) {
        setMediaError(err?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
        return null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream, phase, isVideoOff]);

  useEffect(() => {
    const el = callType === 'video' ? remoteVideoRef.current : remoteAudioRef.current;
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      el.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    }
  }, [remoteStream, phase]);

  // Mantém a tela do celular acesa durante o atendimento
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
      } catch { /* sem suporte: tudo bem */ }
    };
    request();
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);

  // ----- WebRTC -----
  function closePeer(keepIce = false) {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      try { pc.close(); } catch { /* já fechada */ }
      pcRef.current = null;
    }
    remoteIdRef.current = null;
    remoteMsRef.current = null;
    if (!keepIce) pendingIceRef.current = [];
    setRemoteStream(null);
  }

  async function createPeer(remoteId) {
    closePeer(true);
    if (!iceServersRef.current) iceServersRef.current = await api.getIceServers();
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcRef.current = pc;
    remoteIdRef.current = remoteId;

    const stream = await mediaPromiseRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } else {
      // Sem microfone/câmera: ainda dá para ouvir e ver a outra pessoa
      pc.addTransceiver('audio', { direction: 'recvonly' });
      if (callType === 'video') pc.addTransceiver('video', { direction: 'recvonly' });
    }

    pc.ontrack = (e) => {
      if (!remoteMsRef.current) remoteMsRef.current = new MediaStream();
      if (!remoteMsRef.current.getTracks().includes(e.track)) remoteMsRef.current.addTrack(e.track);
      setRemoteStream(remoteMsRef.current);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('webrtc-ice-candidate', { roomId, to: remoteId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      setConnState(pc.connectionState);
      if (pc.connectionState === 'failed') restartIce();
    };
    return pc;
  }

  async function restartIce() {
    const pc = pcRef.current;
    if (!pc || !remoteIdRef.current) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { roomId, to: remoteIdRef.current, offer: pc.localDescription });
    } catch (err) {
      console.warn('Falha ao reiniciar conexão:', err);
    }
  }

  async function flushIce(pc) {
    const list = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const c of list) {
      try { await pc.addIceCandidate(c); } catch { /* candidato antigo */ }
    }
  }

  useEffect(() => {
    // Quem já está na sala faz a oferta quando o outro chega
    const onUserJoined = async ({ socketId }) => {
      try {
        const pc = await createPeer(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, to: socketId, offer: pc.localDescription });
      } catch (err) {
        console.warn('Falha ao iniciar conexão:', err);
      }
    };

    const onOffer = async ({ from, offer }) => {
      try {
        let pc = pcRef.current;
        if (!pc || remoteIdRef.current !== from) pc = await createPeer(from);
        await pc.setRemoteDescription(offer);
        await flushIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { roomId, to: from, answer: pc.localDescription });
      } catch (err) {
        console.warn('Falha ao responder conexão:', err);
      }
    };

    const onAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(answer);
        await flushIce(pc);
      } catch (err) {
        console.warn('Falha ao aplicar resposta:', err);
      }
    };

    const onIce = async ({ candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(candidate); } catch { /* ignora */ }
      } else {
        pendingIceRef.current.push(candidate);
      }
    };

    const onUserLeft = ({ socketId }) => {
      if (socketId === remoteIdRef.current) {
        closePeer();
        setConnState('disconnected');
        setNotice('A outra pessoa perdeu a conexão. Aguardando ela voltar…');
      }
    };

    const joinRoom = () =>
      socket.emit('join-room', { roomId, userName: currentUser.name, role: currentUser.role, callType });

    const onAccepted = ({ consultationId, answeredAt, serverNow }) => {
      if (consultationId !== consultation.id) return;
      skewRef.current = Date.now() - serverNow;
      setAnsweredAtMs(Date.parse(answeredAt));
      setPhase('live');
    };

    const onTableSync = ({ cards }) => setTableCards(cards || []);
    const onCardRevealed = ({ allCards }) => setTableCards(allCards || []);
    const onChat = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!chatOpenRef.current) setUnread((n) => n + 1);
    };
    const onMediaState = ({ videoOff }) => setRemoteVideoOff(!!videoOff);
    const onPeerEnded = () => finish(false);
    const onDeclined = ({ consultationId }) => consultationId === consultation.id && onCallFailed?.('declined');
    const onMissed = ({ consultationId }) => consultationId === consultation.id && onCallFailed?.('missed');
    const onDenied = () => setNotice('Não foi possível entrar na sala desta consulta.');

    socket.on('user-joined', onUserJoined);
    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIce);
    socket.on('user-left', onUserLeft);
    socket.on('connect', joinRoom);
    socket.on('call-accepted', onAccepted);
    socket.on('call-declined', onDeclined);
    socket.on('call-missed', onMissed);
    socket.on('room-denied', onDenied);
    socket.on('tarot-table-sync', onTableSync);
    socket.on('tarot-card-revealed', onCardRevealed);
    socket.on('chat-message', onChat);
    socket.on('media-state', onMediaState);
    socket.on('call-ended-by-peer', onPeerEnded);

    if (socket.connected) joinRoom();

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIce);
      socket.off('user-left', onUserLeft);
      socket.off('connect', joinRoom);
      socket.off('call-accepted', onAccepted);
      socket.off('call-declined', onDeclined);
      socket.off('call-missed', onMissed);
      socket.off('room-denied', onDenied);
      socket.off('tarot-table-sync', onTableSync);
      socket.off('tarot-card-revealed', onCardRevealed);
      socket.off('chat-message', onChat);
      socket.off('media-state', onMediaState);
      socket.off('call-ended-by-peer', onPeerEnded);
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    if (connState === 'connected') setNotice('');
  }, [connState]);

  // ----- Controles -----
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const off = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !off; });
    setIsVideoOff(off);
    socket.emit('media-state', { roomId, videoOff: off });
  };

  const switchCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user';
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: next } } });
      const track = s.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((x) => x.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track);
      const local = localStreamRef.current;
      if (local) {
        local.getVideoTracks().forEach((t) => { t.stop(); local.removeTrack(t); });
        local.addTrack(track);
        if (localVideoRef.current) localVideoRef.current.srcObject = local;
      }
      setFacing(next);
    } catch {
      setNotice('Não foi possível alternar a câmera neste aparelho.');
    }
  };

  const handleDrawCard = (position = 'Conselho') => {
    const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
    socket.emit('tarot-draw-card', { roomId, card: randomCard, spreadPosition: position });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socket.emit('chat-message', { roomId, sender: currentUser.name, message: newMessage.trim() });
    setNewMessage('');
  };

  const openChat = (open) => {
    chatOpenRef.current = open;
    setIsChatOpen(open);
    if (open) { setUnread(0); setIsTarotOpen(false); }
  };

  const mediaMessage =
    mediaError === 'denied'
      ? 'Sem permissão para microfone/câmera. Libere o acesso nas configurações do navegador para a outra pessoa te ouvir.'
      : mediaError === 'insecure'
      ? 'O navegador bloqueou câmera e microfone. Abra o site por um endereço seguro (https://).'
      : mediaError === 'unavailable'
      ? 'Não encontramos microfone/câmera neste aparelho.'
      : '';

  const isConnected = connState === 'connected';
  const showAvatarStage = callType === 'audio' || !remoteStream || remoteVideoOff || !isConnected;

  // =====================================================
  // TELA: CHAMANDO (cliente aguardando o oraculista atender)
  // =====================================================
  if (phase === 'ringing') {
    return (
      <div
        className="fixed inset-0 z-50 bg-[#080910] text-slate-100 flex flex-col items-center justify-between px-6 text-center"
        style={{ height: '100dvh', paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-xs uppercase tracking-widest text-[#d4af37] font-cinzel font-semibold">
          {callType === 'video' ? 'Vídeo chamada' : 'Ligação de áudio'}
        </p>

        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-5 rounded-full border border-[#d4af37]/30 animate-ping" />
            <div className="absolute -inset-10 rounded-full border border-purple-500/20 animate-pulse" />
            <img
              src={other.avatar}
              alt={other.name}
              className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-[#d4af37]/60 shadow-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold font-cinzel text-[#f3eed9]">{other.name}</h2>
          <p className="text-sm text-purple-200 mt-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
            Chamando… aguarde {other.name.split(' ')[0]} atender ({ringLeft}s)
          </p>
          <p className="text-[11px] text-slate-500 mt-3 max-w-xs">
            Você só é cobrado(a) depois que ela(e) atender, minuto a minuto.
          </p>
          {mediaMessage && (
            <p className="mt-4 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2 max-w-xs">{mediaMessage}</p>
          )}
        </div>

        <button
          onClick={() => { finishedRef.current = true; cleanup(); onCancelRinging?.(); }}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-4 rounded-full flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <PhoneOff className="w-5 h-5" />
          Cancelar chamada
        </button>
      </div>
    );
  }

  // =====================================================
  // TELA: ATENDIMENTO AO VIVO
  // =====================================================
  return (
    <div
      className="fixed inset-0 z-50 bg-[#080910] text-slate-100 flex flex-col overflow-hidden"
      style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Barra superior */}
      <div className="h-14 sm:h-16 bg-[#0f1123]/90 border-b border-purple-900/40 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={other.avatar} alt={other.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-purple-500/50 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight truncate">{other.name}</h3>
            <p className="text-[10px] sm:text-[11px] text-purple-300 truncate">
              {callType === 'video' ? 'Vídeo chamada' : 'Ligação de voz'}
              <span className="hidden sm:inline"> • R$ {pricePerMinute.toFixed(2)}/min</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 bg-[#121429] border border-purple-800/40 px-3 sm:px-4 py-1.5 rounded-xl shrink-0">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <div className="hidden sm:block text-xs">
            <span className="text-slate-400">{isReaderRole ? 'Você recebe: ' : 'Total: '}</span>
            <span className="text-amber-300 font-bold">R$ {shownValue.toFixed(2)}</span>
          </div>
          {!isReaderRole && (
            <div className="hidden md:block text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              {remainingMinutes} min restantes
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => { setIsTarotOpen(!isTarotOpen); openChat(false); }}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTarotOpen ? 'bg-amber-500 text-slate-950' : 'bg-purple-950/60 border border-purple-700/60 text-purple-200'
            }`}
            aria-label="Mesa de Tarô"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Mesa de Tarô</span>
          </button>
          <button
            onClick={() => openChat(!isChatOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              isChatOpen ? 'bg-purple-600 text-white' : 'bg-slate-800/60 border border-slate-700 text-slate-300'
            }`}
            aria-label="Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Avisos */}
      {(mediaMessage || notice) && (
        <div className="shrink-0 bg-amber-950/60 border-b border-amber-500/30 text-amber-200 text-[11px] sm:text-xs px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{notice || mediaMessage}</span>
        </div>
      )}

      {/* Palco */}
      <div className="flex-1 relative min-h-0 sm:p-4">
        <div className="relative w-full h-full sm:max-w-5xl sm:mx-auto sm:rounded-3xl overflow-hidden bg-[#0d0f1e] sm:border border-purple-800/40">
          {callType === 'video' && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover ${showAvatarStage ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
          {callType === 'audio' && <audio ref={remoteAudioRef} autoPlay playsInline />}

          {showAvatarStage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="relative mb-5">
                <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 shadow-2xl">
                  <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                </div>
                {isConnected && <div className="absolute -inset-3 rounded-full border-2 border-amber-400/30 animate-pulse pointer-events-none" />}
              </div>
              <h4 className="text-xl font-bold text-white">{other.name}</h4>
              {isConnected ? (
                <p className="text-xs text-emerald-300 mt-2 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  {callType === 'audio' ? 'Ligação segura em andamento' : remoteVideoOff ? 'Câmera desligada' : 'Conectado(a)'}
                </p>
              ) : (
                <p className="text-xs text-purple-200 mt-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  {connState === 'disconnected' || connState === 'failed' ? 'Reconectando…' : `Conectando com ${other.name.split(' ')[0]}…`}
                </p>
              )}
            </div>
          )}

          {needsTap && (
            <button
              onClick={() => {
                const el = callType === 'video' ? remoteVideoRef.current : remoteAudioRef.current;
                el?.play().then(() => setNeedsTap(false)).catch(() => {});
              }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-full shadow-lg cursor-pointer"
            >
              Toque para ativar o som
            </button>
          )}

          {/* Minha câmera (miniatura) */}
          {callType === 'video' && (
            <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-40 sm:h-52 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-xl bg-slate-900 z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facing === 'user' ? 'mirror' : ''} ${isVideoOff ? 'opacity-0' : ''}`}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <VideoOff className="w-6 h-6" />
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">Você</div>
            </div>
          )}

          {/* Gaveta: Mesa de Tarô */}
          {isTarotOpen && (
            <div className="absolute inset-0 sm:left-auto sm:w-[460px] bg-[#0e1022]/98 sm:border-l border-purple-800/60 p-4 sm:p-5 z-30 shadow-2xl flex flex-col backdrop-blur-xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Mesa Virtual de Tarô ao Vivo</h3>
                </div>
                <button onClick={() => setIsTarotOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer" aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => handleDrawCard('Conselho Cósmico')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs px-3 py-2.5 rounded-xl shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Carta de Conselho
                </button>
                <button
                  onClick={() => handleDrawCard('Amor / Direcionamento')}
                  className="bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-pointer"
                >
                  Carta do Amor
                </button>
                {tableCards.length > 0 && (
                  <button
                    onClick={() => socket.emit('tarot-clear-table', { roomId })}
                    className="text-xs text-rose-400 px-2 py-1 rounded-lg cursor-pointer ml-auto flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {tableCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center mb-3">
                      <Layers className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">A mesa de cartas está aberta</p>
                    <p className="text-xs max-w-xs">As duas pessoas podem puxar cartas e ver tudo ao mesmo tempo.</p>
                  </div>
                ) : (
                  tableCards.map((item, idx) => (
                    <div key={idx} className="bg-[#151730] border border-purple-700/50 rounded-2xl p-4 shadow-xl">
                      <div className="flex gap-4">
                        <div className="w-20 h-32 rounded-xl overflow-hidden border border-amber-400/40 shrink-0 bg-black">
                          <img src={item.card.image} alt={item.card.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              {item.spreadPosition || 'Arcano'}
                            </span>
                            <span className="text-xs text-slate-400 font-serif font-bold">Nº {item.card.number}</span>
                          </div>
                          <h4 className="text-base font-bold text-white mb-1">{item.card.name}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed mb-2">{item.card.summary}</p>
                          <div className="flex flex-wrap gap-1">
                            {item.card.keywords.map((kw, k) => (
                              <span key={k} className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">{kw}</span>
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

          {/* Gaveta: Chat */}
          {isChatOpen && (
            <div className="absolute inset-0 sm:left-auto sm:w-80 bg-[#0e1022]/98 sm:border-l border-purple-800/60 p-4 z-30 shadow-2xl flex flex-col backdrop-blur-xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 shrink-0">
                <h3 className="text-sm font-bold text-white">Mensagens da Consulta</h3>
                <button onClick={() => openChat(false)} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer" aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                      <p className="text-xs text-slate-200 break-words">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-purple-900/40 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-[#0b0c16] border border-purple-800/40 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button type="submit" className="p-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white cursor-pointer" aria-label="Enviar">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="h-[72px] sm:h-20 bg-[#0f1123]/95 border-t border-purple-900/40 px-3 sm:px-8 flex items-center justify-center gap-2.5 sm:gap-4 shrink-0">
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
            isMuted ? 'bg-rose-950/80 border border-rose-500 text-rose-300' : 'bg-[#151730] border border-purple-800/50 text-slate-200'
          }`}
          aria-label={isMuted ? 'Ativar microfone' : 'Silenciar microfone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isVideoOff ? 'bg-rose-950/80 border border-rose-500 text-rose-300' : 'bg-[#151730] border border-purple-800/50 text-slate-200'
            }`}
            aria-label={isVideoOff ? 'Ligar câmera' : 'Desligar câmera'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {callType === 'video' && isTouch && (
          <button
            onClick={switchCamera}
            className="p-3.5 rounded-2xl bg-[#151730] border border-purple-800/50 text-slate-200 cursor-pointer"
            aria-label="Alternar câmera frontal/traseira"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => { setIsTarotOpen(!isTarotOpen); openChat(false); }}
          className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          aria-label="Mesa de Tarô"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <button
          onClick={() => finish(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 sm:px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
          aria-label="Encerrar consulta"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Encerrar</span>
        </button>
      </div>
    </div>
  );
}
