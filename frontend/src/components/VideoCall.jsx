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
import VideoGridAdvanced from './VideoGridAdvanced';
import NameModal from './NameModal';
import MaximizedVideoModal from './MaximizedVideoModal';
import Chat from './Chat';
import LayoutSelector from './LayoutSelector';

const VideoCall = () => {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [peers, setPeers] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [useFakeVideo, setUseFakeVideo] = useState(false);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [showAudioWarning, setShowAudioWarning] = useState(false);
  const [screenShareAudioInfo, setScreenShareAudioInfo] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [layout, setLayout] = useState('grid');
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [speakerUserId, setSpeakerUserId] = useState(null);
  const [isPiPEnabled, setIsPiPEnabled] = useState(false);
  const [pipVideo, setPipVideo] = useState(null);
  
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
    
    // Detectar se o áudio pode ser reproduzido (Chrome autoplay policy)
    setTimeout(() => {
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      if (isChrome) {
        setShowAudioWarning(true);
      }
    }, 3000); // Mostrar após 3 segundos
    
    socket.emit('join-room', currentRoomId, currentUserId, name);
  };

  useEffect(() => {
    if (!isConnected || !socket || showNameModal) return;

    return () => {
      cleanupConnections();
    };
  }, [isConnected, socket, showNameModal]);

  // Load saved layout preference
  useEffect(() => {
    const savedLayout = localStorage.getItem('speedroom-layout');
    if (savedLayout && ['grid', 'speaker', 'sidebar', 'theater'].includes(savedLayout)) {
      setLayout(savedLayout);
    }
  }, []);

  // PiP event listeners
  useEffect(() => {
    if (!localVideoRef.current) return;

    const handlePiPEnter = () => {
      setIsPiPEnabled(true);
    };

    const handlePiPLeave = () => {
      setIsPiPEnabled(false);
      setPipVideo(null);
    };

    const video = localVideoRef.current;
    video.addEventListener('enterpictureinpicture', handlePiPEnter);
    video.addEventListener('leavepictureinpicture', handlePiPLeave);

    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPEnter);
      video.removeEventListener('leavepictureinpicture', handlePiPLeave);
    };
  }, [localVideoRef.current]);

  // Reatribuir srcObject quando o layout mudar
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [layout]);

  // Sincronizar srcObject sempre que o stream mudar
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localStreamRef.current = localStream;
    }
  }, [localStream]);

  // Garantir sincronização em mudanças de ref ou stream
  useEffect(() => {
    const syncVideo = () => {
      if (localVideoRef.current && localStreamRef.current) {
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          console.log('Video srcObject sincronizado:', layout);
        }
      }
    };

    // Sincronizar imediatamente
    syncVideo();

    // Adicionar um pequeno delay para garantir que as mudanças de DOM foram aplicadas
    const timeoutId = setTimeout(syncVideo, 100);

    return () => clearTimeout(timeoutId);
  }, [layout, localStream]);

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

    socket.on('chat-message', (message) => {
      // Não adicionar próprias mensagens (já adicionadas localmente)
      if (message.userId !== currentUserId) {
        setMessages(prev => [...prev, message]);
        
        // Aumentar contador de mensagens não lidas se chat estiver fechado
        setUnreadMessages(prev => isChatOpen ? prev : prev + 1);
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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Parar compartilhamento de tela
      let success = false;
      
      // Parar compartilhamento para todos os peers
      for (const [, peer] of peersRef.current) {
        const result = await peer.stopScreenShare();
        if (result) success = true;
      }
      
      // Restaurar stream local também
      if (localStream && localStream.getTracks().some(track => track.kind === 'video' && track.label.includes('screen'))) {
        // Parar stream de compartilhamento
        localStream.getTracks().forEach(track => track.stop());
        
        // Reinicializar mídia da câmera
        await initializeMedia();
        
        // Atualizar tracks em todas as conexões peer
        const newStream = localStreamRef.current;
        if (newStream) {
          for (const [, peer] of peersRef.current) {
            const videoTrack = newStream.getVideoTracks()[0];
            const sender = peer.peerConnection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            
            if (sender && videoTrack) {
              await sender.replaceTrack(videoTrack);
            }
          }
        }
        
        success = true;
      }
      
      if (success) {
        setIsScreenSharing(false);
      }
    } else {
      // Iniciar compartilhamento de tela
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor"
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 44100
          }
        });
        
        // Armazenar stream original antes de substituir
        const originalStream = localStreamRef.current;
        
        // Atualizar vídeo local
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setLocalStream(screenStream);
        localStreamRef.current = screenStream;
        
        // Substituir tracks em todas as conexões peer
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = screenStream.getAudioTracks()[0]; // Áudio da tela (se disponível)
        
        for (const [, peer] of peersRef.current) {
          // Armazenar stream original no peer
          if (!peer.originalStream && originalStream) {
            peer.originalStream = originalStream;
          }
          
          // Substituir track de vídeo
          const videoSender = peer.peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (videoSender && videoTrack) {
            await videoSender.replaceTrack(videoTrack);
          }
          
          // Se há áudio da tela, substituir também o track de áudio
          if (audioTrack) {
            const audioSender = peer.peerConnection.getSenders().find(s => 
              s.track && s.track.kind === 'audio'
            );
            
            if (audioSender) {
              await audioSender.replaceTrack(audioTrack);
            }
          }
        }
        
        // Log para debug e mostrar info para usuário
        const hasScreenAudio = screenStream.getAudioTracks().length > 0;
        console.log('Screen sharing iniciado:', {
          hasVideo: screenStream.getVideoTracks().length > 0,
          hasAudio: hasScreenAudio,
          audioTrack: audioTrack ? audioTrack.label : 'Não disponível'
        });
        
        // Mostrar informação sobre áudio para o usuário
        setScreenShareAudioInfo({
          hasAudio: hasScreenAudio,
          message: hasScreenAudio ? 
            'Compartilhamento com áudio ativado!' : 
            'Apenas vídeo compartilhado. Para incluir áudio, marque "Compartilhar áudio da aba" na próxima vez.'
        });
        
        // Auto-hide após 4 segundos
        setTimeout(() => {
          setScreenShareAudioInfo(null);
        }, 4000);
        
        // Listener para quando o usuário para de compartilhar via browser
        videoTrack.onended = async () => {
          setIsScreenSharing(false);
          
          // Restaurar câmera quando compartilhamento para
          await initializeMedia();
          
          const newStream = localStreamRef.current;
          if (newStream) {
            for (const [, peer] of peersRef.current) {
              const newVideoTrack = newStream.getVideoTracks()[0];
              const newAudioTrack = newStream.getAudioTracks()[0];
              
              // Restaurar vídeo
              const videoSender = peer.peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
              );
              if (videoSender && newVideoTrack) {
                await videoSender.replaceTrack(newVideoTrack);
              }
              
              // Restaurar áudio do microfone
              const audioSender = peer.peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'audio'
              );
              if (audioSender && newAudioTrack) {
                await audioSender.replaceTrack(newAudioTrack);
              }
            }
          }
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Erro ao compartilhar tela:', error);
      }
    }
  };

  const enableAudio = async () => {
    try {
      // Criar um contexto de áudio e reproduzir um som silencioso
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      
      // Tentar reproduzir todos os vídeos remotos (exceto o local que é muted)
      const videos = document.querySelectorAll('video');
      const promises = Array.from(videos).map(video => {
        // Só tentar reproduzir vídeos que não são o local (que deve permanecer muted)
        if (video !== localVideoRef.current) {
          return video.play().catch(() => {
            // Ignorar erros - alguns vídeos podem não ter stream ainda
          });
        }
        return Promise.resolve();
      });
      
      await Promise.allSettled(promises);
      setShowAudioWarning(false);
      
      console.log('Áudio habilitado com sucesso');
    } catch (error) {
      console.error('Erro ao habilitar áudio:', error);
    }
  };

  const handleSendMessage = (messageText) => {
    const message = {
      id: Date.now(),
      message: messageText,
      userName: userName,
      userId: userId,
      timestamp: Date.now()
    };
    
    // Adicionar mensagem localmente
    setMessages(prev => [...prev, message]);
    
    // Enviar via socket
    socket.emit('chat-message', message, roomId);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setUnreadMessages(0);
    }
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    
    // Auto-set speaker for presentation mode
    if (newLayout === 'speaker' && !speakerUserId) {
      setSpeakerUserId('local');
    }
    
    // Store layout preference
    localStorage.setItem('speedroom-layout', newLayout);
  };

  const togglePiP = async () => {
    if (!localVideoRef.current) return;

    try {
      if (isPiPEnabled) {
        // Exit PiP
        await document.exitPictureInPicture();
      } else {
        // Enter PiP
        if (localVideoRef.current.requestPictureInPicture) {
          const pipWindow = await localVideoRef.current.requestPictureInPicture();
          setPipVideo(pipWindow);
          setIsPiPEnabled(true);
        }
      }
    } catch (error) {
      console.error('Erro no Picture-in-Picture:', error);
    }
  };

  const setSpeaker = (userId) => {
    setSpeakerUserId(userId);
    if (layout !== 'speaker') {
      setLayout('speaker');
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
                  onClick={() => setShowLayoutSelector(true)}
                  className="px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white"
                  title="Alterar layout"
                >
                  📐 Layout
                </button>

                <button
                  onClick={togglePiP}
                  className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 ${
                    isPiPEnabled 
                      ? 'bg-purple-600/90 hover:bg-purple-500/90 text-white' 
                      : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white'
                  }`}
                  title={isPiPEnabled ? 'Sair do PiP' : 'Picture-in-Picture'}
                >
                  {isPiPEnabled ? '🔳' : '📱'} PiP
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
        <main className={`flex-1 ${layout === 'theater' ? 'fixed inset-0 z-50' : ''}`}>
          <VideoGridAdvanced 
            localVideoRef={localVideoRef}
            peers={peers}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            userName={userName}
            onMaximizeVideo={setMaximizedVideo}
            layout={layout}
            speakerUserId={speakerUserId}
            isTheaterMode={layout === 'theater'}
            onLayoutChange={handleLayoutChange}
          />
        </main>

        {/* Controls - Hidden in theater mode */}
        {layout !== 'theater' && (
          <ControlPanel
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={toggleChat}
            isChatOpen={isChatOpen}
            unreadMessages={unreadMessages}
            onLeaveRoom={handleLeaveRoom}
          />
        )}


        {/* Name Modal */}
        <NameModal 
          isOpen={showNameModal}
          onEnter={handleEnterRoom}
        />

        {/* Screen Share Audio Info */}
        {screenShareAudioInfo && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-40 px-6 py-4 rounded-xl shadow-2xl max-w-md mx-4 ${
            screenShareAudioInfo.hasAudio 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/30' 
              : 'bg-gradient-to-r from-yellow-600 to-orange-600 border border-yellow-500/30'
          } text-white`}>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                {screenShareAudioInfo.hasAudio ? (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.791L6.914 15H4a1 1 0 01-1-1V8a1 1 0 011-1h2.914l1.469-1.209A1 1 0 019.383 3.076zM14.657 2.929a1 1 0 010 1.414L13.414 5.586a1 1 0 01-1.414-1.414L13.243 2.93a1 1 0 011.414 0zM16.243 4.515a1 1 0 010 1.414L14.828 7.343a1 1 0 01-1.414-1.414l1.415-1.414a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.791L6.914 15H4a1 1 0 01-1-1V8a1 1 0 011-1h2.914l1.469-1.209A1 1 0 019.383 3.076zM14.657 2.929a1 1 0 010 1.414L13.414 5.586a1 1 0 01-1.414-1.414L13.243 2.93a1 1 0 011.414 0zM11.414 9l1.414-1.414a1 1 0 011.414 1.414L13 10.414l1.414 1.414a1 1 0 01-1.414 1.414L11.414 11.8a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {screenShareAudioInfo.message}
                </p>
              </div>
              <button
                onClick={() => setScreenShareAudioInfo(null)}
                className="text-white/70 hover:text-white p-1 transition-colors duration-200"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Audio Warning for Chrome */}
        {showAudioWarning && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-orange-500/30 max-w-md mx-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Áudio bloqueado pelo Chrome</p>
                <p className="text-xs opacity-90">Clique para habilitar o som dos participantes</p>
              </div>
              <button
                onClick={enableAudio}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.791L6.914 15H4a1 1 0 01-1-1V8a1 1 0 011-1h2.914l1.469-1.209A1 1 0 019.383 3.076zM14.657 2.929a1 1 0 010 1.414L13.414 5.586a1 1 0 01-1.414-1.414L13.243 2.93a1 1 0 011.414 0zM11.414 9l1.414-1.414a1 1 0 011.414 1.414L13 10.414l1.414 1.414a1 1 0 01-1.414 1.414L11.414 11.8a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Ativar
              </button>
              <button
                onClick={() => setShowAudioWarning(false)}
                className="text-white/70 hover:text-white p-1 transition-colors duration-200"
                title="Dispensar aviso"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Layout Selector */}
        <LayoutSelector
          currentLayout={layout}
          onLayoutChange={handleLayoutChange}
          isOpen={showLayoutSelector}
          onClose={() => setShowLayoutSelector(false)}
        />

        {/* Chat */}
        <Chat
          isOpen={isChatOpen && layout !== 'theater'}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          userName={userName}
          participantCount={1 + peers.size}
        />

        {/* Maximized Video Modal */}
        {maximizedVideo && (
          <MaximizedVideoModal 
            maximizedVideo={maximizedVideo}
            localVideoRef={localVideoRef}
            onClose={() => setMaximizedVideo(null)}
          />
        )}
      </div>
    </div>
  );
};

export default VideoCall;