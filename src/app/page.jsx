"use client";
import React from "react";

function MainComponent() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const menuItems = [
    {
      title: "Empresas",
      icon: "fas fa-building",
      description: "Gerenciar empresas do sistema",
      color: "bg-blue-500",
      path: "./_/empresas",
    },
    {
      title: "Clientes",
      icon: "fas fa-users",
      description: "Cadastro e gestão de clientes",
      color: "bg-green-500",
      path: "/clientes",
    },
    {
      title: "Equipamentos",
      icon: "fas fa-cogs",
      description: "Controle de equipamentos",
      color: "bg-orange-500",
      path: "/equipamentos",
    },
    {
      title: "Peças",
      icon: "fas fa-wrench",
      description: "Estoque de peças e componentes",
      color: "bg-purple-500",
      path: "../api/pecas",
    },
    {
      title: "Serviços",
      icon: "fas fa-tools",
      description: "Catálogo de serviços",
      color: "bg-indigo-500",
      path: "/servicos",
    },
    {
      title: "Ordens de Serviço",
      icon: "fas fa-clipboard-list",
      description: "Gestão de ordens de serviço",
      color: "bg-red-500",
      path: "/ordens",
    },
    {
      title: "Imagens",
      icon: "fas fa-images",
      description: "Gerenciar imagens das ordens",
      color: "bg-pink-500",
      path: "/imagens",
    },
    {
      title: "Checklist",
      icon: "fas fa-check-square",
      description: "Templates de checklist",
      color: "bg-teal-500",
      path: "/checklist",
    },
    {
      title: "PDF e Backup",
      icon: "fas fa-file-pdf",
      description: "Relatórios e backup de dados",
      color: "bg-gray-600",
      path: "/pdf-backup",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fas fa-clipboard-list text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CMMS</h1>
                <p className="text-sm text-gray-600">
                  Sistema de Ordens de Serviço
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isOffline && (
                <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  <i className="fas fa-wifi text-yellow-600"></i>
                  <span>Modo Offline</span>
                </div>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Painel Principal
          </h2>
          <p className="text-gray-600">
            Selecione uma opção abaixo para gerenciar o sistema
          </p>
        </div>

        <div className={`${isMenuOpen ? "block" : "hidden"} md:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-200"
                onClick={() => {
                  console.log(`Navegando para: ${item.path}`);
                }}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`${item.color} p-3 rounded-lg`}>
                      <i className={`${item.icon} text-white text-xl`}></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Acessar módulo
                    </span>
                    <i className="fas fa-arrow-right text-gray-400"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-info-circle text-blue-600 text-xl"></i>
            <h3 className="text-lg font-semibold text-gray-900">
              Informações do Sistema
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-gray-700">Sistema funcionando</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-mobile-alt text-blue-500"></i>
              <span className="text-gray-700">Interface responsiva</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-cloud text-purple-500"></i>
              <span className="text-gray-700">Funciona offline</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Bem-vindo ao CMMS</h3>
              <p className="text-blue-100">
                Gerencie suas ordens de serviço de forma eficiente e organizada
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                Começar
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <i className="fas fa-copyright"></i>
              <span className="text-sm">
                2025 CMMS - Sistema de Ordens de Serviço
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-500">Versão 1.0</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;