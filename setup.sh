#!/bin/bash

# 🚀 SpeedRoom - Setup Automático
# Este script configura o ambiente de desenvolvimento automaticamente

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Welcome message
echo -e "${BLUE}"
echo "╭─────────────────────────────────╮"
echo "│  🎥 SpeedRoom Setup Script      │"
echo "│  Configurando ambiente...       │"
echo "╰─────────────────────────────────╯"
echo -e "${NC}"

# Check if Node.js is installed
print_step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Instale Node.js 18+ antes de continuar."
    echo "👉 https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versão 18+ necessária. Versão atual: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) encontrado"

# Check if npm is installed
print_step "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado. Instale npm antes de continuar."
    exit 1
fi
print_success "npm $(npm -v) encontrado"

# Install root dependencies
print_step "Instalando dependências principais..."
npm install
print_success "Dependências principais instaladas"

# Install backend dependencies
print_step "Instalando dependências do backend..."
cd backend
npm install
print_success "Dependências do backend instaladas"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_step "Criando arquivo .env para backend..."
    cat > .env << EOF
# Servidor
PORT=3003
NODE_ENV=development

# Admin Dashboard  
ADMIN_USERNAME=speedroom_admin
ADMIN_PASSWORD_HASH=\$2b\$10\$4D0AbrWw/voC6ds4PmsxwOLfZHjwuV53R6Vh7Qaz4xnlfZH5rAGdq
SESSION_SECRET=speedroom-dev-secret-$(date +%s)

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
EOF
    print_success "Arquivo .env criado (senha padrão: SpeedRoom@Admin2024!)"
else
    print_warning "Arquivo .env já existe, mantendo configurações atuais"
fi

cd ..

# Install frontend dependencies
print_step "Instalando dependências do frontend..."
cd frontend
npm install
print_success "Dependências do frontend instaladas"

cd ..

# Create scripts directory
mkdir -p scripts

# Create development script
print_step "Criando scripts auxiliares..."
cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando SpeedRoom em modo desenvolvimento..."
npm run dev
EOF

cat > scripts/build.sh << 'EOF'
#!/bin/bash
echo "🏗️ Fazendo build do SpeedRoom..."
npm run build
echo "✅ Build concluído! Arquivos em frontend/dist/"
EOF

cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando SpeedRoom em modo produção..."
npm start
EOF

# Make scripts executable
chmod +x scripts/*.sh
print_success "Scripts auxiliares criados"

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    print_step "Criando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build outputs
frontend/dist/
frontend/build/

# Environment variables
.env
.env.local
.env.production
.env.development

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# PM2
.pm2/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
.tmp/
.temp/
EOF
    print_success ".gitignore criado"
fi

# Success message
echo -e "${GREEN}"
echo "╭─────────────────────────────────╮"
echo "│  🎉 Setup Concluído!            │"
echo "╰─────────────────────────────────╯"
echo -e "${NC}"

echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. 🚀 Iniciar desenvolvimento: ${GREEN}npm run dev${NC}"
echo "2. 🌐 Acessar aplicação: ${GREEN}http://localhost:5173${NC}"
echo "3. 🛠️ Acessar dashboard: ${GREEN}http://localhost:5173/dashboard${NC}"
echo "   └── Usuário: ${YELLOW}speedroom_admin${NC}"
echo "   └── Senha: ${YELLOW}SpeedRoom@Admin2024!${NC}"
echo ""
echo -e "${BLUE}📚 Comandos úteis:${NC}"
echo "• ${GREEN}npm run dev${NC} - Modo desenvolvimento"
echo "• ${GREEN}npm run build${NC} - Build para produção"  
echo "• ${GREEN}npm start${NC} - Modo produção"
echo "• ${GREEN}./scripts/dev.sh${NC} - Script de desenvolvimento"
echo ""
echo -e "${YELLOW}💡 Dica: Mantenha as duas abas abertas (frontend:5173 e backend:3003)${NC}"
echo ""
print_success "SpeedRoom está pronto para uso! 🚀"