"use client";
import React from "react";

function MainComponent() {
  const [dashboardData, setDashboardData] = React.useState({
    estatisticas: {
      ordens_abertas: 0,
      ordens_concluidas: 0,
      receita_mensal: 0,
      tempo_medio_resolucao: 0,
    },
    ordens_recentes: [],
    proximas_manutencoes: [],
    equipamentos_problemas: [],
    performance_mensal: [],
    loading: true,
  });
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true }));
      setError(null);

      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar dashboard: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setDashboardData({
        ...data,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar dados do dashboard");
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      aberta: "bg-yellow-100 text-yellow-800 border-yellow-200",
      em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
      concluida: "bg-green-100 text-green-800 border-green-200",
      cancelada: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      aberta: "fas fa-clock",
      em_andamento: "fas fa-cog fa-spin",
      concluida: "fas fa-check-circle",
      cancelada: "fas fa-times-circle",
    };
    return icons[status] || "fas fa-question-circle";
  };

  const getTipoManutencaoColor = (tipo) => {
    return tipo === "preventiva"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
  };

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fas fa-chart-bar text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  Métricas e indicadores do sistema
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
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
              <button
                onClick={carregarDashboard}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ordens Abertas
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.estatisticas.ordens_abertas}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-info-circle text-blue-500 mr-1"></i>
              <span className="text-gray-500">Ordens em andamento</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ordens Concluídas
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.estatisticas.ordens_concluidas}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-info-circle text-blue-500 mr-1"></i>
              <span className="text-gray-500">Total histórico</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Receita Mensal
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  R${" "}
                  {dashboardData.estatisticas.receita_mensal.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <i className="fas fa-dollar-sign text-blue-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-calendar text-blue-500 mr-1"></i>
              <span className="text-gray-500">Mês atual</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.estatisticas.tempo_medio_resolucao.toFixed(1)}{" "}
                  dias
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <i className="fas fa-stopwatch text-purple-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-info-circle text-blue-500 mr-1"></i>
              <span className="text-gray-500">Resolução de ordens</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Equipamentos com Mais Ordens
              </h3>
              <i className="fas fa-exclamation-triangle text-gray-400"></i>
            </div>
            <div className="space-y-4">
              {dashboardData.equipamentos_problemas.length > 0 ? (
                dashboardData.equipamentos_problemas
                  .slice(0, 5)
                  .map((equipamento, index) => (
                    <div
                      key={equipamento.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-cog text-red-600 text-sm"></i>
                        </div>
                        <div>
                          <span className="text-gray-700 text-sm font-medium">
                            {equipamento.fabricante} -{" "}
                            {equipamento.numero_serie}
                          </span>
                          <p className="text-xs text-gray-500">
                            {equipamento.cliente}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-red-600">
                          {equipamento.total_ordens}
                        </span>
                        <span className="text-gray-500 text-sm">ordens</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p>Nenhum equipamento com ordens recentes</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Mensal
              </h3>
              <i className="fas fa-chart-line text-gray-400"></i>
            </div>
            <div className="space-y-4">
              {dashboardData.performance_mensal.length > 0 ? (
                dashboardData.performance_mensal
                  .slice(0, 6)
                  .map((perf, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-calendar text-blue-600 text-sm"></i>
                        </div>
                        <span className="text-gray-700 text-sm">
                          {new Date(perf.mes).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600 text-sm">
                          R${" "}
                          {perf.receita.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {perf.ordens_concluidas} ordens
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p>Nenhum dado de performance disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Ordens Recentes
              </h3>
              <a
                href="/ordens"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todas <i className="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
            <div className="space-y-4">
              {dashboardData.ordens_recentes.length > 0 ? (
                dashboardData.ordens_recentes.slice(0, 5).map((ordem) => (
                  <div
                    key={ordem.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i
                          className={`${getStatusIcon(
                            ordem.situacao.toLowerCase()
                          )} text-blue-600`}
                        ></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          OS-{ordem.numero_ordem}
                        </p>
                        <p className="text-sm text-gray-600">{ordem.cliente}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          ordem.situacao.toLowerCase()
                        )}`}
                      >
                        {ordem.situacao.replace("_", " ")}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ordem.data_geracao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-clipboard-list text-2xl mb-2"></i>
                  <p>Nenhuma ordem recente</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Próximas Manutenções
              </h3>
              <a
                href="/ordens"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver agenda <i className="fas fa-calendar ml-1"></i>
              </a>
            </div>
            <div className="space-y-4">
              {dashboardData.proximas_manutencoes.length > 0 ? (
                dashboardData.proximas_manutencoes
                  .slice(0, 5)
                  .map((manutencao) => (
                    <div
                      key={manutencao.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-calendar-alt text-orange-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            OS-{manutencao.numero_ordem}
                          </p>
                          <p className="text-sm text-gray-600">
                            {manutencao.cliente}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getTipoManutencaoColor(
                            manutencao.categoria.toLowerCase()
                          )}`}
                        >
                          {manutencao.categoria}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(
                            manutencao.data_prevista
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-calendar-alt text-2xl mb-2"></i>
                  <p>Nenhuma manutenção agendada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Acesso Rápido</h3>
              <p className="text-blue-100">
                Navegue rapidamente para outras seções do sistema
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <a
                href="/ordens"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
              >
                <i className="fas fa-clipboard-list mr-2"></i>Ordens
              </a>
              <a
                href="/clientes"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
              >
                <i className="fas fa-users mr-2"></i>Clientes
              </a>
              <a
                href="/equipamentos"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
              >
                <i className="fas fa-cogs mr-2"></i>Equipamentos
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainComponent;