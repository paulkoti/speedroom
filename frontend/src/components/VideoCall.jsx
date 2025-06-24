import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { WebRTCConnection } from '../utils/webrtc';
import { createFakeVideoStream } from '../utils/fakeVideo';
import { 
  generateRoomId, 
  getRoomIdFromUrl, 
  setRoomIdInUrl, 
  generateUserId,
  copyRoomUrl 
} from '../utils/roomUtils';
import ControlPanel from './ControlPanel';
import VideoGrid from './VideoGrid';
import NameModal from './NameModal';

const VideoCall = () => {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [peers, setPeers] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [useFakeVideo, setUseFakeVideo] = useState(false);
  
  const localVideoRef = useRef();
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  const handleEnterRoom = async (name) => {
    setUserName(name);
    setShowNameModal(false);
    
    const currentUserId = generateUserId();
    setUserId(currentUserId);

    let currentRoomId = getRoomIdFromUrl();
    if (!currentRoomId) {
      currentRoomId = generateRoomId();
      setRoomIdInUrl(currentRoomId);
    }
    setRoomId(currentRoomId);

    setupSocketListeners(currentUserId, name);
    
    await initializeMedia();
    socket.emit('join-room', currentRoomId, currentUserId, name);
  };

  useEffect(() => {
    if (!isConnected || !socket || showNameModal) return;

    return () => {
      cleanupConnections();
    };
  }, [isConnected, socket, showNameModal]);

  const initializeMedia = async () => {
    try {
      let stream;
      
      if (useFakeVideo) {
        console.log('Usando vídeo fake');
        stream = await createFakeVideoStream();
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        } catch (error) {
          console.log('Câmera não disponível, usando vídeo fake');
          stream = await createFakeVideoStream();
        }
      }
      
      console.log('Stream criado:', stream, 'Tracks:', stream.getTracks().length);
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erro ao inicializar mídia:', error);
      // Fallback para vídeo fake
      const fakeStream = await createFakeVideoStream();
      setLocalStream(fakeStream);
      localStreamRef.current = fakeStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = fakeStream;
      }
    }
  };

  const setupSocketListeners = (currentUserId, currentUserName) => {
    socket.on('user-connected', async (remoteUserId, remoteUserName) => {
      console.log(`[${currentUserId}] Usuário conectado: ${remoteUserId} (${remoteUserName})`);
      
      // Verificar se já não temos uma conexão com este usuário
      if (!peersRef.current.has(remoteUserId)) {
        console.log(`[${currentUserId}] Criando nova conexão peer-to-peer com ${remoteUserId}`);
        
        // Determinar quem inicia a conexão baseado no ID (lexicográfico)
        const shouldInitiate = currentUserId > remoteUserId;
        console.log(`[${currentUserId}] Deve iniciar conexão com ${remoteUserId}:`, shouldInitiate);
        
        await createPeerConnection(remoteUserId, shouldInitiate, remoteUserName);
      } else {
        console.log(`[${currentUserId}] Conexão já existe para: ${remoteUserId}`);
      }
    });

    socket.on('offer', async (offer, fromUserId, targetUserId) => {
      console.log(`Recebendo offer de ${fromUserId} para ${targetUserId || 'todos'}`);
      if (targetUserId === currentUserId || !targetUserId) {
        const peer = peersRef.current.get(fromUserId);
        if (peer) {
          await peer.handleOffer(offer);
        } else {
          console.log(`Peer não encontrado para ${fromUserId}, criando...`);
          await createPeerConnection(fromUserId, false, 'Usuário');
          const newPeer = peersRef.current.get(fromUserId);
          if (newPeer) {
            await newPeer.handleOffer(offer);
          }
        }
      }
    });

    socket.on('answer', async (answer, fromUserId, targetUserId) => {
      console.log(`Recebendo answer de ${fromUserId} para ${targetUserId || 'todos'}`);
      if (targetUserId === currentUserId || !targetUserId) {
        const peer = peersRef.current.get(fromUserId);
        if (peer) {
          await peer.handleAnswer(answer);
        } else {
          console.log(`Peer não encontrado para answer de ${fromUserId}`);
        }
      }
    });

    socket.on('ice-candidate', async (candidate, fromUserId, targetUserId) => {
      if (targetUserId === currentUserId || !targetUserId) {
        const peer = peersRef.current.get(fromUserId);
        if (peer) {
          await peer.handleIceCandidate(candidate);
        }
      }
    });

    socket.on('user-disconnected', (disconnectedUserId) => {
      const peer = peersRef.current.get(disconnectedUserId);
      if (peer) {
        peer.disconnect();
        peersRef.current.delete(disconnectedUserId);
        setPeers(new Map(peersRef.current));
      }
    });
  };

  const createPeerConnection = async (remoteUserId, shouldCreateOffer, remoteUserName = 'Usuário') => {
    console.log(`[${userId}] Criando peer connection para ${remoteUserId}, oferecendo: ${shouldCreateOffer}`);
    
    const remoteVideoRef = { current: null };
    
    const peer = new WebRTCConnection(
      socket,
      localVideoRef,
      remoteVideoRef,
      userId,
      remoteUserId
    );

    console.log('Peer criado:', peer, 'Métodos:', Object.getOwnPropertyNames(Object.getPrototypeOf(peer)));

    // Adicionar stream local se disponível
    const currentStream = localStreamRef.current;
    if (currentStream) {
      console.log('Adicionando tracks locais à peer connection');
      currentStream.getTracks().forEach(track => {
        console.log('Adicionando track:', track.kind);
        peer.peerConnection.addTrack(track, currentStream);
      });
    } else {
      console.log('Stream local não disponível ainda');
    }

    // Salvar referência do peer corretamente
    peer.videoRef = remoteVideoRef;
    peer.userName = remoteUserName;
    peersRef.current.set(remoteUserId, peer);
    setPeers(new Map(peersRef.current));
    
    console.log(`[${userId}] Total de conexões: ${peersRef.current.size}. Conectado com:`, Array.from(peersRef.current.keys()));

    if (shouldCreateOffer) {
      console.log('Criando offer para', remoteUserId);
      await peer.createOffer();
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyRoomUrl();
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const cleanupConnections = () => {
    peersRef.current.forEach(peer => {
      if (peer.disconnect) peer.disconnect();
    });
    peersRef.current.clear();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const handleLeaveRoom = () => {
    // Limpar conexões
    cleanupConnections();
    
    // Desconectar do socket
    if (socket) {
      socket.disconnect();
    }
    
    // Redirecionar para nova sala
    window.location.href = window.location.origin;
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Conectando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Speed Room
                </h1>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-300">
                    Sala: <span className="text-white font-mono">{roomId.slice(-8)}</span>
                  </span>
                </div>
                
                <button
                  onClick={() => setUseFakeVideo(!useFakeVideo)}
                  className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 ${
                    useFakeVideo 
                      ? 'bg-orange-600/90 hover:bg-orange-500/90 text-white shadow-lg shadow-orange-500/25' 
                      : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white'
                  }`}
                >
                  {useFakeVideo ? '🎭 Fake' : '📹 Real'}
                </button>
                
                <button
                  onClick={handleCopyUrl}
                  className={`px-3 md:px-4 py-2 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    isCopied 
                      ? 'bg-green-600/90 text-white shadow-lg shadow-green-500/25' 
                      : 'bg-blue-600/90 hover:bg-blue-500/90 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {isCopied ? '✅ Copiado!' : '🔗 Compartilhar'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <VideoGrid 
            localVideoRef={localVideoRef}
            peers={peers}
            isVideoEnabled={isVideoEnabled}
            userName={userName}
          />
        </main>

        {/* Controls */}
        <ControlPanel
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeaveRoom={handleLeaveRoom}
        />

        {/* Name Modal */}
        <NameModal 
          isOpen={showNameModal}
          onEnter={handleEnterRoom}
        />
      </div>
    </div>
  );
};

export default VideoCall;