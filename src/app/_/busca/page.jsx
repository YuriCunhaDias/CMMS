"use client";
import React from "react";

function MainComponent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState({
    clientes: [],
    equipamentos: [],
    ordens: [],
    pecas: [],
    servicos: [],
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [activeFilter, setActiveFilter] = React.useState("todos");
  const [searchHistory, setSearchHistory] = React.useState([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        try {
          setSearchHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Error parsing search history:", e);
          setSearchHistory([]);
        }
      }
    }
  }, []);

  const realizarBusca = async (termo) => {
    if (!termo.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const response = await fetch(
        `/api/busca-global?q=${encodeURIComponent(termo)}`
      );
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const data = await response.json();

      const normalizedData = {
        clientes: Array.isArray(data.clientes) ? data.clientes : [],
        equipamentos: Array.isArray(data.equipamentos) ? data.equipamentos : [],
        ordens: Array.isArray(data.ordens) ? data.ordens : [],
        pecas: Array.isArray(data.pecas) ? data.pecas : [],
        servicos: Array.isArray(data.servicos) ? data.servicos : [],
      };

      setSearchResults(normalizedData);

      if (typeof window !== "undefined") {
        const newHistory = [
          termo,
          ...searchHistory.filter((item) => item !== termo),
        ].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error(error);
      setError("Erro ao realizar busca. Tente novamente.");
      setSearchResults({
        clientes: [],
        equipamentos: [],
        ordens: [],
        pecas: [],
        servicos: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    realizarBusca(searchTerm);
  };

  const handleHistoryClick = (termo) => {
    setSearchTerm(termo);
    realizarBusca(termo);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchHistory");
    }
  };

  const getFilteredResults = () => {
    if (activeFilter === "todos") {
      return searchResults;
    }
    return {
      [activeFilter]: Array.isArray(searchResults[activeFilter])
        ? searchResults[activeFilter]
        : [],
    };
  };

  const getTotalResults = () => {
    return Object.values(searchResults).reduce(
      (total, items) => total + (Array.isArray(items) ? items.length : 0),
      0
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      clientes: "fas fa-users",
      equipamentos: "fas fa-cogs",
      ordens: "fas fa-clipboard-list",
      pecas: "fas fa-wrench",
      servicos: "fas fa-tools",
    };
    return icons[category] || "fas fa-search";
  };

  const getCategoryColor = (category) => {
    const colors = {
      clientes: "bg-green-500",
      equipamentos: "bg-orange-500",
      ordens: "bg-red-500",
      pecas: "bg-purple-500",
      servicos: "bg-indigo-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const getCategoryName = (category) => {
    const names = {
      clientes: "Clientes",
      equipamentos: "Equipamentos",
      ordens: "Ordens de Serviço",
      pecas: "Peças",
      servicos: "Serviços",
    };
    return names[category] || category;
  };

  const renderResultCard = (item, category) => {
    if (!item || !item.id) return null;

    return (
      <div
        key={`${category}-${item.id}`}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-4"
      >
        <div className="flex items-start space-x-3">
          <div
            className={`${getCategoryColor(
              category
            )} p-2 rounded-lg flex-shrink-0`}
          >
            <i
              className={`${getCategoryIcon(category)} text-white text-sm`}
            ></i>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {category === "clientes" &&
                  (item.nome_empresa || "Nome não informado")}
                {category === "equipamentos" &&
                  `${item.fabricante || "Fabricante"} - ${
                    item.numero_serie || "Série"
                  }`}
                {category === "ordens" && `OS #${item.numero_ordem || item.id}`}
                {category === "pecas" &&
                  (item.descricao || "Descrição não informada")}
                {category === "servicos" &&
                  (item.descricao || "Descrição não informada")}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {getCategoryName(category)}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              {category === "clientes" && (
                <>
                  {item.cnpj && (
                    <p>
                      <i className="fas fa-id-card w-4"></i> {item.cnpj}
                    </p>
                  )}
                  {item.telefone && (
                    <p>
                      <i className="fas fa-phone w-4"></i> {item.telefone}
                    </p>
                  )}
                  {item.email && (
                    <p>
                      <i className="fas fa-envelope w-4"></i> {item.email}
                    </p>
                  )}
                  {item.endereco && (
                    <p>
                      <i className="fas fa-map-marker-alt w-4"></i>{" "}
                      {item.endereco}
                    </p>
                  )}
                </>
              )}

              {category === "equipamentos" && (
                <>
                  {item.potencia && (
                    <p>
                      <i className="fas fa-bolt w-4"></i> {item.potencia}
                    </p>
                  )}
                  {item.cliente_nome && (
                    <p>
                      <i className="fas fa-user w-4"></i> {item.cliente_nome}
                    </p>
                  )}
                </>
              )}

              {category === "ordens" && (
                <>
                  {item.categoria && (
                    <p>
                      <i className="fas fa-tag w-4"></i> {item.categoria}
                    </p>
                  )}
                  {item.situacao && (
                    <p>
                      <i className="fas fa-flag w-4"></i>{" "}
                      {item.situacao.replace("_", " ")}
                    </p>
                  )}
                  {item.cliente_nome && (
                    <p>
                      <i className="fas fa-user w-4"></i> {item.cliente_nome}
                    </p>
                  )}
                  {item.data_geracao && (
                    <p>
                      <i className="fas fa-calendar w-4"></i>{" "}
                      {new Date(item.data_geracao).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </>
              )}

              {category === "pecas" && (
                <>
                  {item.classificacao && (
                    <p>
                      <i className="fas fa-folder w-4"></i> {item.classificacao}
                    </p>
                  )}
                  {item.valor_unitario && (
                    <p>
                      <i className="fas fa-dollar-sign w-4"></i>{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.valor_unitario)}
                    </p>
                  )}
                  {item.quantidade !== undefined && (
                    <p>
                      <i className="fas fa-boxes w-4"></i> {item.quantidade}{" "}
                      {item.unidade_medida || ""}
                    </p>
                  )}
                </>
              )}

              {category === "servicos" && (
                <>
                  {item.valor_unitario && (
                    <p>
                      <i className="fas fa-dollar-sign w-4"></i>{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.valor_unitario)}
                    </p>
                  )}
                  {item.unidade_medida && (
                    <p>
                      <i className="fas fa-ruler w-4"></i> {item.unidade_medida}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">ID: {item.id}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver detalhes <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredResults = getFilteredResults();
  const totalResults = getTotalResults();

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fas fa-search text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Busca Global
                </h1>
                <p className="text-sm text-gray-600">
                  Encontre qualquer item no sistema
                </p>
              </div>
            </div>
            <a
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Voltar</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite sua busca... (clientes, equipamentos, ordens, peças, serviços)"
                className="w-full pl-12 pr-20 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <i className="fas fa-search absolute left-4 top-5 text-gray-400 text-xl"></i>
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  "Buscar"
                )}
              </button>
            </div>

            {searchHistory.length > 0 && !hasSearched && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    <i className="fas fa-history mr-2"></i>
                    Buscas Recentes
                  </h3>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Limpar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((termo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHistoryClick(termo)}
                      className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
                    >
                      {termo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {hasSearched && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Resultados da Busca
                  {searchTerm && (
                    <span className="text-blue-600 ml-2">"{searchTerm}"</span>
                  )}
                </h2>
                <p className="text-gray-600 text-sm">
                  {totalResults}{" "}
                  {totalResults === 1
                    ? "resultado encontrado"
                    : "resultados encontrados"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter("todos")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "todos"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Todos ({totalResults})
                </button>

                {Object.entries(searchResults).map(
                  ([category, items]) =>
                    Array.isArray(items) &&
                    items.length > 0 && (
                      <button
                        key={category}
                        onClick={() => setActiveFilter(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeFilter === category
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {getCategoryName(category)} ({items.length})
                      </button>
                    )
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p className="text-gray-600">Buscando...</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-search text-gray-400 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente usar termos diferentes ou verifique a ortografia
                </p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Dicas de busca:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Use palavras-chave específicas</li>
                    <li>• Tente buscar por códigos ou números</li>
                    <li>• Verifique se não há erros de digitação</li>
                    <li>• Use termos mais gerais</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(filteredResults).map(
                  ([category, items]) =>
                    Array.isArray(items) &&
                    items.length > 0 && (
                      <div key={category}>
                        <div className="flex items-center space-x-3 mb-4">
                          <div
                            className={`${getCategoryColor(
                              category
                            )} p-2 rounded-lg`}
                          >
                            <i
                              className={`${getCategoryIcon(
                                category
                              )} text-white`}
                            ></i>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getCategoryName(category)} ({items.length})
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item) =>
                            renderResultCard(item, category)
                          )}
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <i className="fas fa-search text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Busca Global do Sistema
            </h3>
            <p className="text-gray-600 mb-6">
              Digite no campo acima para encontrar clientes, equipamentos,
              ordens, peças e serviços
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-2xl mx-auto">
              {[
                {
                  name: "Clientes",
                  icon: "fas fa-users",
                  color: "bg-green-500",
                },
                {
                  name: "Equipamentos",
                  icon: "fas fa-cogs",
                  color: "bg-orange-500",
                },
                {
                  name: "Ordens",
                  icon: "fas fa-clipboard-list",
                  color: "bg-red-500",
                },
                {
                  name: "Peças",
                  icon: "fas fa-wrench",
                  color: "bg-purple-500",
                },
                {
                  name: "Serviços",
                  icon: "fas fa-tools",
                  color: "bg-indigo-500",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div
                    className={`${item.color} p-3 rounded-lg mx-auto w-12 h-12 flex items-center justify-center mb-2`}
                  >
                    <i className={`${item.icon} text-white`}></i>
                  </div>
                  <p className="text-sm text-gray-600">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainComponent;