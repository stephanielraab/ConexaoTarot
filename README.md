# 🔮 Conexão Tarot — Plataforma de Atendimento Oracular

Consultas de tarô e outros oráculos ao vivo, **dentro do site** (computador ou celular):

- 📹 **Vídeo** e 📞 **áudio** ao vivo (WebRTC), com **mesa virtual de cartas** e chat durante a chamada
- 📅 **Agendamento**: cada oraculista define os próprios horários; o cliente agenda só nos horários livres
- 🧭 **Painel do cliente**: próxima consulta em destaque com botão **Entrar na consulta**, agendamentos, saldo e histórico
- 📲 **Chamada com toque**: o oraculista recebe a chamada na tela (som, vibração e notificação) e atende ou recusa
- 👥 Cadastro de oraculistas com **curadoria** (aprovação antes de atender)
- 👑 Painel do administrador (métricas, taxa de 20%, aprovações e **agenda de todos os oraculistas**)
- 💰 Divisão automática: **20% plataforma / 80% oraculista**, cobrança por minuto
- 💳 Carteira de créditos (⚠️ a recarga PIX ainda é **simulada**, veja abaixo) e ⭐ avaliações

---

## 🚀 Como rodar

Requisito: [Node.js](https://nodejs.org) (versão LTS) com npm.

```bash
npm run install:all   # só na primeira vez
npm run dev
```

- Site: **http://localhost:3000**
- API e WebSockets: http://localhost:5000

Estrutura: `client/` (React + Vite + Tailwind) · `server/` (Express + Socket.io) · dados em `server/data/db.json`.


## 🔐 Segurança e configuração

Copie `server/.env.example` para `server/.env` e preencha, no mínimo:

- `JWT_SECRET`: texto longo e aleatório que assina as sessões (cookie `HttpOnly`)
- `ADMIN_PASSWORD`: senha do administrador (troca a de demonstração)

Senhas são guardadas com bcrypt. Há bloqueio contra tentativas em massa e permissões por perfil em todas as rotas.

## 🌐 Publicar (atendimento de qualquer lugar)

1. Use **HTTPS**: câmera e microfone no celular só funcionam em endereço `https://`.
2. `npm run build` e depois `npm start`: o servidor entrega o site e a API no mesmo endereço.
3. Para chamadas por 4G/5G, configure um servidor **TURN** no `server/.env` (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
4. O oraculista deixa o site aberto com o status **Online** para receber chamadas.

## 💳 Pagamentos

A recarga PIX **credita saldo sem cobrar de verdade** (modo de demonstração). Antes de operar com dinheiro real,
integre um gateway (ex.: Mercado Pago, com confirmação por webhook) e defina `PAYMENT_SIMULATION=off` no `.env`.

## 🧹 Pendências conhecidas

- "Esqueci minha senha" por e-mail
- Aviso de chamada com o site totalmente fechado (exige notificação push)
- Integração de pagamento real e fluxo de saque dos oraculistas
