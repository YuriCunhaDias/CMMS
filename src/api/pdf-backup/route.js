async function handler({ action, orderId, email, backupType }) {
  try {
    if (action === "generate-pdf") {
      if (!orderId) {
        return { error: "ID da ordem é obrigatório" };
      }

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

      const [servicos, pecas, imagens, checklist] = await sql.transaction([
        sql`
          SELECT os.*, s.descricao, s.unidade_medida
          FROM ordem_servicos os
          JOIN servicos s ON os.servico_id = s.id
          WHERE os.ordem_id = ${orderId}
        `,
        sql`
          SELECT op.*, p.descricao, p.unidade_medida, p.classificacao
          FROM ordem_pecas op
          JOIN pecas p ON op.peca_id = p.id
          WHERE op.ordem_id = ${orderId}
        `,
        sql`
          SELECT * FROM ordem_imagens
          WHERE ordem_id = ${orderId}
          ORDER BY ordem_exibicao
        `,
        sql`
          SELECT oc.*, ct.nome as template_nome
          FROM ordem_checklist oc
          JOIN checklist_templates ct ON oc.template_id = ct.id
          WHERE oc.ordem_id = ${orderId}
        `,
      ]);

      const ordemData = ordem[0];
      const totalServicos = servicos.reduce(
        (sum, s) => sum + parseFloat(s.valor_total),
        0
      );
      const totalPecas = pecas.reduce(
        (sum, p) => sum + parseFloat(p.valor_total),
        0
      );
      const subtotal = totalServicos + totalPecas;
      const desconto = parseFloat(ordemData.desconto) || 0;
      const total = subtotal - desconto;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .logo { max-height: 60px; }
            .company-info { text-align: right; }
            .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; background-color: #f0f0f0; padding: 5px; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 5px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
            .signature-box { border: 1px solid #ddd; padding: 15px; min-height: 80px; }
            .checklist-item { margin-bottom: 5px; }
            .images-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
            .image-item { text-align: center; }
            .image-item img { max-width: 100%; max-height: 200px; }
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
              <strong>${ordemData.empresa_nome || ""}</strong><br>
              ${ordemData.empresa_endereco || ""}<br>
              CNPJ: ${ordemData.empresa_cnpj || ""}<br>
              Tel: ${ordemData.empresa_telefone || ""}<br>
              Email: ${ordemData.empresa_email || ""}
            </div>
          </div>

          <div class="title">ORDEM DE SERVIÇO Nº ${ordemData.numero_ordem}</div>

          <div class="section">
            <div class="section-title">INFORMAÇÕES GERAIS</div>
            <div class="info-grid">
              <div>
                <div class="info-item"><span class="label">Categoria:</span> ${
                  ordemData.categoria || ""
                }</div>
                <div class="info-item"><span class="label">Situação:</span> ${
                  ordemData.situacao || ""
                }</div>
                <div class="info-item"><span class="label">Data Geração:</span> ${
                  ordemData.data_geracao
                    ? new Date(ordemData.data_geracao).toLocaleDateString(
                        "pt-BR"
                      )
                    : ""
                }</div>
                <div class="info-item"><span class="label">Data Prevista:</span> ${
                  ordemData.data_prevista
                    ? new Date(ordemData.data_prevista).toLocaleDateString(
                        "pt-BR"
                      )
                    : ""
                }</div>
              </div>
              <div>
                <div class="info-item"><span class="label">Data Aprovação:</span> ${
                  ordemData.data_aprovacao
                    ? new Date(ordemData.data_aprovacao).toLocaleDateString(
                        "pt-BR"
                      )
                    : ""
                }</div>
                <div class="info-item"><span class="label">Data Realizada:</span> ${
                  ordemData.data_realizada
                    ? new Date(ordemData.data_realizada).toLocaleDateString(
                        "pt-BR"
                      )
                    : ""
                }</div>
                <div class="info-item"><span class="label">Check-in:</span> ${
                  ordemData.checkin_datetime
                    ? new Date(ordemData.checkin_datetime).toLocaleString(
                        "pt-BR"
                      )
                    : ""
                }</div>
                <div class="info-item"><span class="label">Check-out:</span> ${
                  ordemData.checkout_datetime
                    ? new Date(ordemData.checkout_datetime).toLocaleString(
                        "pt-BR"
                      )
                    : ""
                }</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">CLIENTE</div>
            <div class="info-grid">
              <div>
                <div class="info-item"><span class="label">Empresa:</span> ${
                  ordemData.cliente_nome || ""
                }</div>
                <div class="info-item"><span class="label">CNPJ:</span> ${
                  ordemData.cliente_cnpj || ""
                }</div>
                <div class="info-item"><span class="label">Telefone:</span> ${
                  ordemData.cliente_telefone || ""
                }</div>
              </div>
              <div>
                <div class="info-item"><span class="label">Endereço:</span> ${
                  ordemData.cliente_endereco || ""
                }</div>
                <div class="info-item"><span class="label">Email:</span> ${
                  ordemData.cliente_email || ""
                }</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">EQUIPAMENTO</div>
            <div class="info-grid">
              <div>
                <div class="info-item"><span class="label">Fabricante:</span> ${
                  ordemData.fabricante || ""
                }</div>
                <div class="info-item"><span class="label">Nº Série:</span> ${
                  ordemData.numero_serie || ""
                }</div>
                <div class="info-item"><span class="label">Fabricação:</span> ${
                  ordemData.fabricacao || ""
                }</div>
                <div class="info-item"><span class="label">Potência:</span> ${
                  ordemData.potencia || ""
                }</div>
                <div class="info-item"><span class="label">Horímetro:</span> ${
                  ordemData.horimetro || ""
                }</div>
              </div>
              <div>
                <div class="info-item"><span class="label">Motor:</span> ${
                  ordemData.motor_fabricante || ""
                } ${ordemData.motor_modelo || ""}</div>
                <div class="info-item"><span class="label">Motor Nº Série:</span> ${
                  ordemData.motor_numero_serie || ""
                }</div>
                <div class="info-item"><span class="label">Gerador:</span> ${
                  ordemData.gerador_fabricante || ""
                } ${ordemData.gerador_modelo || ""}</div>
                <div class="info-item"><span class="label">Gerador Nº Série:</span> ${
                  ordemData.gerador_numero_serie || ""
                }</div>
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
            servicos.length > 0
              ? `
          <div class="section">
            <div class="section-title">SERVIÇOS</div>
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
                    (s) => `
                  <tr>
                    <td>${s.descricao}</td>
                    <td>${s.quantidade}</td>
                    <td>${s.unidade_medida}</td>
                    <td>R$ ${parseFloat(s.valor_unitario).toFixed(2)}</td>
                    <td>R$ ${parseFloat(s.valor_total).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="4">Total Serviços</td>
                  <td>R$ ${totalServicos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            pecas.length > 0
              ? `
          <div class="section">
            <div class="section-title">PEÇAS</div>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Classificação</th>
                  <th>Qtd</th>
                  <th>Unidade</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${pecas
                  .map(
                    (p) => `
                  <tr>
                    <td>${p.descricao}</td>
                    <td>${p.classificacao}</td>
                    <td>${p.quantidade}</td>
                    <td>${p.unidade_medida}</td>
                    <td>R$ ${parseFloat(p.valor_unitario).toFixed(2)}</td>
                    <td>R$ ${parseFloat(p.valor_total).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="5">Total Peças</td>
                  <td>R$ ${totalPecas.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">RESUMO FINANCEIRO</div>
            <table>
              <tr><td>Subtotal</td><td>R$ ${subtotal.toFixed(2)}</td></tr>
              <tr><td>Desconto</td><td>R$ ${desconto.toFixed(2)}</td></tr>
              <tr class="total-row"><td>Total Geral</td><td>R$ ${total.toFixed(
                2
              )}</td></tr>
            </table>
          </div>

          ${
            checklist.length > 0
              ? `
          <div class="section">
            <div class="section-title">CHECKLIST</div>
            ${checklist
              .map(
                (c) => `
              <div>
                <strong>${c.template_nome}</strong>
                ${Object.entries(c.itens_preenchidos)
                  .map(
                    ([item, valor]) => `
                  <div class="checklist-item">• ${item}: ${valor}</div>
                `
                  )
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          ${
            imagens.length > 0
              ? `
          <div class="section">
            <div class="section-title">IMAGENS</div>
            <div class="images-grid">
              ${imagens
                .map(
                  (img) => `
                <div class="image-item">
                  <img src="${img.url_imagem}" alt="${
                    img.descricao || "Imagem"
                  }">
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

          <div class="signature-section">
            <div class="signature-box">
              <strong>TÉCNICO RESPONSÁVEL</strong><br><br>
              ${
                ordemData.assinatura_tecnico
                  ? `<img src="${ordemData.assinatura_tecnico}" style="max-height: 40px;">`
                  : ""
              }<br>
              Nome: ${ordemData.nome_tecnico || ""}<br>
              Documento: ${ordemData.documento_tecnico || ""}
            </div>
            <div class="signature-box">
              <strong>CLIENTE</strong><br><br>
              ${
                ordemData.assinatura_cliente
                  ? `<img src="${ordemData.assinatura_cliente}" style="max-height: 40px;">`
                  : ""
              }<br>
              Nome: ${ordemData.nome_cliente || ""}<br>
              Documento: ${ordemData.documento_cliente || ""}
            </div>
          </div>
        </body>
        </html>
      `;

      const pdfResponse = await fetch(
        "https://api.html-to-pdf.net/v1/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PDF_API_KEY || "demo-key"}`,
          },
          body: JSON.stringify({
            html: htmlContent,
            options: {
              format: "A4",
              margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm",
              },
              printBackground: true,
            },
          }),
        }
      );

      if (!pdfResponse.ok) {
        return { error: "Erro ao gerar PDF" };
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      const uploadResult = await upload({
        base64: `data:application/pdf;base64,${pdfBase64}`,
      });

      if (uploadResult.error) {
        return { error: "Erro ao fazer upload do PDF" };
      }

      return {
        success: true,
        pdfUrl: uploadResult.url,
        message: "PDF gerado com sucesso",
      };
    }

    if (action === "send-email") {
      if (!orderId || !email) {
        return { error: "ID da ordem e email são obrigatórios" };
      }

      const pdfResult = await handler({ action: "generate-pdf", orderId });
      if (pdfResult.error) {
        return pdfResult;
      }

      const ordem = await sql`
        SELECT numero_ordem, c.nome_empresa as cliente_nome
        FROM ordens_servico os
        LEFT JOIN clientes c ON os.cliente_id = c.id
        WHERE os.id = ${orderId}
      `;

      const emailResponse = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID || "default_service",
            template_id: process.env.EMAILJS_TEMPLATE_ID || "default_template",
            user_id: process.env.EMAILJS_USER_ID || "default_user",
            template_params: {
              to_email: email,
              subject: `Ordem de Serviço ${ordem[0]?.numero_ordem}`,
              message: `Segue em anexo a Ordem de Serviço ${ordem[0]?.numero_ordem} para ${ordem[0]?.cliente_nome}.`,
              attachment_url: pdfResult.pdfUrl,
            },
          }),
        }
      );

      if (!emailResponse.ok) {
        return { error: "Erro ao enviar email" };
      }

      return {
        success: true,
        message: "PDF enviado por email com sucesso",
        pdfUrl: pdfResult.pdfUrl,
      };
    }

    if (action === "backup") {
      const backupData = {};

      if (!backupType || backupType === "full") {
        const [
          empresas,
          clientes,
          equipamentos,
          ordens,
          servicos,
          pecas,
          templates,
        ] = await sql.transaction([
          sql`SELECT * FROM empresas ORDER BY id`,
          sql`SELECT * FROM clientes ORDER BY id`,
          sql`SELECT * FROM equipamentos ORDER BY id`,
          sql`SELECT * FROM ordens_servico ORDER BY id`,
          sql`SELECT * FROM servicos ORDER BY id`,
          sql`SELECT * FROM pecas ORDER BY id`,
          sql`SELECT * FROM checklist_templates ORDER BY id`,
        ]);

        backupData.empresas = empresas;
        backupData.clientes = clientes;
        backupData.equipamentos = equipamentos;
        backupData.ordens_servico = ordens;
        backupData.servicos = servicos;
        backupData.pecas = pecas;
        backupData.checklist_templates = templates;
      }

      if (backupType === "orders") {
        const [
          ordens,
          ordemServicos,
          ordemPecas,
          ordemImagens,
          ordemChecklist,
        ] = await sql.transaction([
          sql`SELECT * FROM ordens_servico ORDER BY id`,
          sql`SELECT * FROM ordem_servicos ORDER BY id`,
          sql`SELECT * FROM ordem_pecas ORDER BY id`,
          sql`SELECT * FROM ordem_imagens ORDER BY id`,
          sql`SELECT * FROM ordem_checklist ORDER BY id`,
        ]);

        backupData.ordens_servico = ordens;
        backupData.ordem_servicos = ordemServicos;
        backupData.ordem_pecas = ordemPecas;
        backupData.ordem_imagens = ordemImagens;
        backupData.ordem_checklist = ordemChecklist;
      }

      const backupJson = JSON.stringify(backupData, null, 2);
      const backupBase64 = Buffer.from(backupJson).toString("base64");

      const uploadResult = await upload({
        base64: `data:application/json;base64,${backupBase64}`,
      });

      if (uploadResult.error) {
        return { error: "Erro ao fazer upload do backup" };
      }

      await sql`
        INSERT INTO configuracoes (chave, valor)
        VALUES ('ultimo_backup', ${new Date().toISOString()})
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
      `;

      return {
        success: true,
        backupUrl: uploadResult.url,
        message: "Backup criado com sucesso",
        timestamp: new Date().toISOString(),
      };
    }

    if (action === "get-backup-status") {
      const config = await sql`
        SELECT valor FROM configuracoes WHERE chave = 'ultimo_backup'
      `;

      return {
        success: true,
        lastBackup: config[0]?.valor || null,
        message: config[0]?.valor
          ? `Último backup: ${new Date(config[0].valor).toLocaleString(
              "pt-BR"
            )}`
          : "Nenhum backup encontrado",
      };
    }

    return { error: "Ação não reconhecida" };
  } catch (error) {
    return { error: `Erro interno: ${error.message}` };
  }
}
export async function POST(request) {
  return handler(await request.json());
}