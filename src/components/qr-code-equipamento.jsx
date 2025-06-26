"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ 
  equipamentos = [],
  onEquipamentoSelect = () => {},
  selectedEquipamento = null,
  qrSize = 256,
  onSizeChange = () => {},
  className = ""
}) {
  const [qrCodeData, setQrCodeData] = React.useState('');
  const [qrCodeImage, setQrCodeImage] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);

  const sizeOptions = [
    { value: 128, label: 'Pequeno (128px)' },
    { value: 256, label: 'Médio (256px)' },
    { value: 512, label: 'Grande (512px)' },
    { value: 1024, label: 'Extra Grande (1024px)' }
  ];

  React.useEffect(() => {
    if (selectedEquipamento) {
      const data = JSON.stringify({
        id: selectedEquipamento.id,
        fabricante: selectedEquipamento.fabricante,
        modelo: selectedEquipamento.modelo,
        numero_serie: selectedEquipamento.numero_serie,
        cliente: selectedEquipamento.cliente,
        tipo: 'equipamento',
        timestamp: new Date().toISOString()
      });
      setQrCodeData(data);
      setShowPreview(true);
    } else {
      setQrCodeData('');
      setQrCodeImage('');
      setShowPreview(false);
    }
  }, [selectedEquipamento]);

  const generateQRCode = async () => {
    if (!qrCodeData) return;

    setIsGenerating(true);
    setError('');

    try {
      const encodedData = encodeURIComponent(qrCodeData);
      const response = await fetch(`/integrations/qr-code/generatebasicbase64?data=${encodedData}&size=${qrSize}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar QR Code: ${response.status} ${response.statusText}`);
      }

      const base64Image = await response.text();
      setQrCodeImage(`data:image/png;base64,${base64Image}`);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      setError('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-equipamento-${selectedEquipamento?.numero_serie || 'equipamento'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrCodeImage) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${selectedEquipamento?.fabricante} ${selectedEquipamento?.modelo}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .equipment-info {
              margin-bottom: 20px;
              text-align: left;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }
            .qr-image {
              margin: 20px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h2>QR Code do Equipamento</h2>
          <div class="equipment-info">
            <p><strong>Fabricante:</strong> ${selectedEquipamento?.fabricante}</p>
            <p><strong>Modelo:</strong> ${selectedEquipamento?.modelo}</p>
            <p><strong>Número de Série:</strong> ${selectedEquipamento?.numero_serie}</p>
            <p><strong>Cliente:</strong> ${selectedEquipamento?.cliente}</p>
          </div>
          <div class="qr-image">
            <img src="${qrCodeImage}" alt="QR Code do Equipamento" />
          </div>
          <p><small>Gerado em: ${new Date().toLocaleString('pt-BR')}</small></p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 font-roboto ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <i className="fas fa-qrcode mr-3 text-blue-600"></i>
          Gerador de QR Code para Equipamentos
        </h2>
        <p className="text-gray-600">
          Gere QR Codes para identificação rápida de equipamentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Equipamento
            </label>
            <select
              value={selectedEquipamento?.id || ''}
              onChange={(e) => {
                const equipamento = equipamentos.find(eq => eq.id === parseInt(e.target.value));
                onEquipamentoSelect(equipamento);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um equipamento...</option>
              {equipamentos.map(equipamento => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.fabricante} - {equipamento.modelo} (S/N: {equipamento.numero_serie})
                </option>
              ))}
            </select>
          </div>

          {selectedEquipamento && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <i className="fas fa-info-circle mr-2 text-blue-600"></i>
                Informações do Equipamento
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">{selectedEquipamento.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fabricante:</span>
                  <span className="font-medium">{selectedEquipamento.fabricante}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modelo:</span>
                  <span className="font-medium">{selectedEquipamento.modelo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Série:</span>
                  <span className="font-medium">{selectedEquipamento.numero_serie}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{selectedEquipamento.cliente}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho do QR Code
            </label>
            <select
              value={qrSize}
              onChange={(e) => onSizeChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showPreview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <i className="fas fa-eye mr-2"></i>
                Preview dos Dados
              </h4>
              <div className="text-xs text-blue-800 bg-blue-100 rounded p-2 font-mono break-all">
                {qrCodeData}
              </div>
            </div>
          )}

          <button
            onClick={generateQRCode}
            disabled={!selectedEquipamento || isGenerating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Gerando QR Code...
              </>
            ) : (
              <>
                <i className="fas fa-qrcode mr-2"></i>
                Gerar QR Code
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {qrCodeImage ? (
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 mr-2"></i>
                QR Code Gerado
              </h3>
              
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 inline-block">
                <img
                  src={qrCodeImage}
                  alt="QR Code do Equipamento"
                  className="mx-auto"
                  style={{ width: `${Math.min(qrSize, 400)}px`, height: `${Math.min(qrSize, 400)}px` }}
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download PNG
                </button>
                
                <button
                  onClick={printQRCode}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-print mr-2"></i>
                  Imprimir
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>Tamanho: {qrSize}x{qrSize} pixels</p>
                <p>Formato: PNG</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <i className="fas fa-qrcode text-6xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum QR Code Gerado
              </h3>
              <p className="text-gray-600">
                Selecione um equipamento e clique em "Gerar QR Code" para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryComponent() {
  const [selectedEquipamento, setSelectedEquipamento] = React.useState(null);
  const [qrSize, setQrSize] = React.useState(256);

  const mockEquipamentos = [
    {
      id: 1,
      fabricante: 'Siemens',
      modelo: 'S7-1200',
      numero_serie: 'SN001234567',
      cliente: 'Indústria ABC Ltda'
    },
    {
      id: 2,
      fabricante: 'ABB',
      modelo: 'AC500-eCo',
      numero_serie: 'SN987654321',
      cliente: 'Metalúrgica XYZ S.A.'
    },
    {
      id: 3,
      fabricante: 'Schneider Electric',
      modelo: 'Modicon M340',
      numero_serie: 'SN456789123',
      cliente: 'Automação Industrial'
    },
    {
      id: 4,
      fabricante: 'Rockwell',
      modelo: 'CompactLogix 5370',
      numero_serie: 'SN789123456',
      cliente: 'Fábrica de Componentes'
    }
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-roboto">
            QR Code para Equipamentos - Componente
          </h1>
          <p className="text-gray-600">
            Demonstração do componente de geração de QR Codes para equipamentos
          </p>
        </div>

        <MainComponent
          equipamentos={mockEquipamentos}
          selectedEquipamento={selectedEquipamento}
          onEquipamentoSelect={setSelectedEquipamento}
          qrSize={qrSize}
          onSizeChange={setQrSize}
        />

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Seleção de equipamento via dropdown</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Preview das informações codificadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Geração de QR Code via API</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Múltiplos tamanhos disponíveis</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Download como imagem PNG</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Impressão com layout formatado</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Dados estruturados em JSON</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Interface responsiva</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Dados Codificados no QR Code
          </h3>
          <div className="text-sm text-blue-800">
            <p className="mb-2">O QR Code contém as seguintes informações em formato JSON:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ID do equipamento</li>
              <li>Fabricante</li>
              <li>Modelo</li>
              <li>Número de série</li>
              <li>Cliente proprietário</li>
              <li>Tipo (equipamento)</li>
              <li>Timestamp de geração</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
}