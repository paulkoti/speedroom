import { memo } from 'react';

const QualityPanel = memo(({ qualityStats, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getQualityColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityIcon = (level) => {
    switch (level) {
      case 'excellent':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'good':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'fair':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'poor':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getQualityLevel = (stats) => {
    if (!stats || !stats.summary) return 'unknown';
    
    const { avgLatency, totalPacketsLost, totalPacketsSent } = stats.summary;
    const packetLossRate = totalPacketsSent > 0 ? (totalPacketsLost / totalPacketsSent) * 100 : 0;
    
    if (avgLatency < 50 && packetLossRate < 1) return 'excellent';
    if (avgLatency < 100 && packetLossRate < 3) return 'good';
    if (avgLatency < 200 && packetLossRate < 5) return 'fair';
    return 'poor';
  };

  const formatLatency = (ms) => {
    return ms > 0 ? `${Math.round(ms)}ms` : 'N/A';
  };

  const statsEntries = Object.entries(qualityStats);

  return (
    <div className="fixed top-20 right-4 w-80 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">Qualidade da Conexão</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {statsEntries.length > 0 ? (
          <div className="space-y-3">
            {statsEntries.map(([userId, stats]) => {
              const qualityLevel = getQualityLevel(stats);
              const qualityColor = getQualityColor(qualityLevel);
              
              return (
                <div key={userId} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${qualityColor}`}>
                        {getQualityIcon(qualityLevel)}
                        <span className="text-sm font-medium">
                          {stats.userName || userId.slice(-6)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {stats.summary?.totalConnections || 0} conexões
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-gray-400">Latência</div>
                      <div className="text-white font-medium">
                        {formatLatency(stats.summary?.avgLatency)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-gray-400">Perda de Pacotes</div>
                      <div className="text-white font-medium">
                        {stats.summary?.totalPacketsLost || 0}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-gray-400">Banda</div>
                      <div className="text-white font-medium">
                        {stats.summary?.avgBandwidth || 0} KB/s
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-gray-400">Status</div>
                      <div className={`font-medium capitalize ${qualityColor}`}>
                        {qualityLevel === 'excellent' && 'Excelente'}
                        {qualityLevel === 'good' && 'Boa'}
                        {qualityLevel === 'fair' && 'Regular'}
                        {qualityLevel === 'poor' && 'Ruim'}
                        {qualityLevel === 'unknown' && 'Desconhecido'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Atualizado há {Math.round((Date.now() - stats.timestamp) / 1000)}s
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <p className="text-gray-400 text-sm">Aguardando dados de qualidade...</p>
            <p className="text-gray-500 text-xs mt-1">
              As estatísticas aparecerão quando houver conexões ativas
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Atualização automática</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span>5s</span>
          </div>
        </div>
      </div>
    </div>
  );
});

QualityPanel.displayName = 'QualityPanel';

export default QualityPanel;