import { useEffect, useRef } from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ localVideoRef, peers, isVideoEnabled, userName }) => {
  const totalParticipants = 1 + peers.size;

  const getGridLayout = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  const getVideoHeight = () => {
    if (totalParticipants === 1) return 'h-[50vh] md:h-[60vh]';
    if (totalParticipants === 2) return 'h-[40vh] md:h-[45vh]';
    if (totalParticipants <= 4) return 'h-[30vh] md:h-[35vh]';
    return 'h-[25vh] md:h-[30vh]';
  };

  return (
    <div className="mb-20 px-2 md:px-4">
      <div className={`grid gap-2 md:gap-4 ${getGridLayout()}`}>
        <div className="relative group">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full ${getVideoHeight()} bg-gray-800 rounded-xl object-cover shadow-lg transition-all duration-300 group-hover:shadow-xl`}
          />
          <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {userName || 'Você'}
            </div>
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v4.586l-3-3V6a2 2 0 00-2-2H5.414l-1.707-1.707zM4 6.414L2.586 5A2 2 0 002 6v6a2 2 0 002 2h6a2 2 0 002-2v-.586L10.586 10H4V6.414z" clipRule="evenodd" />
                </svg>
                <p className="text-xs md:text-sm opacity-75">Câmera desligada</p>
              </div>
            </div>
          )}
        </div>

        {Array.from(peers.entries()).map(([peerId, peer]) => (
          <VideoTile key={peerId} peerId={peerId} peer={peer} videoHeight={getVideoHeight()} />
        ))}
      </div>
    </div>
  );
};


export default VideoGrid;