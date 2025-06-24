import { useEffect, useRef, useState } from 'react';

const VideoTile = ({ peerId, peer, videoHeight, onMaximizeVideo }) => {
  const videoRef = useRef();
  const [streamAssigned, setStreamAssigned] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);

  // Immediate ref assignment
  useEffect(() => {
    if (peer?.videoRef && videoRef.current) {
      peer.videoRef.current = videoRef.current;
      console.log(`VideoRef definitively assigned to ${peerId}`);
    }
  }, [peer, peerId]);

  // Stream assignment handler
  useEffect(() => {
    if (!peer || !videoRef.current) return;

    const assignStream = () => {
      if (streamAssigned) return;

      // Check for cached stream first
      if (peer.remoteStream && videoRef.current) {
        videoRef.current.srcObject = peer.remoteStream;
        setStreamAssigned(true);
        
        // Detectar se é screen share baseado no label do track
        const videoTrack = peer.remoteStream.getVideoTracks()[0];
        if (videoTrack) {
          const isScreen = videoTrack.label.includes('screen') || videoTrack.label.includes('Screen');
          setIsScreenShare(isScreen);
        }
        
        console.log(`Stream assigned to ${peerId} from cache`);
        return;
      }

      // Check peer connection receivers
      if (peer.peerConnection) {
        const receivers = peer.peerConnection.getReceivers();
        const videoReceiver = receivers.find(r => 
          r.track && 
          r.track.kind === 'video' && 
          r.track.readyState === 'live'
        );

        if (videoReceiver && videoRef.current) {
          const stream = new MediaStream([videoReceiver.track]);
          videoRef.current.srcObject = stream;
          setStreamAssigned(true);
          
          // Detectar se é screen share baseado no label do track
          const isScreen = videoReceiver.track.label.includes('screen') || videoReceiver.track.label.includes('Screen');
          setIsScreenShare(isScreen);
          
          console.log(`Stream assigned to ${peerId} from receiver`);
          return;
        }
      }
    };

    // Try immediately
    assignStream();

    // Set up retry mechanism only if not assigned
    if (!streamAssigned) {
      const intervals = [100, 300, 600, 1000, 1500];
      const timeouts = intervals.map((delay, index) => 
        setTimeout(() => {
          if (!streamAssigned) {
            assignStream();
          }
        }, delay)
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [peer, peerId, streamAssigned]);

  return (
    <div className="relative group cursor-pointer" onClick={() => onMaximizeVideo({
      type: 'remote',
      videoRef: videoRef,
      userName: peer?.userName || peerId.slice(-6)
    })}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full ${videoHeight || 'h-64'} bg-gray-800 rounded-xl ${isScreenShare ? 'object-contain' : 'object-cover'} shadow-lg transition-all duration-300 group-hover:shadow-xl`}
      />
      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {peer?.userName || peerId.slice(-6)}
        </div>
      </div>
      
      {/* Maximize Icon */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {!streamAssigned && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-xs md:text-sm opacity-75">Conectando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTile;