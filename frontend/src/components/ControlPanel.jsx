const ControlPanel = ({ 
  isAudioEnabled, 
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio, 
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  isChatOpen,
  unreadMessages,
  onToggleQuality,
  showQualityPanel,
  onLeaveRoom 
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex gap-2 md:gap-4 bg-gray-900/95 backdrop-blur-sm rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-2xl border border-gray-700/50">
        <button
          onClick={onToggleAudio}
          className={`p-3 md:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isAudioEnabled 
              ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white shadow-lg' 
              : 'bg-red-600/90 hover:bg-red-500/90 text-white shadow-lg shadow-red-500/25'
          }`}
          title={isAudioEnabled ? 'Desligar microfone' : 'Ligar microfone'}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 1.414L4.414 14L3 12.586l9.293-9.293zM7 4a3 3 0 013 3v.586l-1.207 1.207A1 1 0 008 8V4zM13 8v.586l1.207-1.207A3 3 0 0013 4v4zm-2 6.93A7.001 7.001 0 003 8a1 1 0 012 0 5 5 0 005.93 4.93l1.414-1.414A7.001 7.001 0 0017 8a1 1 0 10-2 0 5.002 5.002 0 01-4.07 4.93V17H14a1 1 0 100 2H6a1 1 0 100-2h3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-3 md:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isVideoEnabled 
              ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white shadow-lg' 
              : 'bg-red-600/90 hover:bg-red-500/90 text-white shadow-lg shadow-red-500/25'
          }`}
          title={isVideoEnabled ? 'Desligar câmera' : 'Ligar câmera'}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v4.586l-3-3V6a2 2 0 00-2-2H5.414l-1.707-1.707zM4 6.414L2.586 5A2 2 0 002 6v6a2 2 0 002 2h6a2 2 0 002-2v-.586L10.586 10H4V6.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-3 md:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isScreenSharing 
              ? 'bg-green-600/90 hover:bg-green-500/90 text-white shadow-lg shadow-green-500/25' 
              : 'bg-gray-700/80 hover:bg-gray-600/80 text-white shadow-lg'
          }`}
          title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
        >
          {isScreenSharing ? (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4v4h10V8H5zm3-2a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              <path d="M2 18a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4v4h10V8H5z" clipRule="evenodd" />
              <path d="M2 18a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
            </svg>
          )}
        </button>

        <button
          onClick={onToggleChat}
          className={`relative p-3 md:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isChatOpen 
              ? 'bg-blue-600/90 hover:bg-blue-500/90 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-gray-700/80 hover:bg-gray-600/80 text-white shadow-lg'
          }`}
          title={isChatOpen ? 'Fechar chat' : 'Abrir chat'}
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {unreadMessages > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </div>
          )}
        </button>

        <button
          onClick={onToggleQuality}
          className={`p-3 md:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
            showQualityPanel 
              ? 'bg-purple-600/90 hover:bg-purple-500/90 text-white shadow-purple-500/25' 
              : 'bg-gray-700/80 hover:bg-gray-600/80 text-white'
          }`}
          title={showQualityPanel ? 'Fechar qualidade' : 'Ver qualidade da conexão'}
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </button>


        <button
          onClick={onLeaveRoom}
          className="p-3 md:p-4 rounded-xl bg-red-600/90 hover:bg-red-500/90 text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25"
          title="Sair da chamada"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;