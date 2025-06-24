import { useState, useEffect } from 'react';
import { getRoomIdFromUrl } from '../utils/roomUtils';

const NameModal = ({ isOpen, onEnter, onCreateRoom, roomError }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('join'); // 'join' or 'create'

  // Detectar se há room ID na URL ao abrir
  useEffect(() => {
    if (isOpen) {
      const roomIdFromUrl = getRoomIdFromUrl();
      setMode(roomIdFromUrl ? 'join' : 'create');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    
    setIsLoading(true);
    
    if (mode === 'create') {
      await onCreateRoom(name.trim(), password.trim());
    } else {
      await onEnter(name.trim(), password.trim());
    }
    
    setIsLoading(false);
  };

  const generateRandomName = () => {
    const adjectives = ['Rápido', 'Esperto', 'Criativo', 'Brilhante', 'Ágil', 'Dinâmico', 'Inteligente', 'Eficiente'];
    const nouns = ['Desenvolvedor', 'Designer', 'Criador', 'Inovador', 'Pensador', 'Construtor', 'Artista', 'Visionário'];
    const number = Math.floor(Math.random() * 100);
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdj} ${randomNoun} ${number}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-md mx-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                {mode === 'create' ? (
                  <path d="M10 2L3 9h4v6h6V9h4l-7-7z" />
                ) : (
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                )}
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'create' ? '🏗️ Criar Nova Sala' : '🚪 Entrar na Sala'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'create' 
                ? 'Configure sua nova sala de reunião' 
                : 'Como você gostaria de ser chamado?'
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'join' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚪 Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'create' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏗️ Criar
            </button>
          </div>

          {/* Error Message */}
          {roomError && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-200 text-sm">{roomError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                👤 Seu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome..."
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                maxLength={30}
                autoFocus
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Mínimo 2 caracteres</span>
                <span>{name.length}/30</span>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔐 Senha da sala {mode === 'create' && <span className="text-gray-500">(opcional)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'create' ? "Deixe vazio para sala pública" : "Digite a senha da sala"}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10 10 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === 'create' && (
                <p className="mt-2 text-xs text-gray-500">
                  💡 Salas com senha são privadas. Compartilhe a senha apenas com quem deve participar.
                </p>
              )}
            </div>

            {/* Suggestion button */}
            <button
              type="button"
              onClick={() => setName(generateRandomName())}
              className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              🎲 Gerar nome aleatório
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={name.trim().length < 2 || isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'create' ? 'Criando sala...' : 'Entrando...'}
                </div>
              ) : (
                mode === 'create' ? '🏗️ Criar Sala' : '🚀 Entrar na Sala'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Seu nome será visível para outros participantes</p>
                <p className="text-blue-300/80">Você pode alterá-lo a qualquer momento durante a chamada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameModal;