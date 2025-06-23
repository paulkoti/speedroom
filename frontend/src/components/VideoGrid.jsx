import { useEffect, useRef } from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ localVideoRef, peers, isVideoEnabled }) => {
  const totalParticipants = 1 + peers.size;

  const getGridCols = () => {
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 2) return 2;
    if (totalParticipants <= 4) return 2;
    return 3;
  };

  return (
    <div className="mb-6">
      <div 
        className={`grid gap-4 ${
          totalParticipants === 1 
            ? 'grid-cols-1' 
            : totalParticipants === 2
            ? 'grid-cols-2'
            : totalParticipants <= 4
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-64 bg-gray-800 rounded-lg object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Você {!isVideoEnabled && '(câmera desligada)'}
          </div>
        </div>

        {Array.from(peers.entries()).map(([peerId, peer]) => (
          <VideoTile key={peerId} peerId={peerId} peer={peer} />
        ))}
      </div>
    </div>
  );
};


export default VideoGrid;