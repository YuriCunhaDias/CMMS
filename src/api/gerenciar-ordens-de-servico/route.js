async function handler({ action, ...data }) {
  try {
    switch (action) {
      case "create":
        return await createOrdem(data);
      case "update":
        return await updateOrdem(data);
      case "list":
        return await listOrdens(data);
      case "get":
        return await getOrdem(data);
      case "delete":
        return await deleteOrdem(data);
      case "updateStatus":
        return await updateStatus(data);
      case "checkin":
        return await checkin(data);
      case "checkout":
        return await checkout(data);
      case "addSignature":
        return await addSignature(data);
      case "calculateTotal":
        return await calculateTotal(data);
      default:
        return { error: "Ação não reconhecida" };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function createOrdem(data) {
  const {
    empresa_id,
    cliente_id,
    equipamento_id,
    categoria,
    data_prevista,
    solicitacao_causa,
    descricao_atendimento,
  } = data;

  const numeroOrdem = await sql`SELECT nextval('ordem_numero_seq') as numero`;

  const result = await sql`
    INSERT INTO ordens_servico (
      numero_ordem, empresa_id, cliente_id, equipamento_id, 
      categoria, data_prevista, solicitacao_causa, descricao_atendimento
    ) VALUES (
      ${numeroOrdem[0].numero}, ${empresa_id}, ${cliente_id}, ${equipamento_id},
      ${categoria}, ${data_prevista}, ${solicitacao_causa}, ${descricao_atendimento}
    ) RETURNING *
  `;

  return { success: true, ordem: result[0] };
}

async function updateOrdem(data) {
  const { id, ...updateData } = data;

  const setClauses = [];
  const values = [];
  let paramCount = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      setClauses.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (setClauses.length === 0) {
    return { error: "Nenhum campo para atualizar" };
  }

  const query = `UPDATE ordens_servico SET ${setClauses.join(
    ", "
  )} WHERE id = $${paramCount} RETURNING *`;
  values.push(id);

  const result = await sql(query, values);

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, ordem: result[0] };
}

async function listOrdens(data) {
  const {
    situacao,
    cliente_id,
    empresa_id,
    categoria,
    limit = 50,
    offset = 0,
  } = data;

  let whereConditions = [];
  let values = [];
  let paramCount = 1;

  if (situacao) {
    whereConditions.push(`o.situacao = $${paramCount}`);
    values.push(situacao);
    paramCount++;
  }

  if (cliente_id) {
    whereConditions.push(`o.cliente_id = $${paramCount}`);
    values.push(cliente_id);
    paramCount++;
  }

  if (empresa_id) {
    whereConditions.push(`o.empresa_id = $${paramCount}`);
    values.push(empresa_id);
    paramCount++;
  }

  if (categoria) {
    whereConditions.push(`o.categoria = $${paramCount}`);
    values.push(categoria);
    paramCount++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      o.*,
      c.nome_empresa as cliente_nome,
      e.nome as empresa_nome,
      eq.fabricante as equipamento_fabricante,
      eq.numero_serie as equipamento_serie
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN empresas e ON o.empresa_id = e.id
    LEFT JOIN equipamentos eq ON o.equipamento_id = eq.id
    ${whereClause}
    ORDER BY o.numero_ordem DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);

  const ordens = await sql(query, values);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM ordens_servico o
    ${whereClause}
  `;

  const countValues = values.slice(0, -2);
  const totalResult = await sql(countQuery, countValues);

  return {
    success: true,
    ordens,
    total: parseInt(totalResult[0].total),
    limit,
    offset,
  };
}

async function getOrdem({ id }) {
  const ordem = await sql`
    SELECT 
      o.*,
      c.nome_empresa as cliente_nome,
      c.endereco as cliente_endereco,
      c.cnpj as cliente_cnpj,
      e.nome as empresa_nome,
      e.endereco as empresa_endereco,
      e.cnpj as empresa_cnpj,
      eq.fabricante as equipamento_fabricante,
      eq.numero_serie as equipamento_serie,
      eq.potencia as equipamento_potencia
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN empresas e ON o.empresa_id = e.id
    LEFT JOIN equipamentos eq ON o.equipamento_id = eq.id
    WHERE o.id = ${id}
  `;

  if (ordem.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  const [pecas, servicos, imagens, checklist] = await sql.transaction([
    sql`
      SELECT op.*, p.descricao as peca_descricao, p.unidade_medida
      FROM ordem_pecas op
      JOIN pecas p ON op.peca_id = p.id
      WHERE op.ordem_id = ${id}
    `,
    sql`
      SELECT os.*, s.descricao as servico_descricao, s.unidade_medida
      FROM ordem_servicos os
      JOIN servicos s ON os.servico_id = s.id
      WHERE os.ordem_id = ${id}
    `,
    sql`
      SELECT * FROM ordem_imagens
      WHERE ordem_id = ${id}
      ORDER BY ordem_exibicao
    `,
    sql`
      SELECT oc.*, ct.nome as template_nome
      FROM ordem_checklist oc
      JOIN checklist_templates ct ON oc.template_id = ct.id
      WHERE oc.ordem_id = ${id}
    `,
  ]);

  return {
    success: true,
    ordem: {
      ...ordem[0],
      pecas,
      servicos,
      imagens,
      checklist,
    },
  };
}

async function deleteOrdem({ id }) {
  const result =
    await sql`DELETE FROM ordens_servico WHERE id = ${id} RETURNING *`;

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, message: "Ordem excluída com sucesso" };
}

async function updateStatus({ id, situacao, data_aprovacao }) {
  const updateData = { situacao };

  if (situacao === "APROVADA" && data_aprovacao) {
    updateData.data_aprovacao = data_aprovacao;
  }

  const result = await sql`
    UPDATE ordens_servico 
    SET situacao = ${situacao}, 
        data_aprovacao = ${data_aprovacao || null}
    WHERE id = ${id} 
    RETURNING *
  `;

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, ordem: result[0] };
}

async function checkin({ id }) {
  const result = await sql`
    UPDATE ordens_servico 
    SET checkin_datetime = CURRENT_TIMESTAMP,
        situacao = 'EM EXECUCAO'
    WHERE id = ${id} 
    RETURNING *
  `;

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, ordem: result[0] };
}

async function checkout({ id, data_realizada }) {
  const result = await sql`
    UPDATE ordens_servico 
    SET checkout_datetime = CURRENT_TIMESTAMP,
        data_realizada = ${data_realizada || null},
        situacao = 'CONCLUIDA'
    WHERE id = ${id} 
    RETURNING *
  `;

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, ordem: result[0] };
}

async function addSignature(data) {
  const {
    id,
    assinatura_tecnico,
    nome_tecnico,
    documento_tecnico,
    assinatura_cliente,
    nome_cliente,
    documento_cliente,
  } = data;

  const result = await sql`
    UPDATE ordens_servico 
    SET assinatura_tecnico = ${assinatura_tecnico || null},
        nome_tecnico = ${nome_tecnico || null},
        documento_tecnico = ${documento_tecnico || null},
        assinatura_cliente = ${assinatura_cliente || null},
        nome_cliente = ${nome_cliente || null},
        documento_cliente = ${documento_cliente || null}
    WHERE id = ${id} 
    RETURNING *
  `;

  if (result.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  return { success: true, ordem: result[0] };
}

async function calculateTotal({ id }) {
  const [pecasTotal, servicosTotal] = await sql.transaction([
    sql`
      SELECT COALESCE(SUM(valor_total), 0) as total
      FROM ordem_pecas
      WHERE ordem_id = ${id}
    `,
    sql`
      SELECT COALESCE(SUM(valor_total), 0) as total
      FROM ordem_servicos
      WHERE ordem_id = ${id}
    `,
  ]);

  const ordem = await sql`
    SELECT desconto FROM ordens_servico WHERE id = ${id}
  `;

  if (ordem.length === 0) {
    return { error: "Ordem não encontrada" };
  }

  const subtotal =
    parseFloat(pecasTotal[0].total) + parseFloat(servicosTotal[0].total);
  const desconto = parseFloat(ordem[0].desconto) || 0;
  const total = subtotal - desconto;

  return {
    success: true,
    calculo: {
      subtotal_pecas: parseFloat(pecasTotal[0].total),
      subtotal_servicos: parseFloat(servicosTotal[0].total),
      subtotal,
      desconto,
      total,
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}