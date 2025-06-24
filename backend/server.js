const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Estrutura: roomId -> { users: Set, password: hashedPassword, createdAt: timestamp, owner: userId }
const rooms = new Map();
const SALT_ROUNDS = 10;

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Criar sala com senha opcional
  socket.on('create-room', async (roomId, userId, userName, password) => {
    console.log(`Usuário ${userId} (${userName}) criando sala ${roomId} ${password ? 'com senha' : 'pública'}`);
    
    if (rooms.has(roomId)) {
      socket.emit('room-error', 'Sala já existe');
      return;
    }

    let hashedPassword = null;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    // Criar nova sala
    rooms.set(roomId, {
      users: new Set([userId]),
      password: hashedPassword,
      createdAt: Date.now(),
      owner: userId
    });

    socket.join(roomId);
    socket.userId = userId;
    socket.userName = userName || 'Usuário';
    socket.roomId = roomId;

    socket.emit('room-created', roomId);
    console.log(`Sala ${roomId} criada por ${userName}`);
  });

  // Entrar em sala existente
  socket.on('join-room', async (roomId, userId, userName, password = '') => {
    console.log(`Usuário ${userId} (${userName}) tentando entrar na sala ${roomId}`);
    
    // Verificar se sala existe
    if (!rooms.has(roomId)) {
      socket.emit('room-error', 'Sala não encontrada');
      return;
    }

    const room = rooms.get(roomId);

    // Verificar senha se necessário
    if (room.password) {
      if (!password || password.trim() === '') {
        socket.emit('room-error', 'Senha necessária');
        return;
      }

      const isPasswordValid = await bcrypt.compare(password.trim(), room.password);
      if (!isPasswordValid) {
        socket.emit('room-error', 'Senha incorreta');
        return;
      }
    }

    socket.join(roomId);
    socket.userId = userId;
    socket.userName = userName || 'Usuário';
    socket.roomId = roomId;

    const existingUsers = Array.from(room.users);
    room.users.add(userId);

    console.log(`Usuários na sala ${roomId}:`, Array.from(room.users));

    // Notificar todos os usuários existentes sobre o novo usuário
    socket.to(roomId).emit('user-connected', userId, userName);
    
    // Para o novo usuário, enviar eventos individuais para cada usuário existente
    existingUsers.forEach(existingUserId => {
      if (existingUserId !== userId) {
        const existingSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === existingUserId && s.roomId === roomId);
        const existingUserName = existingSocket?.userName || 'Usuário';
        
        console.log(`Notificando ${userId} sobre usuário existente ${existingUserId} (${existingUserName})`);
        socket.emit('user-connected', existingUserId, existingUserName);
      }
    });

    socket.emit('room-joined', roomId, room.owner === userId);
  });

  socket.on('offer', (offer, targetUserId) => {
    console.log(`Offer de ${socket.userId} para ${targetUserId || 'todos'} na sala ${socket.roomId}`);
    
    if (targetUserId) {
      // Enviar offer apenas para o usuário específico
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId && s.roomId === socket.roomId);
      
      if (targetSocket) {
        targetSocket.emit('offer', offer, socket.userId, targetUserId);
        console.log(`Offer enviado especificamente para ${targetUserId}`);
      } else {
        console.log(`Target socket não encontrado para ${targetUserId}`);
      }
    } else {
      // Broadcast para todos na sala
      socket.to(socket.roomId).emit('offer', offer, socket.userId, targetUserId);
    }
  });

  socket.on('answer', (answer, targetUserId) => {
    console.log(`Answer de ${socket.userId} para ${targetUserId || 'todos'} na sala ${socket.roomId}`);
    
    if (targetUserId) {
      // Enviar answer apenas para o usuário específico
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId && s.roomId === socket.roomId);
      
      if (targetSocket) {
        targetSocket.emit('answer', answer, socket.userId, targetUserId);
        console.log(`Answer enviado especificamente para ${targetUserId}`);
      } else {
        console.log(`Target socket não encontrado para ${targetUserId}`);
      }
    } else {
      // Broadcast para todos na sala
      socket.to(socket.roomId).emit('answer', answer, socket.userId, targetUserId);
    }
  });

  socket.on('ice-candidate', (candidate, targetUserId) => {
    console.log(`ICE candidate de ${socket.userId} para ${targetUserId || 'todos'} na sala ${socket.roomId}`);
    
    if (targetUserId) {
      // Enviar ICE candidate apenas para o usuário específico
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId && s.roomId === socket.roomId);
      
      if (targetSocket) {
        targetSocket.emit('ice-candidate', candidate, socket.userId, targetUserId);
        console.log(`ICE candidate enviado especificamente para ${targetUserId}`);
      } else {
        console.log(`Target socket não encontrado para ${targetUserId}`);
      }
    } else {
      // Broadcast para todos na sala
      socket.to(socket.roomId).emit('ice-candidate', candidate, socket.userId, targetUserId);
    }
  });

  socket.on('chat-message', (message, roomId) => {
    console.log(`Mensagem de chat de ${message.userName} na sala ${roomId}:`, message.message);
    
    // Verificar se o usuário está na sala
    if (socket.roomId === roomId) {
      // Repassar mensagem para todos os outros usuários na sala
      socket.to(roomId).emit('chat-message', message);
    } else {
      console.log(`Usuário ${socket.userId} tentou enviar mensagem para sala ${roomId} mas está na sala ${socket.roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    
    if (socket.roomId && socket.userId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.users.delete(socket.userId);
        if (room.users.size === 0) {
          console.log(`Sala ${socket.roomId} vazia, removendo...`);
          rooms.delete(socket.roomId);
        }
      }
      socket.to(socket.roomId).emit('user-disconnected', socket.userId);
    }
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});