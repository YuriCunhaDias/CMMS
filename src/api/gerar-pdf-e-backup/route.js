async function handler({ action, orderId, backupType }) {
  if (action === "generatePDF") {
    if (!orderId) {
      return { error: "ID da ordem é obrigatório" };
    }

    try {
      const ordem = await sql`
        SELECT 
          os.*,
          e.nome as empresa_nome, e.endereco as empresa_endereco, e.cnpj as empresa_cnpj,
          e.telefone as empresa_telefone, e.email as empresa_email, e.logo_url,
          c.nome_empresa as cliente_nome, c.endereco as cliente_endereco, c.cnpj as cliente_cnpj,
          c.telefone as cliente_telefone, c.email as cliente_email,
          eq.fabricante, eq.numero_serie, eq.fabricacao, eq.potencia, eq.horimetro,
          eq.motor_fabricante, eq.motor_modelo, eq.motor_numero_serie,
          eq.gerador_fabricante, eq.gerador_modelo, eq.gerador_numero_serie
        FROM ordens_servico os
        LEFT JOIN empresas e ON os.empresa_id = e.id
        LEFT JOIN clientes c ON os.cliente_id = c.id
        LEFT JOIN equipamentos eq ON os.equipamento_id = eq.id
        WHERE os.id = ${orderId}
      `;

      if (ordem.length === 0) {
        return { error: "Ordem de serviço não encontrada" };
      }

      const [pecas, servicos, imagens] = await sql.transaction([
        sql`
          SELECT op.*, p.descricao, p.unidade_medida
          FROM ordem_pecas op
          JOIN pecas p ON op.peca_id = p.id
          WHERE op.ordem_id = ${orderId}
          ORDER BY p.descricao
        `,
        sql`
          SELECT os.*, s.descricao, s.unidade_medida
          FROM ordem_servicos os
          JOIN servicos s ON os.servico_id = s.id
          WHERE os.ordem_id = ${orderId}
          ORDER BY s.descricao
        `,
        sql`
          SELECT url_imagem, descricao, ordem_exibicao
          FROM ordem_imagens
          WHERE ordem_id = ${orderId}
          ORDER BY ordem_exibicao, id
        `,
      ]);

      const ordemData = ordem[0];

      const totalPecas = pecas.reduce(
        (sum, peca) => sum + parseFloat(peca.valor_total),
        0
      );
      const totalServicos = servicos.reduce(
        (sum, servico) => sum + parseFloat(servico.valor_total),
        0
      );
      const subtotal = totalPecas + totalServicos;
      const desconto = parseFloat(ordemData.desconto) || 0;
      const total = subtotal - desconto;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { max-height: 60px; }
            .company-info { text-align: right; }
            .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; background-color: #f0f0f0; padding: 5px; border: 1px solid #ccc; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-box { border: 1px solid #ccc; padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .images { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
            .image-item { text-align: center; }
            .image-item img { max-width: 100%; max-height: 200px; border: 1px solid #ccc; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
            .signature-box { border: 1px solid #ccc; padding: 20px; text-align: center; min-height: 80px; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${
                ordemData.logo_url
                  ? `<img src="${ordemData.logo_url}" class="logo" alt="Logo">`
                  : ""
              }
            </div>
            <div class="company-info">
              <strong>${ordemData.empresa_nome || "Empresa"}</strong><br>
              ${ordemData.empresa_endereco || ""}<br>
              CNPJ: ${ordemData.empresa_cnpj || ""}<br>
              Tel: ${ordemData.empresa_telefone || ""}<br>
              Email: ${ordemData.empresa_email || ""}
            </div>
          </div>

          <div class="title">ORDEM DE SERVIÇO Nº ${ordemData.numero_ordem}</div>

          <div class="info-grid">
            <div class="info-box">
              <div class="section-title">DADOS DO CLIENTE</div>
              <strong>Empresa:</strong> ${ordemData.cliente_nome || ""}<br>
              <strong>Endereço:</strong> ${ordemData.cliente_endereco || ""}<br>
              <strong>CNPJ:</strong> ${ordemData.cliente_cnpj || ""}<br>
              <strong>Telefone:</strong> ${ordemData.cliente_telefone || ""}<br>
              <strong>Email:</strong> ${ordemData.cliente_email || ""}
            </div>
            <div class="info-box">
              <div class="section-title">DADOS DA ORDEM</div>
              <strong>Categoria:</strong> ${ordemData.categoria || ""}<br>
              <strong>Situação:</strong> ${ordemData.situacao || ""}<br>
              <strong>Data Geração:</strong> ${
                ordemData.data_geracao
                  ? new Date(ordemData.data_geracao).toLocaleDateString("pt-BR")
                  : ""
              }<br>
              <strong>Data Prevista:</strong> ${
                ordemData.data_prevista
                  ? new Date(ordemData.data_prevista).toLocaleDateString(
                      "pt-BR"
                    )
                  : ""
              }<br>
              <strong>Data Realizada:</strong> ${
                ordemData.data_realizada
                  ? new Date(ordemData.data_realizada).toLocaleDateString(
                      "pt-BR"
                    )
                  : ""
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">DADOS DO EQUIPAMENTO</div>
            <div class="info-grid">
              <div>
                <strong>Fabricante:</strong> ${ordemData.fabricante || ""}<br>
                <strong>Número de Série:</strong> ${
                  ordemData.numero_serie || ""
                }<br>
                <strong>Ano Fabricação:</strong> ${
                  ordemData.fabricacao || ""
                }<br>
                <strong>Potência:</strong> ${ordemData.potencia || ""}<br>
                <strong>Horímetro:</strong> ${ordemData.horimetro || ""}
              </div>
              <div>
                <strong>Motor:</strong> ${ordemData.motor_fabricante || ""} ${
        ordemData.motor_modelo || ""
      }<br>
                <strong>Série Motor:</strong> ${
                  ordemData.motor_numero_serie || ""
                }<br>
                <strong>Gerador:</strong> ${
                  ordemData.gerador_fabricante || ""
                } ${ordemData.gerador_modelo || ""}<br>
                <strong>Série Gerador:</strong> ${
                  ordemData.gerador_numero_serie || ""
                }
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">SOLICITAÇÃO/CAUSA</div>
            <p>${ordemData.solicitacao_causa || ""}</p>
          </div>

          <div class="section">
            <div class="section-title">DESCRIÇÃO DO ATENDIMENTO</div>
            <p>${ordemData.descricao_atendimento || ""}</p>
          </div>

          ${
            pecas.length > 0
              ? `
          <div class="section">
            <div class="section-title">PEÇAS UTILIZADAS</div>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Unidade</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${pecas
                  .map(
                    (peca) => `
                  <tr>
                    <td>${peca.descricao}</td>
                    <td class="text-center">${peca.quantidade}</td>
                    <td class="text-center">${peca.unidade_medida}</td>
                    <td class="text-right">R$ ${parseFloat(
                      peca.valor_unitario
                    ).toFixed(2)}</td>
                    <td class="text-right">R$ ${parseFloat(
                      peca.valor_total
                    ).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="4">TOTAL PEÇAS</td>
                  <td class="text-right">R$ ${totalPecas.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            servicos.length > 0
              ? `
          <div class="section">
            <div class="section-title">SERVIÇOS EXECUTADOS</div>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Unidade</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${servicos
                  .map(
                    (servico) => `
                  <tr>
                    <td>${servico.descricao}</td>
                    <td class="text-center">${servico.quantidade}</td>
                    <td class="text-center">${servico.unidade_medida}</td>
                    <td class="text-right">R$ ${parseFloat(
                      servico.valor_unitario
                    ).toFixed(2)}</td>
                    <td class="text-right">R$ ${parseFloat(
                      servico.valor_total
                    ).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="4">TOTAL SERVIÇOS</td>
                  <td class="text-right">R$ ${totalServicos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <div class="section">
            <table>
              <tr>
                <td colspan="4"><strong>SUBTOTAL</strong></td>
                <td class="text-right"><strong>R$ ${subtotal.toFixed(
                  2
                )}</strong></td>
              </tr>
              ${
                desconto > 0
                  ? `
              <tr>
                <td colspan="4"><strong>DESCONTO</strong></td>
                <td class="text-right"><strong>R$ ${desconto.toFixed(
                  2
                )}</strong></td>
              </tr>
              `
                  : ""
              }
              <tr class="total-row">
                <td colspan="4"><strong>TOTAL GERAL</strong></td>
                <td class="text-right"><strong>R$ ${total.toFixed(
                  2
                )}</strong></td>
              </tr>
            </table>
          </div>

          ${
            imagens.length > 0
              ? `
          <div class="page-break">
            <div class="section-title">IMAGENS</div>
            <div class="images">
              ${imagens
                .map(
                  (img) => `
                <div class="image-item">
                  <img src="${img.url_imagem}" alt="Imagem">
                  ${img.descricao ? `<p>${img.descricao}</p>` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <div class="signatures">
            <div class="signature-box">
              ${
                ordemData.assinatura_tecnico
                  ? `<img src="${ordemData.assinatura_tecnico}" style="max-height: 60px;">`
                  : ""
              }
              <hr>
              <strong>TÉCNICO RESPONSÁVEL</strong><br>
              ${ordemData.nome_tecnico || ""}<br>
              ${ordemData.documento_tecnico || ""}
            </div>
            <div class="signature-box">
              ${
                ordemData.assinatura_cliente
                  ? `<img src="${ordemData.assinatura_cliente}" style="max-height: 60px;">`
                  : ""
              }
              <hr>
              <strong>CLIENTE</strong><br>
              ${ordemData.nome_cliente || ""}<br>
              ${ordemData.documento_cliente || ""}
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await fetch("https://api.htmlcsstoimage.com/v1/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HTMLCSS_API_KEY || "demo-key"}`,
        },
        body: JSON.stringify({
          html: htmlContent,
          css: "",
          format: "pdf",
          width: 794,
          height: 1123,
          device_scale_factor: 2,
        }),
      });

      if (!response.ok) {
        return { error: "Erro ao gerar PDF" };
      }

      const result = await response.json();

      return {
        success: true,
        pdfUrl: result.url,
        message: "PDF gerado com sucesso",
      };
    } catch (error) {
      return { error: "Erro interno: " + error.message };
    }
  }

  if (action === "backup") {
    try {
      const backupData = {};

      if (!backupType || backupType === "all" || backupType === "empresas") {
        backupData.empresas = await sql`SELECT * FROM empresas ORDER BY id`;
      }

      if (!backupType || backupType === "all" || backupType === "clientes") {
        const [clientes, contatos] = await sql.transaction([
          sql`SELECT * FROM clientes ORDER BY id`,
          sql`SELECT * FROM contatos_cliente ORDER BY cliente_id, id`,
        ]);
        backupData.clientes = clientes;
        backupData.contatos_cliente = contatos;
      }

      if (
        !backupType ||
        backupType === "all" ||
        backupType === "equipamentos"
      ) {
        backupData.equipamentos =
          await sql`SELECT * FROM equipamentos ORDER BY cliente_id, id`;
      }

      if (!backupType || backupType === "all" || backupType === "pecas") {
        backupData.pecas =
          await sql`SELECT * FROM pecas ORDER BY classificacao, descricao`;
      }

      if (!backupType || backupType === "all" || backupType === "servicos") {
        backupData.servicos =
          await sql`SELECT * FROM servicos ORDER BY descricao`;
      }

      if (!backupType || backupType === "all" || backupType === "ordens") {
        const [
          ordens,
          ordemPecas,
          ordemServicos,
          ordemImagens,
          ordemChecklist,
        ] = await sql.transaction([
          sql`SELECT * FROM ordens_servico ORDER BY numero_ordem DESC`,
          sql`SELECT * FROM ordem_pecas ORDER BY ordem_id, id`,
          sql`SELECT * FROM ordem_servicos ORDER BY ordem_id, id`,
          sql`SELECT * FROM ordem_imagens ORDER BY ordem_id, ordem_exibicao, id`,
          sql`SELECT * FROM ordem_checklist ORDER BY ordem_id, id`,
        ]);
        backupData.ordens_servico = ordens;
        backupData.ordem_pecas = ordemPecas;
        backupData.ordem_servicos = ordemServicos;
        backupData.ordem_imagens = ordemImagens;
        backupData.ordem_checklist = ordemChecklist;
      }

      if (!backupType || backupType === "all" || backupType === "templates") {
        backupData.checklist_templates =
          await sql`SELECT * FROM checklist_templates ORDER BY nome`;
      }

      if (
        !backupType ||
        backupType === "all" ||
        backupType === "configuracoes"
      ) {
        backupData.configuracoes =
          await sql`SELECT * FROM configuracoes ORDER BY chave`;
      }

      const backupJson = JSON.stringify(backupData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-cmms-${
        backupType || "completo"
      }-${timestamp}.json`;

      const blob = new Blob([backupJson], { type: "application/json" });
      const buffer = await blob.arrayBuffer();

      const uploadResult = await upload({ buffer });

      if (uploadResult.error) {
        return {
          error: "Erro ao fazer upload do backup: " + uploadResult.error,
        };
      }

      return {
        success: true,
        backupUrl: uploadResult.url,
        filename: filename,
        size: backupJson.length,
        timestamp: new Date().toISOString(),
        message: "Backup gerado com sucesso",
      };
    } catch (error) {
      return { error: "Erro ao gerar backup: " + error.message };
    }
  }

  return {
    error: 'Ação não especificada. Use action: "generatePDF" ou "backup"',
    availableActions: ["generatePDF", "backup"],
  };
}
export async function POST(request) {
  return handler(await request.json());
}