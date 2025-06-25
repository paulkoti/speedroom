# 🤝 Contribuindo para o SpeedRoom

Obrigado por considerar contribuir para o SpeedRoom! Este guia vai te ajudar a contribuir de forma efetiva.

## 📋 Como Contribuir

### 🐛 Reportando Bugs

Antes de reportar um bug, verifique se ele já foi reportado nas [Issues](https://github.com/seu-usuario/speedroom/issues).

Para reportar um bug:

1. **Use o template de bug report**
2. **Descreva o problema claramente**
3. **Inclua passos para reproduzir**
4. **Adicione screenshots se relevante**
5. **Inclua informações do ambiente** (OS, navegador, versão do Node.js)

### ✨ Sugerindo Melhorias

Para sugerir uma nova funcionalidade:

1. **Verifique se já não foi sugerida**
2. **Use o template de feature request**
3. **Descreva claramente o problema que resolve**
4. **Proponha uma solução detalhada**
5. **Considere alternativas**

### 🛠️ Desenvolvendo

#### Setup do Ambiente

```bash
# Fork e clone o repositório
git clone https://github.com/seu-usuario/speedroom.git
cd speedroom

# Setup automático
chmod +x setup.sh
./setup.sh

# Criar branch para sua feature
git checkout -b feature/minha-feature
```

#### Padrões de Código

- **ESLint**: Use as regras configuradas
- **Prettier**: Formatação automática
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/)

#### Estrutura de Commits

```
tipo(escopo): descrição

[corpo opcional]

[rodapé opcional]
```

Tipos permitidos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação de código
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

Exemplos:
```bash
feat(chat): adicionar suporte a emojis
fix(webrtc): corrigir reconexão automática
docs(readme): atualizar instruções de instalação
```

#### Guidelines de Desenvolvimento

##### Frontend (React)
- Use **hooks** ao invés de classes
- Implemente **lazy loading** para componentes grandes
- Use **TypeScript** quando possível
- Mantenha componentes **pequenos e focados**
- Use **Tailwind CSS** para styling

##### Backend (Node.js)
- Use **async/await** ao invés de callbacks
- Implemente **error handling** adequado
- Use **middleware** para funcionalidades transversais
- Mantenha **routes organizadas**
- Documente **APIs** com comentários

##### WebRTC
- Trate **conexões failover**
- Implemente **reconnection logic**
- Monitore **qualidade da conexão**
- Use **STUN/TURN servers** apropriados

#### Testando

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e

# Testar build
npm run build
```

#### Pull Request Process

1. **Atualize sua branch com main**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/minha-feature
   git rebase main
   ```

2. **Execute testes**
   ```bash
   npm test
   npm run lint
   ```

3. **Crie PR com template**
   - Descreva as mudanças
   - Liste issues relacionadas
   - Adicione screenshots se aplicável
   - Marque tipo de mudança

4. **Aguarde review**
   - Responda comentários
   - Faça ajustes necessários
   - Mantenha branch atualizada

## 🏗️ Arquitetura

### Frontend
```
frontend/src/
├── components/     # Componentes React
├── hooks/          # Custom hooks
├── utils/          # Utilitários
├── contexts/       # Context API
└── config/         # Configurações
```

### Backend
```
backend/
├── server.js       # Servidor principal
├── middleware/     # Middleware Express
├── routes/         # Routes da API
└── utils/          # Utilitários
```

## 📚 Recursos

- **WebRTC**: [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- **Socket.IO**: [Socket.IO Docs](https://socket.io/docs/)
- **React**: [React Docs](https://reactjs.org/docs/)
- **Tailwind**: [Tailwind CSS](https://tailwindcss.com/docs)

## 🎯 Roadmap

### 🚧 Em Desenvolvimento
- [ ] Gravação de reuniões
- [ ] Whiteboard compartilhado
- [ ] Polls e votações
- [ ] Breakout rooms

### 💡 Ideias Futuras
- [ ] Mobile app (React Native)
- [ ] Integração com calendários
- [ ] Virtual backgrounds
- [ ] Speech-to-text
- [ ] Multi-idioma

## 🏷️ Labels

- `bug` - Correções de bugs
- `enhancement` - Melhorias
- `documentation` - Documentação
- `good first issue` - Bom para iniciantes
- `help wanted` - Ajuda necessária
- `question` - Perguntas
- `wontfix` - Não será corrigido

## 👥 Core Team

- **Maintainer**: @seu-usuario
- **Contributors**: Ver [Contributors](https://github.com/seu-usuario/speedroom/graphs/contributors)

## 📞 Comunicação

- **Issues**: Para bugs e features
- **Discussions**: Para perguntas e ideias
- **Discord**: [SpeedRoom Community](link-discord)
- **Email**: speedroom@seudominio.com

## 🎉 Reconhecimento

Todos os contribuidores são listados no README e recebem reconhecimento especial!

---

**Obrigado por ajudar a tornar o SpeedRoom melhor! 🚀**