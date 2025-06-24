const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join-room', (roomId, userId, userName) => {
    console.log(`Usuário ${userId} (${userName}) entrando na sala ${roomId}`);
    
    socket.join(roomId);
    socket.userId = userId;
    socket.userName = userName || 'Usuário';
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const existingUsers = Array.from(rooms.get(roomId));
    rooms.get(roomId).add(userId);

    const roomUsers = Array.from(rooms.get(roomId));
    console.log(`Usuários na sala ${roomId}:`, roomUsers);

    // Notificar todos os usuários existentes sobre o novo usuário
    socket.to(roomId).emit('user-connected', userId, userName);
    
    // Para o novo usuário, enviar eventos individuais para cada usuário existente
    existingUsers.forEach(existingUserId => {
      if (existingUserId !== userId) {
        // Encontrar o nome do usuário existente
        const existingSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === existingUserId && s.roomId === roomId);
        const existingUserName = existingSocket?.userName || 'Usuário';
        
        console.log(`Notificando ${userId} sobre usuário existente ${existingUserId} (${existingUserName})`);
        socket.emit('user-connected', existingUserId, existingUserName);
      }
    });
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

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    
    if (socket.roomId && socket.userId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.userId);
        if (room.size === 0) {
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