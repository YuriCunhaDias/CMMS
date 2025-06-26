"use client";
import React from "react";

function MainComponent() {
  const [dashboardData, setDashboardData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    carregarDadosDashboard();
  }, []);

  const carregarDadosDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error(
          `Erro ao carregar dados do dashboard: ${response.status}`
        );
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={carregarDadosDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const dados = dashboardData || {};
  const estatisticas = dados.estatisticas || {};
  const receitaMensal = dados.receitaMensal || [];
  const ordensRecentes = dados.ordensRecentes || [];
  const equipamentosProblematicos = dados.equipamentosProblematicos || [];
  const manutencaoPreventiva = dados.manutencaoPreventiva || [];

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Principal
                </h1>
                <p className="text-sm text-gray-600">
                  Visão geral do sistema CMMS
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ordens Abertas
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {estatisticas.ordensAbertas || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <i className="fas fa-clipboard-list text-green-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ordens Concluídas
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {estatisticas.ordensConcluidas || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <i className="fas fa-check-circle text-blue-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-600 font-medium">+8%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Receita Mensal
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatarMoeda(estatisticas.receitaMensal)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <i className="fas fa-dollar-sign text-purple-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-600 font-medium">+15%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Receita Anual
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatarMoeda(estatisticas.receitaAnual)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <i className="fas fa-chart-bar text-orange-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <i className="fas fa-arrow-up text-green-500 mr-1"></i>
              <span className="text-green-600 font-medium">+22%</span>
              <span className="text-gray-500 ml-2">vs ano anterior</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Receita Mensal
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">2025</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {receitaMensal.map((item, index) => {
                const altura = Math.max(
                  (item.valor /
                    Math.max(...receitaMensal.map((r) => r.valor))) *
                    200,
                  20
                );
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg w-full transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                      style={{ height: `${altura}px` }}
                      title={`${item.mes}: ${formatarMoeda(item.valor)}`}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">
                      {item.mes}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Ordens Recentes
              </h3>
              <a
                href="/ordens"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todas
              </a>
            </div>
            <div className="space-y-4">
              {ordensRecentes.slice(0, 5).map((ordem, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ordem.status === "aberta"
                          ? "bg-yellow-500"
                          : ordem.status === "em_andamento"
                          ? "bg-blue-500"
                          : ordem.status === "concluida"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        OS #{ordem.numero}
                      </p>
                      <p className="text-sm text-gray-600">{ordem.cliente}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatarMoeda(ordem.valor)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatarData(ordem.data)}
                    </p>
                  </div>
                </div>
              ))}
              {ordensRecentes.length === 0 && (
                <div className="text-center py-8">
                  <i className="fas fa-clipboard-list text-gray-400 text-3xl mb-2"></i>
                  <p className="text-gray-500">Nenhuma ordem recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Equipamentos Problemáticos
              </h3>
              <a
                href="/equipamentos"
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Ver todos
              </a>
            </div>
            <div className="space-y-4">
              {equipamentosProblematicos
                .slice(0, 5)
                .map((equipamento, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <i className="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {equipamento.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {equipamento.cliente}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {equipamento.problemas} problemas
                      </p>
                      <p className="text-xs text-gray-500">
                        Última falha: {formatarData(equipamento.ultimaFalha)}
                      </p>
                    </div>
                  </div>
                ))}
              {equipamentosProblematicos.length === 0 && (
                <div className="text-center py-8">
                  <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                  <p className="text-gray-500">
                    Nenhum equipamento problemático
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Manutenção Preventiva
              </h3>
              <a
                href="/equipamentos"
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Ver todos
              </a>
            </div>
            <div className="space-y-4">
              {manutencaoPreventiva.slice(0, 5).map((equipamento, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <i className="fas fa-calendar-alt text-orange-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {equipamento.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        {equipamento.cliente}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {equipamento.diasRestantes > 0
                        ? `${equipamento.diasRestantes} dias`
                        : "Vencida"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Próxima: {formatarData(equipamento.proximaManutencao)}
                    </p>
                  </div>
                </div>
              ))}
              {manutencaoPreventiva.length === 0 && (
                <div className="text-center py-8">
                  <i className="fas fa-calendar-check text-green-400 text-3xl mb-2"></i>
                  <p className="text-gray-500">Nenhuma manutenção pendente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Sistema CMMS em Funcionamento
              </h3>
              <p className="text-blue-100">
                Monitore e gerencie suas operações de manutenção em tempo real
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {estatisticas.equipamentosAtivos || 0}
                </p>
                <p className="text-sm text-blue-100">Equipamentos Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {estatisticas.clientesAtivos || 0}
                </p>
                <p className="text-sm text-blue-100">Clientes Ativos</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainComponent;