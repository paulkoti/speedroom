import { useState, useEffect, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = memo(() => {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = async () => {
    try {
      const [statsResponse, perfResponse] = await Promise.all([
        fetch('http://localhost:3003/api/dashboard/stats', {
          credentials: 'include'
        }),
        fetch('http://localhost:3003/api/performance/metrics', {
          credentials: 'include'
        })
      ]);
      
      if (!statsResponse.ok || !perfResponse.ok) {
        if (statsResponse.status === 401 || perfResponse.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to fetch data');
      }
      
      const statsData = await statsResponse.json();
      const perfData = await perfResponse.json();
      
      setStats(statsData);
      setPerformance(perfData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (period, format) => {
    try {
      const response = await fetch(`http://localhost:3003/api/reports/usage?period=${period}&format=${format}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to generate report');
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-report-${period}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-report-${period}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Erro ao gerar relatório: ' + err.message);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro: {error}</p>
          <button 
            onClick={fetchStats}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Speed Room Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Atualizado há poucos segundos</span>
              </div>
              
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-700/50"
              >
                Sair
              </button>
              
              {/* Tab Navigation */}
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    activeTab === 'overview' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    activeTab === 'reports' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    activeTab === 'performance' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Performance
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Usuários Online</p>
                <p className="text-2xl font-bold text-white">{stats.global.currentUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Peak: {stats.global.peakConcurrentUsers}</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Salas Ativas</p>
                <p className="text-2xl font-bold text-white">{stats.global.activeRooms}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total: {stats.global.totalRooms}</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sessões Ativas</p>
                <p className="text-2xl font-bold text-white">{stats.global.activeSessions}</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Avg: {stats.global.avgSessionDuration}min</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Uptime</p>
                <p className="text-2xl font-bold text-white">{formatDuration(stats.global.uptime)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Msgs: {stats.global.totalMessages}</p>
          </div>
        </div>

        {/* Active Rooms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Salas Ativas</h2>
            {stats.rooms.length > 0 ? (
              <div className="space-y-4">
                {stats.rooms.map((room) => (
                  <div key={room.roomId} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">Sala {room.roomId.slice(-8)}</p>
                        <p className="text-sm text-gray-400">
                          Criada: {formatTime(room.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-400">{room.currentParticipants} online</p>
                        <p className="text-xs text-gray-500">Peak: {room.peakParticipants}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{room.totalMessages} mensagens</span>
                      <span>{formatDuration(room.totalDuration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma sala ativa</p>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Sessões Recentes</h2>
            {stats.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSessions.map((session) => (
                  <div key={session.sessionId} className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{session.userName}</p>
                        <p className="text-xs text-gray-400">
                          Sala {session.roomId.slice(-8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-400">
                          {formatDuration(session.duration)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.messagesCount} msgs
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma sessão recente</p>
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Reports Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">Relatórios de Uso</h2>
              <p className="text-gray-400 mb-6">Exporte dados de uso da plataforma em diferentes formatos</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['1h', '24h', '7d', '30d'].map(period => (
                  <div key={period} className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">
                      {period === '1h' && 'Última Hora'}
                      {period === '24h' && 'Últimas 24h'}
                      {period === '7d' && 'Últimos 7 dias'}
                      {period === '30d' && 'Últimos 30 dias'}
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => downloadReport(period, 'json')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        📄 Download JSON
                      </button>
                      <button
                        onClick={() => downloadReport(period, 'csv')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        📊 Download CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Estatísticas Gerais</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total de Sessões:</span>
                      <span className="text-white font-medium">{stats.global.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total de Salas:</span>
                      <span className="text-white font-medium">{stats.global.totalRooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total de Mensagens:</span>
                      <span className="text-white font-medium">{stats.global.totalMessages}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Métricas de Tempo</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duração Média:</span>
                      <span className="text-white font-medium">{stats.global.avgSessionDuration}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime do Servidor:</span>
                      <span className="text-white font-medium">{formatDuration(stats.global.uptime)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Picos de Uso</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usuários Simultâneos:</span>
                      <span className="text-white font-medium">{stats.global.peakConcurrentUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usuários Ativos:</span>
                      <span className="text-white font-medium">{stats.global.currentUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && performance && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Memória Usada</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{performance.application.totalMemoryMB}</span>
                  <span className="text-gray-400 text-sm">MB</span>
                </div>
                <div className="mt-2 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${performance.application.memoryPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{performance.application.memoryPercentage}% do heap</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Conexões Ativas</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{performance.application.activeConnections}</span>
                  <span className="text-gray-400 text-sm">sockets</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Sessões: {performance.application.activeSessions}</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Salas Ativas</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{performance.application.activeRooms}</span>
                  <span className="text-gray-400 text-sm">rooms</span>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Uptime do Servidor</h3>
                <div className="text-lg font-bold text-white">
                  {formatDuration(performance.server.uptime)}
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Métricas de Memória</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RSS:</span>
                    <span className="text-white">{Math.round(performance.server.memory.rss / 1024 / 1024)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heap Total:</span>
                    <span className="text-white">{Math.round(performance.server.memory.heapTotal / 1024 / 1024)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heap Usado:</span>
                    <span className="text-white">{Math.round(performance.server.memory.heapUsed / 1024 / 1024)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Externa:</span>
                    <span className="text-white">{Math.round(performance.server.memory.external / 1024 / 1024)}MB</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Estatísticas da Aplicação</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total de Sessões:</span>
                    <span className="text-white">{performance.stats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total de Salas:</span>
                    <span className="text-white">{performance.stats.totalRooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mensagens Totais:</span>
                    <span className="text-white">{performance.stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pico de Usuários:</span>
                    <span className="text-white">{performance.stats.peakConcurrentUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;