const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class WebRTCConnection {
  constructor(socket, localVideoRef, remoteVideoRef, userId, remoteUserId) {
    this.socket = socket;
    this.localVideoRef = localVideoRef;
    this.remoteVideoRef = remoteVideoRef;
    this.userId = userId;
    this.remoteUserId = remoteUserId;
    this.peerConnection = new RTCPeerConnection(iceServers);
    this.localStream = null;
    
    this.setupPeerConnection();
  }

  setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', event.candidate, this.remoteUserId);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log(`🎥 Stream recebido de ${this.remoteUserId}`);
      
      // Store the stream for component access
      this.remoteStream = event.streams[0];
      
      // Simple, direct assignment
      const tryAssign = () => {
        if (this.remoteVideoRef?.current) {
          this.remoteVideoRef.current.srcObject = event.streams[0];
          console.log(`✅ Stream assigned to ${this.remoteUserId}`);
          return true;
        }
        return false;
      };
      
      // Try immediately, then a few quick retries
      if (!tryAssign()) {
        setTimeout(() => tryAssign(), 50);
        setTimeout(() => tryAssign(), 150);
        setTimeout(() => tryAssign(), 300);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };
  }

  async initializeMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.localStream = stream;
      
      if (this.localVideoRef.current) {
        this.localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });

      return stream;
    } catch (error) {
      console.error('Erro ao acessar mídia:', error);
      throw error;
    }
  }

  async createOffer() {
    try {
      console.log(`Criando offer para ${this.remoteUserId}`);
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log(`Enviando offer para ${this.remoteUserId}`);
      this.socket.emit('offer', offer, this.remoteUserId);
    } catch (error) {
      console.error('Erro ao criar offer:', error);
    }
  }

  async handleOffer(offer) {
    try {
      console.log(`Recebendo offer de ${this.remoteUserId}`);
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log(`Enviando answer para ${this.remoteUserId}`);
      this.socket.emit('answer', answer, this.remoteUserId);
    } catch (error) {
      console.error('Erro ao processar offer:', error);
    }
  }

  async handleAnswer(answer) {
    try {
      console.log(`Recebendo answer de ${this.remoteUserId}`);
      await this.peerConnection.setRemoteDescription(answer);
      console.log(`Answer processado para ${this.remoteUserId}`);
    } catch (error) {
      console.error('Erro ao processar answer:', error);
    }
  }

  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Erro ao adicionar ICE candidate:', error);
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Armazenar referência da stream original
      this.originalStream = this.localStream;
      
      // Substituir tracks de vídeo
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Atualizar stream local
      this.localStream = screenStream;
      
      // Atualizar vídeo local
      if (this.localVideoRef.current) {
        this.localVideoRef.current.srcObject = screenStream;
      }

      // Listener para quando o usuário para de compartilhar
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return true;
    } catch (error) {
      console.error('Erro ao iniciar compartilhamento de tela:', error);
      return false;
    }
  }

  async stopScreenShare() {
    try {
      if (this.originalStream) {
        // Restaurar stream original
        const videoTrack = this.originalStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        // Restaurar vídeo local
        if (this.localVideoRef.current) {
          this.localVideoRef.current.srcObject = this.originalStream;
        }

        // Parar stream de compartilhamento
        if (this.localStream && this.localStream !== this.originalStream) {
          this.localStream.getTracks().forEach(track => track.stop());
        }

        this.localStream = this.originalStream;
        this.originalStream = null;
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao parar compartilhamento de tela:', error);
      return false;
    }
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}