"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ 
  isOpen = false, 
  onClose = () => {}, 
  onNavigate = () => {},
  searchData = {
    clientes: [],
    equipamentos: [],
    ordens: []
  }
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState({
    clientes: [],
    equipamentos: [],
    ordens: []
  });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [searchHistory, setSearchHistory] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const searchInputRef = React.useRef(null);

  const suggestions = [
    'Ordens em andamento',
    'Equipamentos com problemas',
    'Clientes ativos',
    'Manutenções preventivas',
    'Peças em falta',
    'Serviços mais solicitados'
  ];

  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          onClose();
        }
      }
      
      if (isOpen) {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const totalResults = getTotalResults();
          setSelectedIndex(prev => (prev + 1) % totalResults);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const totalResults = getTotalResults();
          setSelectedIndex(prev => prev === 0 ? totalResults - 1 : prev - 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelectResult();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex]);

  React.useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => {
        performSearch(searchTerm);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults({ clientes: [], equipamentos: [], ordens: [] });
      setShowSuggestions(true);
    }
  }, [searchTerm, searchData]);

  const performSearch = (term) => {
    const searchLower = term.toLowerCase();
    
    const filteredClientes = searchData.clientes.filter(cliente =>
      cliente.nome?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.telefone?.includes(searchLower)
    ).slice(0, 5);

    const filteredEquipamentos = searchData.equipamentos.filter(equipamento =>
      equipamento.fabricante?.toLowerCase().includes(searchLower) ||
      equipamento.modelo?.toLowerCase().includes(searchLower) ||
      equipamento.numero_serie?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    const filteredOrdens = searchData.ordens.filter(ordem =>
      ordem.numero_ordem?.toString().includes(searchLower) ||
      ordem.cliente?.toLowerCase().includes(searchLower) ||
      ordem.descricao?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    setResults({
      clientes: filteredClientes,
      equipamentos: filteredEquipamentos,
      ordens: filteredOrdens
    });
    setShowSuggestions(false);
    setSelectedIndex(0);
  };

  const getTotalResults = () => {
    return results.clientes.length + results.equipamentos.length + results.ordens.length;
  };

  const handleSelectResult = () => {
    const allResults = [
      ...results.clientes.map(item => ({ ...item, type: 'cliente' })),
      ...results.equipamentos.map(item => ({ ...item, type: 'equipamento' })),
      ...results.ordens.map(item => ({ ...item, type: 'ordem' }))
    ];

    if (allResults[selectedIndex]) {
      const selected = allResults[selectedIndex];
      addToHistory(searchTerm);
      onNavigate(selected);
      onClose();
    }
  };

  const addToHistory = (term) => {
    if (term.trim()) {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== term);
        return [term, ...filtered].slice(0, 5);
      });
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (term) => {
    setSearchTerm(term);
    setShowSuggestions(false);
  };

  const getResultIcon = (type) => {
    const icons = {
      cliente: 'fas fa-user',
      equipamento: 'fas fa-cog',
      ordem: 'fas fa-clipboard-list'
    };
    return icons[type] || 'fas fa-search';
  };

  const getResultColor = (type) => {
    const colors = {
      cliente: 'bg-green-100 text-green-600',
      equipamento: 'bg-orange-100 text-orange-600',
      ordem: 'bg-blue-100 text-blue-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 font-roboto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isLoading ? (
                <i className="fas fa-spinner fa-spin text-gray-400"></i>
              ) : (
                <i className="fas fa-search text-gray-400"></i>
              )}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar clientes, equipamentos, ordens..."
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                ESC
              </kbd>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!searchTerm.trim() && showSuggestions && (
            <div className="p-4">
              {searchHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <i className="fas fa-history mr-2"></i>
                    Buscas Recentes
                  </h3>
                  <div className="space-y-2">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(term)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <i className="fas fa-clock text-gray-400"></i>
                        <span className="text-gray-700">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <i className="fas fa-lightbulb mr-2"></i>
                  Sugestões
                </h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <i className="fas fa-search text-gray-400"></i>
                      <span className="text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {searchTerm.trim() && getTotalResults() === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-search text-3xl mb-4"></i>
              <p className="text-lg mb-2">Nenhum resultado encontrado</p>
              <p className="text-sm">Tente usar termos diferentes ou verifique a ortografia</p>
            </div>
          )}

          {searchTerm.trim() && getTotalResults() > 0 && (
            <div className="p-4 space-y-4">
              {results.clientes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <i className="fas fa-users mr-2"></i>
                    Clientes ({results.clientes.length})
                  </h3>
                  <div className="space-y-1">
                    {results.clientes.map((cliente, index) => {
                      const globalIndex = index;
                      return (
                        <button
                          key={cliente.id}
                          onClick={() => {
                            setSelectedIndex(globalIndex);
                            handleSelectResult();
                          }}
                          className={`w-full text-left px-3 py-3 rounded-lg flex items-center space-x-3 ${
                            selectedIndex === globalIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getResultColor('cliente')}`}>
                            <i className={getResultIcon('cliente')}></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{cliente.nome}</p>
                            <p className="text-sm text-gray-500">{cliente.email}</p>
                          </div>
                          <i className="fas fa-arrow-right text-gray-400"></i>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.equipamentos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <i className="fas fa-cogs mr-2"></i>
                    Equipamentos ({results.equipamentos.length})
                  </h3>
                  <div className="space-y-1">
                    {results.equipamentos.map((equipamento, index) => {
                      const globalIndex = results.clientes.length + index;
                      return (
                        <button
                          key={equipamento.id}
                          onClick={() => {
                            setSelectedIndex(globalIndex);
                            handleSelectResult();
                          }}
                          className={`w-full text-left px-3 py-3 rounded-lg flex items-center space-x-3 ${
                            selectedIndex === globalIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getResultColor('equipamento')}`}>
                            <i className={getResultIcon('equipamento')}></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{equipamento.fabricante} - {equipamento.modelo}</p>
                            <p className="text-sm text-gray-500">S/N: {equipamento.numero_serie}</p>
                          </div>
                          <i className="fas fa-arrow-right text-gray-400"></i>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.ordens.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <i className="fas fa-clipboard-list mr-2"></i>
                    Ordens de Serviço ({results.ordens.length})
                  </h3>
                  <div className="space-y-1">
                    {results.ordens.map((ordem, index) => {
                      const globalIndex = results.clientes.length + results.equipamentos.length + index;
                      return (
                        <button
                          key={ordem.id}
                          onClick={() => {
                            setSelectedIndex(globalIndex);
                            handleSelectResult();
                          }}
                          className={`w-full text-left px-3 py-3 rounded-lg flex items-center space-x-3 ${
                            selectedIndex === globalIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getResultColor('ordem')}`}>
                            <i className={getResultIcon('ordem')}></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">OS-{ordem.numero_ordem}</p>
                            <p className="text-sm text-gray-500">{ordem.cliente} - {ordem.descricao}</p>
                          </div>
                          <i className="fas fa-arrow-right text-gray-400"></i>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-gray-200 rounded">↑↓</kbd>
                <span>navegar</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-gray-200 rounded">↵</kbd>
                <span>selecionar</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-gray-200 rounded">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-gray-200 rounded">K</kbd>
              <span>para abrir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryComponent() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState(null);

  const mockData = {
    clientes: [
      { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-9999' },
      { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 88888-8888' },
      { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 77777-7777' }
    ],
    equipamentos: [
      { id: 1, fabricante: 'Siemens', modelo: 'S7-1200', numero_serie: 'SN001234' },
      { id: 2, fabricante: 'ABB', modelo: 'AC500', numero_serie: 'SN005678' },
      { id: 3, fabricante: 'Schneider', modelo: 'M340', numero_serie: 'SN009012' }
    ],
    ordens: [
      { id: 1, numero_ordem: '2025001', cliente: 'João Silva', descricao: 'Manutenção preventiva' },
      { id: 2, numero_ordem: '2025002', cliente: 'Maria Santos', descricao: 'Reparo de motor' },
      { id: 3, numero_ordem: '2025003', cliente: 'Pedro Oliveira', descricao: 'Instalação de sensor' }
    ]
  };

  const handleNavigate = (result) => {
    setSelectedResult(result);
    console.log('Navegando para:', result);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-roboto">Busca Global - Componente</h1>
        
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Controles de Teste</h2>
          <div className="space-y-4">
            <button
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Abrir Busca Global
            </button>
            
            <div className="text-sm text-gray-600">
              <p><strong>Atalho:</strong> Ctrl + K para abrir a busca</p>
              <p><strong>Navegação:</strong> Use ↑↓ para navegar, Enter para selecionar, ESC para fechar</p>
            </div>
          </div>
        </div>

        {selectedResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-green-800 mb-2">Resultado Selecionado:</h3>
            <pre className="text-sm text-green-700">{JSON.stringify(selectedResult, null, 2)}</pre>
          </div>
        )}

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Funcionalidades</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Busca em tempo real com debounce</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Resultados categorizados (Clientes, Equipamentos, Ordens)</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Navegação por teclado (↑↓, Enter, ESC)</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Atalho global Ctrl+K</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Histórico de buscas recentes</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Sugestões inteligentes</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-check text-green-500"></i>
              <span>Interface modal elegante</span>
            </li>
          </ul>
        </div>

        <MainComponent
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onNavigate={handleNavigate}
          searchData={mockData}
        />
      </div>
    </div>
  );
});
}