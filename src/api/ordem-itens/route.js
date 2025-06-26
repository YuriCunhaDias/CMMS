async function handler({
  action,
  ordem_id,
  tipo,
  item_id,
  quantidade,
  valor_unitario,
}) {
  if (!action || !ordem_id) {
    return { error: "Ação e ID da ordem são obrigatórios" };
  }

  try {
    if (action === "adicionar") {
      if (!tipo || !item_id || !quantidade || !valor_unitario) {
        return {
          error:
            "Tipo, ID do item, quantidade e valor unitário são obrigatórios para adicionar",
        };
      }

      const valor_total = quantidade * valor_unitario;

      if (tipo === "peca") {
        const result = await sql`
          INSERT INTO ordem_pecas (ordem_id, peca_id, quantidade, valor_unitario, valor_total)
          VALUES (${ordem_id}, ${item_id}, ${quantidade}, ${valor_unitario}, ${valor_total})
          RETURNING *
        `;
        return { success: true, item: result[0] };
      } else if (tipo === "servico") {
        const result = await sql`
          INSERT INTO ordem_servicos (ordem_id, servico_id, quantidade, valor_unitario, valor_total)
          VALUES (${ordem_id}, ${item_id}, ${quantidade}, ${valor_unitario}, ${valor_total})
          RETURNING *
        `;
        return { success: true, item: result[0] };
      } else {
        return { error: 'Tipo deve ser "peca" ou "servico"' };
      }
    }

    if (action === "atualizar") {
      if (!tipo || !item_id || !quantidade || !valor_unitario) {
        return {
          error:
            "Tipo, ID do item, quantidade e valor unitário são obrigatórios para atualizar",
        };
      }

      const valor_total = quantidade * valor_unitario;

      if (tipo === "peca") {
        const result = await sql`
          UPDATE ordem_pecas 
          SET quantidade = ${quantidade}, valor_unitario = ${valor_unitario}, valor_total = ${valor_total}
          WHERE ordem_id = ${ordem_id} AND peca_id = ${item_id}
          RETURNING *
        `;
        if (result.length === 0) {
          return { error: "Peça não encontrada na ordem" };
        }
        return { success: true, item: result[0] };
      } else if (tipo === "servico") {
        const result = await sql`
          UPDATE ordem_servicos 
          SET quantidade = ${quantidade}, valor_unitario = ${valor_unitario}, valor_total = ${valor_total}
          WHERE ordem_id = ${ordem_id} AND servico_id = ${item_id}
          RETURNING *
        `;
        if (result.length === 0) {
          return { error: "Serviço não encontrado na ordem" };
        }
        return { success: true, item: result[0] };
      } else {
        return { error: 'Tipo deve ser "peca" ou "servico"' };
      }
    }

    if (action === "remover") {
      if (!tipo || !item_id) {
        return { error: "Tipo e ID do item são obrigatórios para remover" };
      }

      if (tipo === "peca") {
        const result = await sql`
          DELETE FROM ordem_pecas 
          WHERE ordem_id = ${ordem_id} AND peca_id = ${item_id}
          RETURNING *
        `;
        if (result.length === 0) {
          return { error: "Peça não encontrada na ordem" };
        }
        return { success: true, message: "Peça removida com sucesso" };
      } else if (tipo === "servico") {
        const result = await sql`
          DELETE FROM ordem_servicos 
          WHERE ordem_id = ${ordem_id} AND servico_id = ${item_id}
          RETURNING *
        `;
        if (result.length === 0) {
          return { error: "Serviço não encontrado na ordem" };
        }
        return { success: true, message: "Serviço removido com sucesso" };
      } else {
        return { error: 'Tipo deve ser "peca" ou "servico"' };
      }
    }

    if (action === "listar") {
      const [pecas, servicos] = await sql.transaction([
        sql`
          SELECT op.*, p.descricao as peca_descricao, p.unidade_medida
          FROM ordem_pecas op
          JOIN pecas p ON op.peca_id = p.id
          WHERE op.ordem_id = ${ordem_id}
          ORDER BY op.created_at
        `,
        sql`
          SELECT os.*, s.descricao as servico_descricao, s.unidade_medida
          FROM ordem_servicos os
          JOIN servicos s ON os.servico_id = s.id
          WHERE os.ordem_id = ${ordem_id}
          ORDER BY os.created_at
        `,
      ]);

      return {
        success: true,
        pecas: pecas,
        servicos: servicos,
      };
    }

    return {
      error:
        "Ação não reconhecida. Use: adicionar, atualizar, remover ou listar",
    };
  } catch (error) {
    return { error: "Erro interno do servidor: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}