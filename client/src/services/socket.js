import { io } from 'socket.io-client';

let socket = null;

// O socket é autenticado pelo mesmo cookie de sessão HttpOnly das chamadas à API.
export const getSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true
    });
    // Se o servidor encerrar a conexão de propósito (ex.: troca de senha), o navegador não reconecta sozinho
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') socket.connect();
    });
  }
  return socket;
};

// Depois de entrar ou sair da conta, reconecta para o servidor reconhecer a nova sessão
// (oraculista passa a aparecer "Online", chamadas passam a chegar, etc.).
export const reconnectSocket = () => {
  const s = getSocket();
  s.disconnect();
  s.connect();
};
