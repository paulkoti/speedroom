#!/bin/bash

# Script de deploy automatizado para Speed Room
# Execute este script na sua VPS após fazer upload dos arquivos

set -e

echo "🚀 Iniciando deploy do Speed Room..."

# Definir variáveis
APP_DIR="/var/www/speedroom"
DOMAIN="seu-dominio.com"  # ALTERE AQUI para seu domínio

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root (sudo)"
    exit 1
fi

echo "📁 Criando diretório da aplicação..."
mkdir -p $APP_DIR
chown $USER:$USER $APP_DIR

echo "📦 Instalando dependências do backend..."
cd $APP_DIR/backend
npm install --production

echo "🔧 Criando arquivo .env..."
cat > .env << EOF
PORT=3003
NODE_ENV=production
EOF

echo "⚙️ Configurando PM2..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'speedroom-backend',
    script: './backend/server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    }
  }]
};
EOF

echo "🏗️ Configurando frontend para produção..."
cd $APP_DIR/frontend
# Substituir useSocket para produção
cp src/hooks/useSocket.production.js src/hooks/useSocket.js
npm run build

echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/speedroom << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (arquivos estáticos)
    location / {
        root $APP_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend/Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/speedroom /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔍 Testando configuração do Nginx..."
nginx -t

echo "🔄 Reiniciando Nginx..."
systemctl restart nginx

echo "🚀 Iniciando aplicação com PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save

echo "🔒 Configurando SSL..."
echo "Execute manualmente: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

echo "🎉 Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "2. Acesse https://$DOMAIN"
echo ""
echo "🛠️ Comandos úteis:"
echo "- Ver logs: pm2 logs speedroom-backend"
echo "- Reiniciar: pm2 restart speedroom-backend"
echo "- Status: pm2 status"
echo "- Monitorar: pm2 monit"