import { useState } from 'react';

const LayoutSelector = ({ currentLayout, onLayoutChange, isOpen, onClose }) => {
  const layouts = [
    {
      id: 'grid',
      name: 'Grid',
      description: 'Grade padrão com todos os participantes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 11a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM10 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM10 11a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
        </svg>
      )
    },
    {
      id: 'speaker',
      name: 'Apresentação',
      description: 'Foco no apresentador principal',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      )
    },
    {
      id: 'sidebar',
      name: 'Barra Lateral',
      description: 'Vídeos na lateral, chat central',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm12 1H9v10h6V5z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'theater',
      name: 'Teatro',
      description: 'Tela cheia sem distrações',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4v4h10V8H5z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Layout da Sala</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => {
                onLayoutChange(layout.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentLayout === layout.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                currentLayout === layout.id
                  ? 'bg-blue-500'
                  : 'bg-gray-700'
              }`}>
                {layout.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{layout.name}</div>
                <div className={`text-sm ${
                  currentLayout === layout.id
                    ? 'text-blue-100'
                    : 'text-gray-400'
                }`}>
                  {layout.description}
                </div>
              </div>
              {currentLayout === layout.id && (
                <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Use F11 para tela cheia do navegador</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSelector;