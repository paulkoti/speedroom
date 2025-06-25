# 📊 SpeedRoom API Documentation

## Endpoints Públicos

### `GET /`
Serve a aplicação frontend (SPA React).

### `GET /health`
Health check do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 64,
    "heapUsed": 32,
    "heapTotal": 48,
    "external": 8
  },
  "activeConnections": 5,
  "activeRooms": 2,
  "activeSessions": 3
}
```

## Socket.IO Events

### Cliente → Servidor

#### `create-room`
Cria uma nova sala de vídeo.

**Parâmetros:**
- `roomId` (string): ID único da sala
- `userId` (string): ID único do usuário
- `userName` (string): Nome do usuário
- `password` (string, opcional): Senha da sala

#### `join-room`
Entra em uma sala existente.

**Parâmetros:**
- `roomId` (string): ID da sala
- `userId` (string): ID único do usuário  
- `userName` (string): Nome do usuário
- `password` (string, opcional): Senha da sala

#### `offer`
Envia WebRTC offer para outro peer.

**Parâmetros:**
- `offer` (RTCSessionDescription): Offer do WebRTC
- `targetUserId` (string): ID do usuário de destino

#### `answer`
Envia WebRTC answer para outro peer.

**Parâmetros:**
- `answer` (RTCSessionDescription): Answer do WebRTC
- `targetUserId` (string): ID do usuário de destino

#### `ice-candidate`
Envia ICE candidate para outro peer.

**Parâmetros:**
- `candidate` (RTCIceCandidate): ICE candidate
- `targetUserId` (string): ID do usuário de destino

#### `chat-message`
Envia mensagem de chat.

**Parâmetros:**
- `message` (object): Objeto da mensagem
- `roomId` (string): ID da sala

#### `webrtc-stats`
Envia estatísticas de qualidade WebRTC.

**Parâmetros:**
- `stats` (object): Estatísticas da conexão

### Servidor → Cliente

#### `room-created`
Confirma criação da sala.

**Parâmetros:**
- `roomId` (string): ID da sala criada

#### `room-joined`
Confirma entrada na sala.

**Parâmetros:**
- `roomId` (string): ID da sala
- `isOwner` (boolean): Se é o dono da sala

#### `room-error`
Erro relacionado à sala.

**Parâmetros:**
- `error` (string): Mensagem de erro

#### `user-connected`
Novo usuário entrou na sala.

**Parâmetros:**
- `userId` (string): ID do usuário
- `userName` (string): Nome do usuário

#### `user-disconnected`
Usuário saiu da sala.

**Parâmetros:**
- `userId` (string): ID do usuário

#### `offer`
Recebe WebRTC offer de outro peer.

**Parâmetros:**
- `offer` (RTCSessionDescription): Offer recebido
- `fromUserId` (string): ID do remetente
- `targetUserId` (string): ID do destinatário

#### `answer`
Recebe WebRTC answer de outro peer.

**Parâmetros:**
- `answer` (RTCSessionDescription): Answer recebido
- `fromUserId` (string): ID do remetente
- `targetUserId` (string): ID do destinatário

#### `ice-candidate`
Recebe ICE candidate de outro peer.

**Parâmetros:**
- `candidate` (RTCIceCandidate): Candidate recebido
- `fromUserId` (string): ID do remetente
- `targetUserId` (string): ID do destinatário

#### `chat-message`
Recebe mensagem de chat.

**Parâmetros:**
- `message` (object): Objeto da mensagem

#### `user-quality-update`
Atualização de qualidade de um usuário.

**Parâmetros:**
- `userId` (string): ID do usuário
- `userName` (string): Nome do usuário
- `stats` (object): Estatísticas de qualidade

## Endpoints Administrativos

Todos os endpoints administrativos requerem autenticação via session.

### `POST /api/auth/login`
Login de administrador.

**Body:**
```json
{
  "username": "speedroom_admin",
  "password": "sua_senha"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "speedroom_admin"
  }
}
```

### `POST /api/auth/logout`
Logout de administrador.

### `GET /api/auth/check`
Verifica se está autenticado.

### `GET /api/dashboard/stats`
Estatísticas do dashboard.

**Response:**
```json
{
  "global": {
    "totalRooms": 15,
    "totalSessions": 42,
    "totalMessages": 127,
    "peakConcurrentUsers": 8,
    "uptime": 3600000,
    "currentUsers": 3,
    "activeRooms": 2,
    "activeSessions": 3,
    "avgSessionDuration": 15
  },
  "rooms": [...],
  "recentSessions": [...]
}
```

### `GET /api/performance/metrics`
Métricas de performance.

**Response:**
```json
{
  "timestamp": 1234567890,
  "server": {
    "uptime": 3600000,
    "memory": {
      "rss": 67108864,
      "heapTotal": 33554432,
      "heapUsed": 25165824,
      "external": 4194304
    },
    "cpu": {
      "user": 1000000,
      "system": 500000
    }
  },
  "application": {
    "activeConnections": 5,
    "activeSessions": 3,
    "activeRooms": 2,
    "totalMemoryMB": 24,
    "memoryPercentage": 75
  },
  "stats": {...}
}
```

### `GET /api/reports/usage`
Relatórios de uso.

**Query Parameters:**
- `period` (string): '1h', '24h', '7d', '30d'
- `format` (string): 'json', 'csv'

### `POST /api/memory/cleanup`
Limpeza manual de memória.

### `GET /api/memory/stats`
Estatísticas de memória.