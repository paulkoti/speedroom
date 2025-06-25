const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Configure CORS for production and development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:5176',
  'http://speedroom.sovxeo.shop', 'https://speedroom.sovxeo.shop',
  process.env.FRONTEND_URL
].filter(Boolean);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Custom Session Store with TTL to prevent memory leaks
class CustomSessionStore extends session.Store {
  constructor() {
    super();
    this.sessions = new Map();
    this.cleanup();
  }
  
  get(sid, callback) {
    const sessionData = this.sessions.get(sid);
    if (!sessionData) return callback();
    
    // Check if expired
    if (sessionData.expires && sessionData.expires < Date.now()) {
      this.sessions.delete(sid);
      return callback();
    }
    
    callback(null, sessionData.data);
  }
  
  set(sid, session, callback) {
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    this.sessions.set(sid, { data: session, expires });
    callback();
  }
  
  destroy(sid, callback) {
    this.sessions.delete(sid);
    callback();
  }
  
  cleanup() {
    const now = Date.now();
    for (const [sid, sessionData] of this.sessions.entries()) {
      if (sessionData.expires && sessionData.expires < now) {
        this.sessions.delete(sid);
      }
    }
    // Cleanup every 10 minutes
    setTimeout(() => this.cleanup(), 10 * 60 * 1000);
  }
  
  length(callback) {
    callback(null, this.sessions.size);
  }
}

// Session middleware for dashboard auth
app.use(session({
  store: new CustomSessionStore(),
  secret: process.env.SESSION_SECRET || 'speedroom-dashboard-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Estrutura: roomId -> { users: Set, password: hashedPassword, createdAt: timestamp, owner: userId }
const rooms = new Map();
const SALT_ROUNDS = 10;

// Dashboard Admin Credentials (in production, store in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'speedroom_admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$4D0AbrWw/voC6ds4PmsxwOLfZHjwuV53R6Vh7Qaz4xnlfZH5rAGdq'; // Default: 'SpeedRoom@Admin2024!'

// Generate hash for default password if needed
const generateDefaultPasswordHash = async () => {
  if (!process.env.ADMIN_PASSWORD_HASH) {
    const defaultPassword = 'SpeedRoom@Admin2024!';
    const hash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    console.log('🔐 Admin credentials:');
    console.log('   Username: speedroom_admin');
    console.log('   Password: SpeedRoom@Admin2024!');
    console.log('   Hash (for production):', hash);
    return hash;
  }
  return process.env.ADMIN_PASSWORD_HASH;
};

// Auth middleware for dashboard routes
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Sistema de Métricas e Analytics
const sessions = new Map(); // sessionId -> session data
const roomMetrics = new Map(); // roomId -> room metrics
const globalStats = {
  totalRooms: 0,
  totalSessions: 0,
  totalMessages: 0,
  peakConcurrentUsers: 0,
  serverStartTime: Date.now()
};

// Metrics Collection Functions
function createSession(socket, roomId, userId, userName) {
  const sessionId = `${userId}_${Date.now()}`;
  const session = {
    sessionId,
    roomId,
    userId,
    userName,
    startTime: Date.now(),
    endTime: null,
    duration: 0,
    messagesCount: 0,
    joined: Date.now()
  };
  
  sessions.set(sessionId, session);
  socket.sessionId = sessionId;
  globalStats.totalSessions++;
  
  // Update room metrics
  if (!roomMetrics.has(roomId)) {
    roomMetrics.set(roomId, {
      roomId,
      createdAt: Date.now(),
      totalParticipants: 0,
      peakParticipants: 0,
      totalMessages: 0,
      totalDuration: 0,
      sessions: []
    });
  }
  
  const roomMetric = roomMetrics.get(roomId);
  roomMetric.totalParticipants++;
  roomMetric.sessions.push(sessionId);
  
  return session;
}

function endSession(socket) {
  if (!socket.sessionId) return;
  
  const session = sessions.get(socket.sessionId);
  if (session) {
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Update room metrics
    const roomMetric = roomMetrics.get(session.roomId);
    if (roomMetric) {
      roomMetric.totalDuration += session.duration;
    }
  }
}

// Memory cleanup functions
function cleanupOldSessions() {
  const now = Date.now();
  const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of sessions.entries()) {
    // Remove sessions older than 24 hours
    if (session.endTime && (now - session.endTime) > MAX_SESSION_AGE) {
      sessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
    // Remove sessions without endTime that are older than 2 hours (likely orphaned)
    else if (!session.endTime && (now - session.startTime) > (2 * 60 * 60 * 1000)) {
      sessions.delete(sessionId);
      console.log(`🧹 Cleaned up orphaned session: ${sessionId}`);
    }
  }
}

function cleanupOldRoomMetrics() {
  const now = Date.now();
  const MAX_ROOM_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const [roomId, metric] of roomMetrics.entries()) {
    // Only clean up rooms that no longer exist and are old
    if (!rooms.has(roomId) && (now - metric.createdAt) > MAX_ROOM_AGE) {
      // Clean up session references in room metrics
      metric.sessions = metric.sessions.filter(sessionId => sessions.has(sessionId));
      
      // If no active sessions and room is old, remove completely
      if (metric.sessions.length === 0) {
        roomMetrics.delete(roomId);
        console.log(`🧹 Cleaned up old room metrics: ${roomId}`);
      }
    }
  }
}

function performMemoryCleanup() {
  const memBefore = process.memoryUsage();
  console.log('🧹 Starting memory cleanup...');
  console.log(`📊 Heap before: ${Math.round(memBefore.heapUsed/1024/1024)}MB (${Math.round((memBefore.heapUsed/memBefore.heapTotal)*100)}%)`);
  
  const beforeSessions = sessions.size;
  const beforeRooms = roomMetrics.size;
  
  cleanupOldSessions();
  cleanupOldRoomMetrics();
  
  const afterSessions = sessions.size;
  const afterRooms = roomMetrics.size;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🧹 Forced garbage collection');
  }
  
  const memAfter = process.memoryUsage();
  console.log(`🧹 Memory cleanup complete: Sessions ${beforeSessions}→${afterSessions}, Room metrics ${beforeRooms}→${afterRooms}`);
  console.log(`📊 Heap after: ${Math.round(memAfter.heapUsed/1024/1024)}MB (${Math.round((memAfter.heapUsed/memAfter.heapTotal)*100)}%)`);
  console.log(`💾 Memory freed: ${Math.round((memBefore.heapUsed-memAfter.heapUsed)/1024/1024)}MB`);
}

function updateGlobalStats() {
  const currentUsers = Array.from(io.sockets.sockets.values()).length;
  if (currentUsers > globalStats.peakConcurrentUsers) {
    globalStats.peakConcurrentUsers = currentUsers;
  }
}

function getRoomStats(roomId) {
  const room = rooms.get(roomId);
  const metrics = roomMetrics.get(roomId);
  if (!room || !metrics) return null;
  
  const activeSessions = Array.from(sessions.values())
    .filter(s => s.roomId === roomId && !s.endTime);
  
  metrics.currentParticipants = room.users.size;
  if (room.users.size > metrics.peakParticipants) {
    metrics.peakParticipants = room.users.size;
  }
  
  return {
    ...metrics,
    activeSessions: activeSessions.length,
    currentUsers: Array.from(room.users)
  };
}

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

    // Create session for metrics
    createSession(socket, roomId, userId, userName);
    globalStats.totalRooms++;
    updateGlobalStats();

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

    // Create session for metrics
    createSession(socket, roomId, userId, userName);
    updateGlobalStats();

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

  // WebRTC Quality Stats
  socket.on('webrtc-stats', (stats) => {
    if (!socket.sessionId) return;
    
    const session = sessions.get(socket.sessionId);
    if (session) {
      if (!session.qualityStats) {
        session.qualityStats = [];
      }
      
      // Store quality metrics with timestamp
      session.qualityStats.push({
        timestamp: Date.now(),
        ...stats
      });
      
      // Keep only last 50 stats entries per session
      if (session.qualityStats.length > 50) {
        session.qualityStats = session.qualityStats.slice(-50);
      }
      
      // Broadcast quality stats to room for real-time monitoring
      socket.to(socket.roomId).emit('user-quality-update', {
        userId: socket.userId,
        userName: socket.userName,
        stats: stats
      });
    }
  });

  socket.on('chat-message', (message, roomId) => {
    console.log(`Mensagem de chat de ${message.userName} na sala ${roomId}:`, message.message);
    
    // Verificar se o usuário está na sala
    if (socket.roomId === roomId) {
      // Update metrics
      globalStats.totalMessages++;
      const roomMetric = roomMetrics.get(roomId);
      if (roomMetric) {
        roomMetric.totalMessages++;
      }
      
      const session = sessions.get(socket.sessionId);
      if (session) {
        session.messagesCount++;
      }
      
      // Repassar mensagem para todos os outros usuários na sala
      socket.to(roomId).emit('chat-message', message);
    } else {
      console.log(`Usuário ${socket.userId} tentou enviar mensagem para sala ${roomId} mas está na sala ${socket.roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    
    // End session for metrics
    endSession(socket);
    
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

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    // Check username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get current password hash
    const currentHash = await generateDefaultPasswordHash();
    
    // Verify password
    const isValid = await bcrypt.compare(password, currentHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.authenticated = true;
    req.session.username = username;
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { username }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({ 
      authenticated: true, 
      user: { username: req.session.username }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// API Routes for Dashboard (Protected)
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const currentTime = Date.now();
  const uptimeMs = currentTime - globalStats.serverStartTime;
  
  const activeRooms = Array.from(rooms.keys()).map(roomId => getRoomStats(roomId)).filter(Boolean);
  const activeSessions = Array.from(sessions.values()).filter(s => !s.endTime);
  const completedSessions = Array.from(sessions.values()).filter(s => s.endTime);
  
  const avgSessionDuration = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
    : 0;

  res.json({
    global: {
      ...globalStats,
      uptime: uptimeMs,
      currentUsers: Array.from(io.sockets.sockets.values()).length,
      activeRooms: activeRooms.length,
      activeSessions: activeSessions.length,
      avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60) // minutes
    },
    rooms: activeRooms,
    recentSessions: completedSessions.slice(-10).reverse()
  });
});

app.get('/api/dashboard/room/:roomId', requireAuth, (req, res) => {
  const { roomId } = req.params;
  const roomStats = getRoomStats(roomId);
  
  if (!roomStats) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const roomSessions = Array.from(sessions.values())
    .filter(s => s.roomId === roomId)
    .sort((a, b) => b.startTime - a.startTime);
  
  res.json({
    ...roomStats,
    sessions: roomSessions
  });
});

// Reports API (Protected)
app.get('/api/reports/usage', requireAuth, (req, res) => {
  const { period = '24h', format = 'json' } = req.query;
  
  const now = Date.now();
  let startTime;
  
  switch (period) {
    case '1h': startTime = now - (60 * 60 * 1000); break;
    case '24h': startTime = now - (24 * 60 * 60 * 1000); break;
    case '7d': startTime = now - (7 * 24 * 60 * 60 * 1000); break;
    case '30d': startTime = now - (30 * 24 * 60 * 60 * 1000); break;
    default: startTime = now - (24 * 60 * 60 * 1000);
  }
  
  const filteredSessions = Array.from(sessions.values())
    .filter(s => s.startTime >= startTime);
  
  const filteredRooms = Array.from(roomMetrics.values())
    .filter(r => r.createdAt >= startTime);
  
  const report = {
    period,
    startTime,
    endTime: now,
    summary: {
      totalSessions: filteredSessions.length,
      totalRooms: filteredRooms.length,
      totalUsers: [...new Set(filteredSessions.map(s => s.userId))].length,
      totalMessages: filteredSessions.reduce((sum, s) => sum + (s.messagesCount || 0), 0),
      avgSessionDuration: filteredSessions.length > 0 
        ? filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / filteredSessions.length
        : 0,
      peakConcurrentUsers: globalStats.peakConcurrentUsers
    },
    sessions: filteredSessions.sort((a, b) => b.startTime - a.startTime),
    rooms: filteredRooms.sort((a, b) => b.createdAt - a.createdAt)
  };
  
  if (format === 'csv') {
    // Simple CSV export
    let csv = 'Session ID,User ID,User Name,Room ID,Start Time,Duration (min),Messages\n';
    filteredSessions.forEach(session => {
      csv += `${session.sessionId},${session.userId},${session.userName},${session.roomId},${new Date(session.startTime).toISOString()},${Math.round((session.duration || 0) / 1000 / 60)},${session.messagesCount || 0}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="usage-report-${period}.csv"`);
    return res.send(csv);
  }
  
  res.json(report);
});

// Performance Monitoring API (Protected)
app.get('/api/performance/metrics', requireAuth, (req, res) => {
  const processMemory = process.memoryUsage();
  const uptime = process.uptime();
  
  const metrics = {
    timestamp: Date.now(),
    server: {
      uptime: uptime * 1000, // Convert to ms
      memory: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external
      },
      cpu: process.cpuUsage()
    },
    application: {
      activeConnections: io.sockets.sockets.size,
      activeSessions: Array.from(sessions.values()).filter(s => !s.endTime).length,
      activeRooms: rooms.size,
      totalMemoryMB: Math.round(processMemory.heapUsed / 1024 / 1024),
      memoryPercentage: Math.round((processMemory.heapUsed / processMemory.heapTotal) * 100)
    },
    stats: globalStats
  };
  
  res.json(metrics);
});

// Memory management API (Protected)
app.get('/api/memory/stats', requireAuth, (req, res) => {
  const memUsage = process.memoryUsage();
  
  res.json({
    memory: memUsage,
    collections: {
      sessions: sessions.size,
      roomMetrics: roomMetrics.size,
      activeRooms: rooms.size,
      activeSockets: io.sockets.sockets.size
    },
    uptime: process.uptime() * 1000,
    nodeVersion: process.version
  });
});

app.post('/api/memory/cleanup', requireAuth, (req, res) => {
  const before = {
    sessions: sessions.size,
    roomMetrics: roomMetrics.size,
    memory: process.memoryUsage()
  };
  
  performMemoryCleanup();
  
  const after = {
    sessions: sessions.size,
    roomMetrics: roomMetrics.size,
    memory: process.memoryUsage()
  };
  
  res.json({
    success: true,
    before,
    after,
    cleaned: {
      sessions: before.sessions - after.sessions,
      roomMetrics: before.roomMetrics - after.roomMetrics,
      memoryFreed: before.memory.heapUsed - after.memory.heapUsed
    }
  });
});

// Start memory cleanup interval (every 15 minutes for production)
setInterval(performMemoryCleanup, 15 * 60 * 1000);

// Initial cleanup on startup
setTimeout(performMemoryCleanup, 10000); // Wait 10 seconds after startup

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Dashboard API disponível em http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🧹 Memory cleanup scheduled every 30 minutes`);
});