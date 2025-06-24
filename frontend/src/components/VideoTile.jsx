import { useEffect, useRef, useState } from 'react';

const VideoTile = ({ peerId, peer, videoHeight }) => {
  const videoRef = useRef();
  const [streamAssigned, setStreamAssigned] = useState(false);

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
    <div className="relative group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full ${videoHeight || 'h-64'} bg-gray-800 rounded-xl object-cover shadow-lg transition-all duration-300 group-hover:shadow-xl`}
      />
      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {peerId.slice(-6)}
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