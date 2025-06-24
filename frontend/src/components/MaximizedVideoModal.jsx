import { useEffect, useRef } from 'react';

const MaximizedVideoModal = ({ maximizedVideo, localVideoRef, onClose }) => {
  const modalVideoRef = useRef();

  useEffect(() => {
    if (!modalVideoRef.current) return;

    if (maximizedVideo.type === 'local') {
      // Para vídeo local, usar a mesma srcObject
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        modalVideoRef.current.srcObject = localVideoRef.current.srcObject;
      }
    } else {
      // Para vídeo remoto, pegar o srcObject do vídeo original
      const originalVideo = maximizedVideo.videoRef.current;
      if (originalVideo && originalVideo.srcObject) {
        modalVideoRef.current.srcObject = originalVideo.srcObject;
      }
    }
  }, [maximizedVideo, localVideoRef]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-gray-900/80 hover:bg-gray-800/90 text-white rounded-full transition-all duration-200 transform hover:scale-105"
          title="Fechar visualização maximizada (ESC)"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <video
          ref={modalVideoRef}
          autoPlay
          playsInline
          muted={maximizedVideo.type === 'local'}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        
        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {maximizedVideo.userName}
          </div>
        </div>

        {/* Click outside to close */}
        <div 
          className="absolute inset-0 -z-10" 
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default MaximizedVideoModal;