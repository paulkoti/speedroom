import { useEffect, useRef, useState } from 'react';

const VideoTile = ({ peerId, peer }) => {
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
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 bg-gray-800 rounded-lg object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {peerId.slice(-6)}
      </div>
    </div>
  );
};

export default VideoTile;