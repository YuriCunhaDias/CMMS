"use client";
import React from "react";

function MainComponent() {
  const [clientes, setClientes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editingCliente, setEditingCliente] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [formData, setFormData] = React.useState({
    nome_empresa: "",
    endereco: "",
    cnpj: "",
    telefone: "",
    email: "",
    contatos: [{ nome: "", telefone: "", whatsapp: "" }],
  });

  React.useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clientes");
      if (!response.ok) {
        throw new Error(`Erro ao carregar clientes: ${response.status}`);
      }
      const data = await response.json();
      setClientes(data.clientes || []);
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const url = "/api/clientes";
      const method = editingCliente ? "PUT" : "POST";

      const dadosCliente = { ...formData };
      if (editingCliente) {
        dadosCliente.id = editingCliente.id;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCliente),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar cliente");
      }

      await carregarClientes();
      fecharModal();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      const response = await fetch("/api/clientes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir cliente");
      }

      await carregarClientes();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const abrirModal = (cliente = null) => {
    setEditingCliente(cliente);
    setFormData(
      cliente
        ? {
            nome_empresa: cliente.nome_empresa || "",
            endereco: cliente.endereco || "",
            cnpj: cliente.cnpj || "",
            telefone: cliente.telefone || "",
            email: cliente.email || "",
            contatos:
              cliente.contatos && cliente.contatos.length > 0
                ? cliente.contatos
                : [{ nome: "", telefone: "", whatsapp: "" }],
          }
        : {
            nome_empresa: "",
            endereco: "",
            cnpj: "",
            telefone: "",
            email: "",
            contatos: [{ nome: "", telefone: "", whatsapp: "" }],
          }
    );
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingCliente(null);
    setFormData({
      nome_empresa: "",
      endereco: "",
      cnpj: "",
      telefone: "",
      email: "",
      contatos: [{ nome: "", telefone: "", whatsapp: "" }],
    });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContatoChange = (index, field, value) => {
    const novosContatos = [...formData.contatos];
    novosContatos[index][field] = value;
    setFormData((prev) => ({ ...prev, contatos: novosContatos }));
  };

  const adicionarContato = () => {
    setFormData((prev) => ({
      ...prev,
      contatos: [...prev.contatos, { nome: "", telefone: "", whatsapp: "" }],
    }));
  };

  const removerContato = (index) => {
    if (formData.contatos.length > 1) {
      const novosContatos = formData.contatos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, contatos: novosContatos }));
    }
  };

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.cnpj && cliente.cnpj.includes(searchTerm)) ||
      (cliente.email &&
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <header className="bg-white shadow-lg border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gerenciar Clientes
                </h1>
                <p className="text-sm text-gray-600">
                  Cadastro e gestão de clientes
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
              Clientes Cadastrados ({clientes.length})
            </h2>
            <p className="text-gray-600 text-sm">
              Gerencie os clientes do seu sistema
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            <button
              onClick={() => abrirModal()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 justify-center"
            >
              <i className="fas fa-plus"></i>
              <span>Novo Cliente</span>
            </button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-building text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {cliente.nome_empresa}
                      </h3>
                      {cliente.cnpj && (
                        <p className="text-sm text-gray-500">
                          CNPJ: {cliente.cnpj}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModal(cliente)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {cliente.endereco && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-map-marker-alt w-4"></i>
                      <span>{cliente.endereco}</span>
                    </div>
                  )}

                  {cliente.telefone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-phone w-4"></i>
                      <span>{cliente.telefone}</span>
                    </div>
                  )}

                  {cliente.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-envelope w-4"></i>
                      <span>{cliente.email}</span>
                    </div>
                  )}

                  {cliente.contatos && cliente.contatos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        CONTATOS ({cliente.contatos.length})
                      </p>
                      {cliente.contatos.slice(0, 2).map((contato, index) => (
                        <div key={index} className="text-xs text-gray-600 mb-1">
                          <i className="fas fa-user w-3"></i>
                          <span className="ml-1">{contato.nome}</span>
                          {contato.telefone && (
                            <span className="ml-2">📞 {contato.telefone}</span>
                          )}
                        </div>
                      ))}
                      {cliente.contatos.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{cliente.contatos.length - 2} contatos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {clientesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-users text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Tente ajustar os termos de busca"
                : "Comece adicionando seu primeiro cliente"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => abrirModal()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Adicionar Primeiro Cliente
              </button>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                </h3>
                <button
                  onClick={fecharModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Dados da Empresa
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      name="nome_empresa"
                      value={formData.nome_empresa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Digite o nome da empresa"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <textarea
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Digite o endereço completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="empresa@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Contatos
                  </h4>
                  <button
                    type="button"
                    onClick={adicionarContato}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Adicionar
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.contatos.map((contato, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-700">
                          Contato {index + 1}
                        </h5>
                        {formData.contatos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerContato(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                          </label>
                          <input
                            type="text"
                            value={contato.nome}
                            onChange={(e) =>
                              handleContatoChange(index, "nome", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Nome do contato"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                          </label>
                          <input
                            type="text"
                            value={contato.telefone}
                            onChange={(e) =>
                              handleContatoChange(
                                index,
                                "telefone",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="(00) 0000-0000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp
                          </label>
                          <input
                            type="text"
                            value={contato.whatsapp}
                            onChange={(e) =>
                              handleContatoChange(
                                index,
                                "whatsapp",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-save mr-2"></i>
                  {editingCliente ? "Atualizar" : "Salvar"}
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