# Speed Room - Guia de Deploy VPS

## Pré-requisitos na VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar nginx
sudo apt install nginx -y

# Instalar certbot para SSL
sudo apt install certbot python3-certbot-nginx -y
```

## 1. Upload dos arquivos

Faça upload da pasta `speedroom` completa para sua VPS (ex: `/var/www/speedroom`)

```bash
# Na sua VPS, criar diretório
sudo mkdir -p /var/www/speedroom
sudo chown $USER:$USER /var/www/speedroom

# Upload via rsync, scp ou git clone
rsync -avz speedroom/ usuario@sua-vps:/var/www/speedroom/
```

## 2. Configurar Backend

```bash
cd /var/www/speedroom/backend

# Instalar dependências
npm install --production

# Criar arquivo de ambiente
cat > .env << EOF
PORT=3003
NODE_ENV=production
EOF
```

## 3. Configurar PM2

```bash
# Criar arquivo ecosystem
cat > /var/www/speedroom/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'speedroom-backend',
    script: './backend/server.js',
    cwd: '/var/www/speedroom',
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

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que aparecer (sudo ...)
```

## 4. Configurar Nginx

```bash
# Criar configuração do site
sudo tee /etc/nginx/sites-available/speedroom << EOF
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/speedroom/frontend/dist;
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

    # API routes (se houver)
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
sudo ln -s /etc/nginx/sites-available/speedroom /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

## 5. Configurar SSL (HTTPS) - OBRIGATÓRIO para WebRTC

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

## 6. Configurar Frontend para Produção

```bash
# Editar configuração do Socket.IO no frontend
# Arquivo: /var/www/speedroom/frontend/src/hooks/useSocket.js
```

Altere a URL do socket para:
```javascript
const socket = io('https://seu-dominio.com', {
  transports: ['websocket', 'polling']
});
```

Rebuilde o frontend:
```bash
cd /var/www/speedroom/frontend
npm run build
```

## 7. Firewall

```bash
# Permitir HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Permitir SSH (se não estiver permitido)
sudo ufw allow ssh

# Ativar firewall
sudo ufw enable
```

## 8. Comandos Úteis

```bash
# Ver logs do backend
pm2 logs speedroom-backend

# Reiniciar backend
pm2 restart speedroom-backend

# Ver status
pm2 status

# Monitorar
pm2 monit

# Ver logs do nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 9. Troubleshooting

1. **WebRTC não funciona**: Certifique-se de que tem HTTPS configurado
2. **Socket.IO não conecta**: Verifique configuração do nginx para websockets
3. **Site não carrega**: Verifique permissões da pasta `/var/www/speedroom/frontend/dist`

```bash
# Ajustar permissões se necessário
sudo chown -R www-data:www-data /var/www/speedroom/frontend/dist
sudo chmod -R 755 /var/www/speedroom/frontend/dist
```

## Estrutura Final na VPS

```
/var/www/speedroom/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├── frontend/
│   └── dist/          # Arquivos buildados
└── ecosystem.config.js
```

Depois de seguir todos esses passos, sua aplicação estará disponível em `https://seu-dominio.com`