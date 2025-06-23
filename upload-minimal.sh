#!/bin/bash

# Script para upload mínimo para VPS
# ALTERE as variáveis abaixo:
VPS_USER="seu-usuario"
VPS_IP="192.168.1.100"  # ou seu-dominio.com
VPS_PATH="/var/www/speedroom"

echo "📦 Fazendo upload dos arquivos essenciais..."

# Criar estrutura no servidor
ssh $VPS_USER@$VPS_IP "mkdir -p $VPS_PATH/{backend,frontend/src,frontend/public}"

# Backend (sem node_modules)
echo "📤 Uploading backend..."
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude '.env' \
  backend/ $VPS_USER@$VPS_IP:$VPS_PATH/backend/

# Frontend source (sem node_modules e dist)
echo "📤 Uploading frontend source..."
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  frontend/ $VPS_USER@$VPS_IP:$VPS_PATH/frontend/

# Arquivos de configuração
echo "📤 Uploading config files..."
scp package.json $VPS_USER@$VPS_IP:$VPS_PATH/
scp deploy.sh $VPS_USER@$VPS_IP:$VPS_PATH/
scp ecosystem.config.js $VPS_USER@$VPS_IP:$VPS_PATH/ 2>/dev/null || echo "ecosystem.config.js será criado no deploy"

echo "✅ Upload concluído! Agora execute na VPS:"
echo "ssh $VPS_USER@$VPS_IP"
echo "cd $VPS_PATH && sudo ./deploy.sh"