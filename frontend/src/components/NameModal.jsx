import { useState } from 'react';

const NameModal = ({ isOpen, onEnter }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    
    setIsLoading(true);
    await onEnter(name.trim());
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
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Speed Room!</h2>
            <p className="text-gray-400 text-sm">Como você gostaria de ser chamado?</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
                  Entrando...
                </div>
              ) : (
                '🚀 Entrar na Sala'
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