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

const VideoCall = () => {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [peers, setPeers] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [useFakeVideo, setUseFakeVideo] = useState(false);
  
  const localVideoRef = useRef();
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  useEffect(() => {
    if (!isConnected || !socket) return;

    const currentUserId = generateUserId();
    setUserId(currentUserId);

    let currentRoomId = getRoomIdFromUrl();
    if (!currentRoomId) {
      currentRoomId = generateRoomId();
      setRoomIdInUrl(currentRoomId);
    }
    setRoomId(currentRoomId);

    setupSocketListeners(currentUserId);
    
    initializeMedia().then(() => {
      socket.emit('join-room', currentRoomId, currentUserId);
    });

    return () => {
      cleanupConnections();
    };
  }, [isConnected, socket]);

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

  const setupSocketListeners = (currentUserId) => {
    socket.on('user-connected', async (remoteUserId) => {
      console.log(`[${currentUserId}] Usuário conectado: ${remoteUserId}`);
      
      // Verificar se já não temos uma conexão com este usuário
      if (!peersRef.current.has(remoteUserId)) {
        console.log(`[${currentUserId}] Criando nova conexão peer-to-peer com ${remoteUserId}`);
        
        // Determinar quem inicia a conexão baseado no ID (lexicográfico)
        const shouldInitiate = currentUserId > remoteUserId;
        console.log(`[${currentUserId}] Deve iniciar conexão com ${remoteUserId}:`, shouldInitiate);
        
        await createPeerConnection(remoteUserId, shouldInitiate);
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
          await createPeerConnection(fromUserId, false);
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

  const createPeerConnection = async (remoteUserId, shouldCreateOffer) => {
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
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Speed Room</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Sala: {roomId}</span>
            <button
              onClick={() => setUseFakeVideo(!useFakeVideo)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                useFakeVideo 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {useFakeVideo ? 'Vídeo Fake' : 'Câmera Real'}
            </button>
            <button
              onClick={handleCopyUrl}
              className={`px-4 py-2 rounded transition-colors ${
                isCopied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isCopied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        <VideoGrid 
          localVideoRef={localVideoRef}
          peers={peers}
          isVideoEnabled={isVideoEnabled}
        />

        <ControlPanel
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    </div>
  );
};

export default VideoCall;