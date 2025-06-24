import { useEffect, useRef } from 'react';
import VideoTile from './VideoTile';

const VideoGridAdvanced = ({ 
  localVideoRef, 
  peers, 
  isVideoEnabled, 
  isScreenSharing, 
  userName, 
  onMaximizeVideo,
  layout = 'grid',
  speakerUserId = null,
  isTheaterMode = false
}) => {
  const totalParticipants = 1 + peers.size;

  // Grid Layout (original)
  const getGridLayout = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  const getGridVideoHeight = () => {
    if (totalParticipants === 1) return 'h-[50vh] md:h-[60vh]';
    if (totalParticipants === 2) return 'h-[40vh] md:h-[45vh]';
    if (totalParticipants <= 4) return 'h-[30vh] md:h-[35vh]';
    return 'h-[25vh] md:h-[30vh]';
  };

  // Speaker/Presentation Layout
  const renderSpeakerLayout = () => {
    const speakerPeer = speakerUserId && peers.get(speakerUserId);
    const isLocalSpeaker = !speakerUserId || speakerUserId === 'local';
    const otherPeers = Array.from(peers.entries()).filter(([id]) => id !== speakerUserId);

    return (
      <div className="flex flex-col lg:flex-row h-full gap-4">
        {/* Main Speaker */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative group w-full h-full max-h-[70vh] lg:max-h-full">
            {isLocalSpeaker ? (
              <div 
                className="relative group cursor-pointer h-full"
                onClick={() => onMaximizeVideo({
                  type: 'local',
                  videoRef: localVideoRef,
                  userName: userName || 'Você'
                })}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full bg-gray-800 rounded-xl ${isScreenSharing ? 'object-contain' : 'object-cover'} shadow-xl`}
                />
                <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    {userName || 'Você'} (Apresentando)
                  </div>
                </div>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v4.586l-3-3V6a2 2 0 00-2-2H5.414l-1.707-1.707zM4 6.414L2.586 5A2 2 0 002 6v6a2 2 0 002 2h6a2 2 0 002-2v-.586L10.586 10H4V6.414z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg opacity-75">Câmera desligada</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              speakerPeer && (
                <VideoTile
                  key={speakerUserId}
                  peerId={speakerUserId}
                  peer={speakerPeer}
                  videoHeight="h-full"
                  onMaximizeVideo={onMaximizeVideo}
                  isSpeaker={true}
                />
              )
            )}
          </div>
        </div>

        {/* Sidebar with other participants */}
        {(otherPeers.length > 0 || !isLocalSpeaker) && (
          <div className="w-full lg:w-80 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
            {!isLocalSpeaker && (
              <div className="flex-shrink-0 w-64 lg:w-full">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => onMaximizeVideo({
                    type: 'local',
                    videoRef: localVideoRef,
                    userName: userName || 'Você'
                  })}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-48 lg:h-40 bg-gray-800 rounded-lg ${isScreenSharing ? 'object-contain' : 'object-cover'} shadow-md`}
                  />
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      {userName || 'Você'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {otherPeers.map(([peerId, peer]) => (
              <div key={peerId} className="flex-shrink-0 w-64 lg:w-full">
                <VideoTile
                  peerId={peerId}
                  peer={peer}
                  videoHeight="h-48 lg:h-40"
                  onMaximizeVideo={onMaximizeVideo}
                  isCompact={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Sidebar Layout (Chat + Videos)
  const renderSidebarLayout = () => (
    <div className="flex h-full">
      <div className="flex-1 grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4">
        <div className="relative group cursor-pointer" onClick={() => onMaximizeVideo({
          type: 'local',
          videoRef: localVideoRef,
          userName: userName || 'Você'
        })}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-64 bg-gray-800 rounded-xl ${isScreenSharing ? 'object-contain' : 'object-cover'} shadow-lg`}
          />
          <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {userName || 'Você'}
            </div>
          </div>
        </div>

        {Array.from(peers.entries()).map(([peerId, peer]) => (
          <VideoTile 
            key={peerId} 
            peerId={peerId} 
            peer={peer} 
            videoHeight="h-64"
            onMaximizeVideo={onMaximizeVideo}
          />
        ))}
      </div>
    </div>
  );

  // Theater Mode (Fullscreen)
  const renderTheaterLayout = () => (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="max-w-full max-h-full object-contain"
        />
        
        <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {userName || 'Você'}
          </div>
        </div>

        {/* Mini participant view */}
        {peers.size > 0 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {Array.from(peers.entries()).slice(0, 4).map(([peerId, peer]) => (
              <div key={peerId} className="w-32 h-24">
                <VideoTile
                  peerId={peerId}
                  peer={peer}
                  videoHeight="h-24"
                  onMaximizeVideo={onMaximizeVideo}
                  isCompact={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Regular Grid Layout
  const renderGridLayout = () => (
    <div className="mb-20 px-2 md:px-4">
      <div className={`grid gap-2 md:gap-4 ${getGridLayout()}`}>
        <div className="relative group cursor-pointer" onClick={() => onMaximizeVideo({
          type: 'local',
          videoRef: localVideoRef,
          userName: userName || 'Você'
        })}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full ${getGridVideoHeight()} bg-gray-800 rounded-xl ${isScreenSharing ? 'object-contain' : 'object-cover'} shadow-lg transition-all duration-300 group-hover:shadow-xl`}
          />
          <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {userName || 'Você'}
            </div>
          </div>
          
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
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
          <VideoTile 
            key={peerId} 
            peerId={peerId} 
            peer={peer} 
            videoHeight={getGridVideoHeight()}
            onMaximizeVideo={onMaximizeVideo}
          />
        ))}
      </div>
    </div>
  );

  // Render based on layout with transitions
  const layoutContent = (() => {
    switch (layout) {
      case 'speaker':
        return renderSpeakerLayout();
      case 'sidebar':
        return renderSidebarLayout();
      case 'theater':
        return renderTheaterLayout();
      default:
        return renderGridLayout();
    }
  })();

  return (
    <div className="transition-all duration-500 ease-in-out">
      {layoutContent}
    </div>
  );
};

export default VideoGridAdvanced;