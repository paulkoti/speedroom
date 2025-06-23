# Speed Room

Aplicativo de videoconferência instantânea que permite criar salas de vídeo rapidamente e compartilhá-las via URL.

## Funcionalidades

- 🚀 Criação automática de sala ao acessar o site
- 📹 Videoconferência em tempo real com WebRTC
- 🎤 Controles de áudio e vídeo
- 🔗 Compartilhamento fácil via URL
- 📱 Layout responsivo
- ⚡ Interface minimalista e rápida

## Como Usar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```
   
   Isso iniciará tanto o frontend (porta 5173) quanto o backend (porta 3001).

3. **Acessar o aplicativo:**
   - Abra `http://localhost:5173`
   - Uma sala será criada automaticamente
   - Compartilhe a URL com outros usuários para que se juntem à chamada

## Estrutura do Projeto

```
speedroom/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utilitários WebRTC
│   └── package.json
├── backend/           # Node.js + Socket.IO
│   ├── server.js         # Servidor de sinalização
│   └── package.json
└── package.json       # Scripts principais
```

## Tecnologias

- **Frontend:** React, Vite, Tailwind CSS, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO
- **WebRTC:** API nativa do navegador para P2P
- **STUN Servers:** Google STUN para NAT traversal

## Deploy

Para deploy em produção:

1. **Build do frontend:**
   ```bash
   npm run build
   ```

2. **Configurar variáveis de ambiente:**
   - `PORT`: Porta do servidor (default: 3001)
   - Ajustar URL do Socket.IO no frontend para o domínio de produção

3. **Iniciar servidor:**
   ```bash
   npm start
   ```

## Desenvolvimento

- **Frontend:** `npm run dev:frontend`
- **Backend:** `npm run dev:backend`
- **Ambos:** `npm run dev`