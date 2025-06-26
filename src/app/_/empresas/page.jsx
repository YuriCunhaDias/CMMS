"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [empresas, setEmpresas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editingEmpresa, setEditingEmpresa] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [formData, setFormData] = React.useState({
    nome: "",
    endereco: "",
    cnpj: "",
    telefone: "",
    whatsapp: "",
    email: "",
    logo_url: "",
  });
  const [logoFile, setLogoFile] = React.useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();

  React.useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/empresas");
      if (!response.ok) {
        throw new Error(`Erro ao carregar empresas: ${response.status}`);
      }
      const data = await response.json();
      setEmpresas(data.empresas || []);
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let logoUrl = formData.logo_url;

      if (logoFile) {
        const uploadResult = await upload({ file: logoFile });
        if (uploadResult.error) {
          setError("Erro ao fazer upload da logo");
          return;
        }
        logoUrl = uploadResult.url;
      }

      const dadosEmpresa = { ...formData, logo_url: logoUrl };

      const url = editingEmpresa ? "/api/empresas" : "/api/empresas";
      const method = editingEmpresa ? "PUT" : "POST";

      if (editingEmpresa) {
        dadosEmpresa.id = editingEmpresa.id;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosEmpresa),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar empresa");
      }

      await carregarEmpresas();
      fecharModal();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) {
      return;
    }

    try {
      const response = await fetch("/api/empresas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir empresa");
      }

      await carregarEmpresas();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const abrirModal = (empresa = null) => {
    setEditingEmpresa(empresa);
    setFormData(
      empresa || {
        nome: "",
        endereco: "",
        cnpj: "",
        telefone: "",
        whatsapp: "",
        email: "",
        logo_url: "",
      }
    );
    setLogoFile(null);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingEmpresa(null);
    setFormData({
      nome: "",
      endereco: "",
      cnpj: "",
      telefone: "",
      whatsapp: "",
      email: "",
      logo_url: "",
    });
    setLogoFile(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const empresasFiltradas = empresas.filter(
    (empresa) =>
      empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (empresa.cnpj && empresa.cnpj.includes(searchTerm))
  );

  const podeAdicionarEmpresa = empresas.length < 6;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Carregando empresas...</p>
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
                <i className="fas fa-building text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gerenciar Empresas
                </h1>
                <p className="text-sm text-gray-600">
                  Cadastro e gestão de empresas do sistema
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Empresas Cadastradas ({empresas.length}/6)
            </h2>
            <p className="text-gray-600 text-sm">
              Gerencie as empresas do seu sistema
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            {podeAdicionarEmpresa && (
              <button
                onClick={() => abrirModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 justify-center"
              >
                <i className="fas fa-plus"></i>
                <span>Nova Empresa</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!podeAdicionarEmpresa && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-info-circle"></i>
              <span>Limite máximo de 6 empresas atingido</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.map((empresa) => (
            <div
              key={empresa.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {empresa.logo_url ? (
                      <img
                        src={empresa.logo_url}
                        alt={`Logo da ${empresa.nome}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-building text-blue-600 text-xl"></i>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {empresa.nome}
                      </h3>
                      {empresa.cnpj && (
                        <p className="text-sm text-gray-500">
                          CNPJ: {empresa.cnpj}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModal(empresa)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(empresa.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {empresa.endereco && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-map-marker-alt w-4"></i>
                      <span>{empresa.endereco}</span>
                    </div>
                  )}

                  {empresa.telefone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-phone w-4"></i>
                      <span>{empresa.telefone}</span>
                    </div>
                  )}

                  {empresa.whatsapp && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fab fa-whatsapp w-4"></i>
                      <span>{empresa.whatsapp}</span>
                    </div>
                  )}

                  {empresa.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-envelope w-4"></i>
                      <span>{empresa.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {empresasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-building text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm
                ? "Nenhuma empresa encontrada"
                : "Nenhuma empresa cadastrada"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Tente ajustar os termos de busca"
                : "Comece adicionando sua primeira empresa"}
            </p>
            {!searchTerm && podeAdicionarEmpresa && (
              <button
                onClick={() => abrirModal()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Adicionar Primeira Empresa
              </button>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
                </h3>
                <button
                  onClick={fecharModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome da empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <textarea
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o endereço completo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="empresa@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo da Empresa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.logo_url && !logoFile && (
                  <div className="mt-2">
                    <img
                      src={formData.logo_url}
                      alt="Logo atual"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploadLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {editingEmpresa ? "Atualizar" : "Salvar"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;