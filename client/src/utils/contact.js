// Utilitários de contato e agendamento (links clicáveis, telefone e datas)

export const onlyDigits = (v = '') => String(v).replace(/\D/g, '');

// Remove o DDI 55 quando vier junto (ex: 5511999990001 -> 11999990001)
export const stripCountry = (v = '') => {
  const d = onlyDigits(v);
  return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d;
};

// (11) 99999-0001
export const formatPhone = (v = '') => {
  const d = stripCountry(v);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};

// Máscara enquanto digita
export const maskPhone = (v = '') => {
  const d = stripCountry(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const whatsappLink = (phone, text = '') => {
  const d = onlyDigits(phone);
  if (!d) return '';
  const full = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const TYPE_LABEL = { video: 'Vídeo chamada', audio: 'Ligação de áudio', whatsapp: 'WhatsApp' };

export const STATUS_LABEL = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  cancelled: 'Cancelada',
  completed: 'Realizada'
};

export const formatDateTime = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time, full: `${date} às ${time}` };
};

export const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
