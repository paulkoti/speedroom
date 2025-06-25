# 🎥 SpeedRoom

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black.svg)](https://socket.io/)

> **Videoconferência instantânea e simples** - Crie salas de vídeo em segundos e compartilhe via URL

SpeedRoom é uma aplicação moderna de videoconferência que permite criar e participar de reuniões de vídeo através de URLs simples. Construído com WebRTC para comunicação P2P de alta qualidade, React para interface responsiva e Node.js + Socket.IO para sinalização em tempo real.

## ✨ Funcionalidades

### 🎥 **Core de Videoconferência**
- ⚡ **Criação instantânea de salas** - Sem cadastro necessário
- 📹 **Vídeo HD em tempo real** - WebRTC P2P nativo
- 🎤 **Controles de áudio/vídeo** - Mute/unmute intuitivo
- 🖥️ **Compartilhamento de tela** - Screen sharing completo
- 💬 **Chat integrado** - Mensagens durante a chamada
- 🔒 **Salas protegidas por senha** - Privacidade opcional

### 📱 **Interface Avançada**
- 🎨 **Layouts flexíveis** - Grid, foco, picture-in-picture
- 📱 **Design responsivo** - Funciona em mobile e desktop
- 🌙 **Interface moderna** - Dark theme profissional
- 🚀 **Performance otimizada** - Lazy loading de componentes

### 🛠️ **Administração**
- 📊 **Dashboard administrativo** - Métricas em tempo real
- 📈 **Analytics avançados** - Sessões, usuários, performance
- 📋 **Relatórios exportáveis** - CSV e JSON
- 🧹 **Gestão automática de memória** - Sistema anti-leak

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Navegador moderno com suporte a WebRTC

### 🏃‍♂️ Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/speedroom.git
cd speedroom

# Instalação automática
chmod +x setup.sh
./setup.sh

# Iniciar em desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` e comece a usar! 🎉

### ⚙️ Instalação Manual

```bash
# Instalar dependências
npm install

# Instalar dependências do frontend
cd frontend && npm install && cd ..

# Instalar dependências do backend  
cd backend && npm install && cd ..

# Iniciar aplicação
npm run dev
```

## 📖 Uso

### 🎬 **Criando uma Reunião**
1. Acesse a aplicação
2. Digite seu nome
3. Clique em "Criar Sala"
4. Compartilhe a URL com os participantes

### 🚪 **Entrando em uma Reunião**
1. Acesse o link da sala
2. Digite seu nome
3. Clique em "Entrar"
4. Permita acesso à câmera/microfone

### 🔧 **Controles Disponíveis**
- **Áudio/Vídeo**: Liga/desliga câmera e microfone
- **Tela**: Compartilha sua tela
- **Chat**: Abre painel de mensagens
- **Layout**: Alterna entre visualizações
- **Qualidade**: Monitora conexão

## 🛠️ Configuração Avançada

### 📁 **Estrutura do Projeto**
```
speedroom/
├── 📦 package.json              # Scripts principais
├── 🌐 frontend/                 # React SPA
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # WebRTC utilities
│   │   └── contexts/            # State management
│   └── package.json
├── 🖥️ backend/                  # Node.js Server
│   ├── server.js               # Socket.IO + Express
│   └── package.json
├── 🚀 setup.sh                  # Script de instalação automática
├── 📚 docs/                    # Documentação
└── 🐳 docker-compose.yml      # Container setup
```

### 🔧 **Variáveis de Ambiente**

Crie um arquivo `.env` no backend:

```env
# Servidor
PORT=3003
NODE_ENV=production

# Admin Dashboard
ADMIN_USERNAME=speedroom_admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here
SESSION_SECRET=your_session_secret_here

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 🔐 **Configuração de Administrador**

```bash
# Gerar hash de senha para admin
npm run generate-admin-hash "SuaSenhaSegura123!"

# Acessar dashboard
https://seudominio.com/dashboard
```

## 🚀 Deploy em Produção

### 🐳 **Docker (Recomendado)**

```bash
# Build e start
docker-compose up -d

# Logs
docker-compose logs -f
```

### 🌐 **Deploy Manual VPS**

```bash
# Preparar ambiente
npm run build

# Instalar dependências de produção
npm ci --production

# Configurar PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Configurar Nginx (exemplo)
sudo nano /etc/nginx/sites-available/speedroom

# SSL com Certbot
sudo certbot --nginx -d seudominio.com
```

### ☁️ **Deploy em Plataformas**

<details>
<summary><b>Vercel + Railway</b></summary>

#### Frontend (Vercel)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Backend (Railway)
1. Conecte seu GitHub no Railway
2. Selecione a pasta `backend`
3. Configure as variáveis de ambiente
4. Deploy automático

</details>

<details>
<summary><b>Heroku</b></summary>

```bash
# Criar apps
heroku create speedroom-frontend
heroku create speedroom-backend

# Deploy backend
cd backend
git init
heroku git:remote -a speedroom-backend
git add . && git commit -m "Deploy"
git push heroku main

# Configurar variáveis
heroku config:set NODE_ENV=production
```

</details>

## 🔧 Desenvolvimento

### 🏃‍♂️ **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend concorrente
npm run dev:frontend     # Apenas frontend (Vite)
npm run dev:backend      # Apenas backend (Nodemon)

# Build e Produção
npm run build           # Build frontend para produção
npm run start           # Iniciar servidor de produção

# Docker
npm run docker:dev      # Ambiente de desenvolvimento
npm run docker:prod     # Deploy em produção

# Testes
npm run test            # Executar todos os testes
npm run test:frontend   # Testes do frontend
npm run test:backend    # Testes do backend

# Utilidades
npm run lint            # ESLint no frontend
npm run clean           # Limpar node_modules
npm run setup           # Setup automático
npm run generate-admin-hash "senha" # Gerar hash admin
npm run health-check    # Verificar saúde da aplicação
```

### 🧪 **Testes**

```bash
# Executar todos os testes
npm test

# Testes por componente
npm run test:frontend
npm run test:backend

# Health check da aplicação
npm run health-check
```

### 🛠️ **Ferramentas de Desenvolvimento**

- **ESLint** - Linting de código
- **Prettier** - Formatação automática  
- **Nodemon** - Hot reload backend
- **Vite** - Dev server frontend
- **PM2** - Process manager produção

## 📊 APIs

### 🔓 **Endpoints Públicos**
```http
GET  /                          # Frontend SPA
GET  /health                    # Health check
POST /api/rooms                 # Criar sala
```

### 🔒 **Endpoints Administrativos**
```http
POST /api/auth/login           # Login admin
GET  /api/dashboard/stats      # Estatísticas
GET  /api/performance/metrics  # Métricas de performance
GET  /api/reports/usage        # Relatórios de uso
POST /api/memory/cleanup       # Limpeza manual
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines detalhadas.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [WebRTC](https://webrtc.org/) - Comunicação P2P
- [Socket.IO](https://socket.io/) - Real-time communication
- [React](https://reactjs.org/) - Interface de usuário
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Suporte

- 📖 **Documentação**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/speedroom/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/speedroom/discussions)
- 📧 **Email**: speedroom@seudominio.com

---

<div align="center">

**⭐ Se este projeto te ajudou, dê uma estrela no GitHub! ⭐**

[⬆ Voltar ao topo](#-speedroom)

</div>