async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const ordem = await sql`
        SELECT o.*, c.nome_empresa as cliente_nome, e.fabricante, e.numero_serie, emp.nome as empresa_nome
        FROM ordens_servico o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN equipamentos e ON o.equipamento_id = e.id
        LEFT JOIN empresas emp ON o.empresa_id = emp.id
        WHERE o.id = ${query.id}
      `;

      if (ordem.length === 0) {
        return null;
      }

      const [pecas, servicos, imagens, checklist] = await sql.transaction([
        sql`
          SELECT op.*, p.descricao, p.unidade_medida
          FROM ordem_pecas op
          LEFT JOIN pecas p ON op.peca_id = p.id
          WHERE op.ordem_id = ${query.id}
        `,
        sql`
          SELECT os.*, s.descricao, s.unidade_medida
          FROM ordem_servicos os
          LEFT JOIN servicos s ON os.servico_id = s.id
          WHERE os.ordem_id = ${query.id}
        `,
        sql`
          SELECT * FROM ordem_imagens
          WHERE ordem_id = ${query.id}
          ORDER BY ordem_exibicao
        `,
        sql`
          SELECT oc.*, ct.nome as template_nome
          FROM ordem_checklist oc
          LEFT JOIN checklist_templates ct ON oc.template_id = ct.id
          WHERE oc.ordem_id = ${query.id}
        `,
      ]);

      return {
        ...ordem[0],
        pecas,
        servicos,
        imagens,
        checklist: checklist[0] || null,
      };
    }

    if (query?.search) {
      const ordens = await sql`
        SELECT o.*, c.nome_empresa as cliente_nome, e.fabricante, e.numero_serie
        FROM ordens_servico o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN equipamentos e ON o.equipamento_id = e.id
        WHERE 
          o.numero_ordem::text LIKE ${"%" + query.search + "%"}
          OR LOWER(c.nome_empresa) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(e.fabricante) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(o.categoria) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(o.situacao) LIKE LOWER(${"%" + query.search + "%"})
        ORDER BY o.numero_ordem DESC
      `;
      return { ordens };
    }

    if (query?.situacao) {
      const ordens = await sql`
        SELECT o.*, c.nome_empresa as cliente_nome, e.fabricante, e.numero_serie
        FROM ordens_servico o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN equipamentos e ON o.equipamento_id = e.id
        WHERE o.situacao = ${query.situacao}
        ORDER BY o.numero_ordem DESC
      `;
      return { ordens };
    }

    const ordens = await sql`
      SELECT o.*, c.nome_empresa as cliente_nome, e.fabricante, e.numero_serie
      FROM ordens_servico o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      LEFT JOIN equipamentos e ON o.equipamento_id = e.id
      ORDER BY o.numero_ordem DESC
    `;
    return { ordens };
  }

  if (method === "POST") {
    const {
      empresa_id,
      cliente_id,
      equipamento_id,
      categoria,
      data_prevista,
      solicitacao_causa,
      descricao_atendimento,
    } = body;

    if (!empresa_id || !cliente_id || !categoria) {
      return { error: "Empresa, cliente e categoria são obrigatórios" };
    }

    const validCategorias = [
      "Manutencao",
      "Instalacao",
      "Locacao",
      "Adequacao",
      "Venda",
      "Orcamento",
      "Retrabalho",
      "Compatibilizacao",
    ];
    if (!validCategorias.includes(categoria)) {
      return { error: "Categoria inválida" };
    }

    const numeroOrdem = await sql`SELECT nextval('ordem_numero_seq') as numero`;

    const novaOrdem = await sql`
      INSERT INTO ordens_servico (
        numero_ordem, empresa_id, cliente_id, equipamento_id, categoria, 
        data_prevista, solicitacao_causa, descricao_atendimento
      )
      VALUES (
        ${numeroOrdem[0].numero}, ${empresa_id}, ${cliente_id}, ${
      equipamento_id || null
    }, 
        ${categoria}, ${data_prevista || null}, ${solicitacao_causa || null}, ${
      descricao_atendimento || null
    }
      )
      RETURNING *
    `;

    return {
      ordem: novaOrdem[0],
      message: "Ordem de serviço criada com sucesso",
    };
  }

  if (method === "PUT") {
    const {
      id,
      situacao,
      data_aprovacao,
      data_realizada,
      descricao_atendimento,
      checkin_datetime,
      checkout_datetime,
      desconto,
      assinatura_tecnico,
      nome_tecnico,
      documento_tecnico,
      assinatura_cliente,
      nome_cliente,
      documento_cliente,
    } = body;

    if (!id) {
      return { error: "ID da ordem é obrigatório" };
    }

    const validSituacoes = [
      "ORCAMENTO",
      "APROVADA",
      "EM EXECUCAO",
      "AGUARDANDO PECAS",
      "CONCLUIDA",
    ];
    if (situacao && !validSituacoes.includes(situacao)) {
      return { error: "Situação inválida" };
    }

    let updateQuery = "UPDATE ordens_servico SET ";
    let setClauses = [];
    let values = [];
    let paramCount = 1;

    if (situacao !== undefined) {
      setClauses.push(`situacao = $${paramCount}`);
      values.push(situacao);
      paramCount++;
    }

    if (data_aprovacao !== undefined) {
      setClauses.push(`data_aprovacao = $${paramCount}`);
      values.push(data_aprovacao);
      paramCount++;
    }

    if (data_realizada !== undefined) {
      setClauses.push(`data_realizada = $${paramCount}`);
      values.push(data_realizada);
      paramCount++;
    }

    if (descricao_atendimento !== undefined) {
      setClauses.push(`descricao_atendimento = $${paramCount}`);
      values.push(descricao_atendimento);
      paramCount++;
    }

    if (checkin_datetime !== undefined) {
      setClauses.push(`checkin_datetime = $${paramCount}`);
      values.push(checkin_datetime);
      paramCount++;
    }

    if (checkout_datetime !== undefined) {
      setClauses.push(`checkout_datetime = $${paramCount}`);
      values.push(checkout_datetime);
      paramCount++;
    }

    if (desconto !== undefined) {
      setClauses.push(`desconto = $${paramCount}`);
      values.push(desconto);
      paramCount++;
    }

    if (assinatura_tecnico !== undefined) {
      setClauses.push(`assinatura_tecnico = $${paramCount}`);
      values.push(assinatura_tecnico);
      paramCount++;
    }

    if (nome_tecnico !== undefined) {
      setClauses.push(`nome_tecnico = $${paramCount}`);
      values.push(nome_tecnico);
      paramCount++;
    }

    if (documento_tecnico !== undefined) {
      setClauses.push(`documento_tecnico = $${paramCount}`);
      values.push(documento_tecnico);
      paramCount++;
    }

    if (assinatura_cliente !== undefined) {
      setClauses.push(`assinatura_cliente = $${paramCount}`);
      values.push(assinatura_cliente);
      paramCount++;
    }

    if (nome_cliente !== undefined) {
      setClauses.push(`nome_cliente = $${paramCount}`);
      values.push(nome_cliente);
      paramCount++;
    }

    if (documento_cliente !== undefined) {
      setClauses.push(`documento_cliente = $${paramCount}`);
      values.push(documento_cliente);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return { error: "Nenhum campo para atualizar" };
    }

    updateQuery += setClauses.join(", ");
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const ordemAtualizada = await sql(updateQuery, values);

    if (ordemAtualizada.length === 0) {
      return { error: "Ordem de serviço não encontrada" };
    }

    return {
      ordem: ordemAtualizada[0],
      message: "Ordem de serviço atualizada com sucesso",
    };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID da ordem é obrigatório" };
    }

    await sql`DELETE FROM ordens_servico WHERE id = ${id}`;
    return { message: "Ordem de serviço removida com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}