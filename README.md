# 🔮 Conexão Tarot - Plataforma de Atendimento Oracular

Plataforma completa de consultas esotéricas e oraculares online (Tarô de Marselha, Rider Waite, Baralho Cigano, Búzios, Runas, Astrologia), com suporte a:
- 📹 **Vídeo Chamada ao Vivo** com câmera e mesa virtual de cartas em tempo real
- 📞 **Ligação de Áudio** direta no navegador com privacidade total
- 💬 **Atendimento Direto via WhatsApp** integrado
- 👥 **Cadastro e Login com Curadoria de Oraculistas** (Análise prévia obrigatória antes de liberar os atendimentos)
- 👑 **Painel do Administrador** com métricas financeiras, taxa de 20% e aprovação de novos oraculistas
- 💰 **Divisão de Faturamento Automática**: 20% de taxa da plataforma para o dono e 80% repassado ao oraculista
- 💳 **Sistema de Carteira e Minutos de Consulta** com recarga instantânea via PIX
- 🎴 **Mesa Virtual Interativa de Tarô** sincronizada entre cliente e oraculista durante a chamada
- ⭐ **Sistema de Avaliações (Estrelas e Depoimentos)**

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior instalado)
- npm

### 1. Iniciar Tudo com 1 Único Comando:
No terminal da raiz do projeto (`c:\Users\user\Desktop\Projetos\ConexaoTarot`), execute:

```bash
npm run dev
```

Isso inicializará simultaneamente:
- **Backend (API & WebSockets)** em `http://localhost:5000`
- **Frontend (React & Vite)** em `http://localhost:3000`

Acesse seu navegador em: **`http://localhost:3000`**

---

## 🔑 Contas de Demonstração Rápidas (Para Testes)

No modal de login ("Entrar"), há botões de 1 clique para entrar instantaneamente com qualquer um dos perfis pré-configurados:

| Perfil | E-mail | Senha | Saldo / Status |
| :--- | :--- | :--- | :--- |
| 👑 **Administrador Geral** | `admin@conexaotarot.com.br` | `123456` | Acesso ao Painel Admin (20% de taxa) |
| ⏳ **Oraculista em Análise** (Solange) | `solange@conexaotarot.com.br` | `123456` | Cadastro pendente de aprovação |
| 🔮 **Oraculista Aprovada** (Helena) | `helena@conexaotarot.com.br` | `123456` | 🟢 Online / Tarô de Marselha |
| 👤 **Cliente Teste** (Camila) | `cliente@conexaotarot.com.br` | `123456` | R$ 60,00 de créditos para consultas |

---

## 🌟 Funcionalidades Implementadas

### 1. Vitrine de Oraculistas
- Exibição de cards modernos com status em tempo real (**Online**, **Em Atendimento**, **Offline**).
- Filtros interativos por tipo de oráculo (Tarô de Marselha, Rider Waite, Baralho Cigano, Búzios, Runas, Astrologia).
- Busca por nome, especialidade ou palavras-chave.
- Ordenação por melhor avaliação, preço por minuto ou mais consultas.

### 2. Atendimento Multicanal
- **Vídeo Chamada**: Frente a frente com preview da câmera e contador de tempo/custo ao vivo.
- **Ligação de Áudio**: Chamada por voz privativa no navegador com visualizador de onda e avatar oracular.
- **WhatsApp**: Link direto gerado com o número cadastrado do oraculista e mensagem formatada com o ID da consulta.

### 3. Mesa Virtual de Tarô em Tempo Real
- Durante qualquer chamada, o botão **"Mesa de Tarô"** abre um deck completo dos 22 Arcanos Maiores.
- Tanto o cliente quanto o tarólogo podem puxar cartas de Conselho ou Amor.
- As cartas tiradas e seus significados sincronizam instantaneamente na tela de ambos via WebSocket.

### 4. Carteira & Recarga via PIX
- Pacotes de créditos com minutos bônus.
- Gerador de QR Code PIX e código Copia e Cola.
- Botão simulador de aprovação instantânea para testes imediatos com animação de celebração.

### 5. Painel do Oraculista
- Toggle de status instantâneo (`🟢 Disponível`, `🟡 Em Atendimento`, `⚪ Offline`).
- Ajuste do valor cobrado por minuto (R$/min).
- Atualização do número de WhatsApp e bio.
- Extrato de ganhos acumulados e atendimentos recebidos.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.io (WebSockets & WebRTC Signaling).
- **Banco de Dados**: Base de dados JSON persistente com auto-salvamento em `server/data/db.json`.
