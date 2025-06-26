async function handler({
  action,
  id,
  descricao,
  quantidade,
  unidade_medida,
  valor_unitario,
}) {
  try {
    switch (action) {
      case "list":
        const servicos = await sql`
          SELECT * FROM servicos 
          ORDER BY descricao ASC
        `;
        return { success: true, data: servicos };

      case "create":
        if (!descricao || !unidade_medida) {
          return {
            success: false,
            error: "Descrição e unidade de medida são obrigatórias",
          };
        }

        const novoServico = await sql`
          INSERT INTO servicos (descricao, quantidade, unidade_medida, valor_unitario)
          VALUES (${descricao}, ${quantidade || 1}, ${unidade_medida}, ${
          valor_unitario || 0
        })
          RETURNING *
        `;
        return { success: true, data: novoServico[0] };

      case "update":
        if (!id) {
          return { success: false, error: "ID é obrigatório para atualização" };
        }

        let updateQuery = "UPDATE servicos SET ";
        const setClauses = [];
        const values = [];
        let paramCount = 1;

        if (descricao !== undefined) {
          setClauses.push(`descricao = $${paramCount}`);
          values.push(descricao);
          paramCount++;
        }
        if (quantidade !== undefined) {
          setClauses.push(`quantidade = $${paramCount}`);
          values.push(quantidade);
          paramCount++;
        }
        if (unidade_medida !== undefined) {
          setClauses.push(`unidade_medida = $${paramCount}`);
          values.push(unidade_medida);
          paramCount++;
        }
        if (valor_unitario !== undefined) {
          setClauses.push(`valor_unitario = $${paramCount}`);
          values.push(valor_unitario);
          paramCount++;
        }

        if (setClauses.length === 0) {
          return { success: false, error: "Nenhum campo para atualizar" };
        }

        updateQuery +=
          setClauses.join(", ") + ` WHERE id = $${paramCount} RETURNING *`;
        values.push(id);

        const servicoAtualizado = await sql(updateQuery, values);
        return { success: true, data: servicoAtualizado[0] };

      case "delete":
        if (!id) {
          return { success: false, error: "ID é obrigatório para exclusão" };
        }

        await sql`DELETE FROM servicos WHERE id = ${id}`;
        return { success: true, message: "Serviço excluído com sucesso" };

      case "get":
        if (!id) {
          return { success: false, error: "ID é obrigatório" };
        }

        const servico = await sql`
          SELECT * FROM servicos WHERE id = ${id}
        `;

        if (servico.length === 0) {
          return { success: false, error: "Serviço não encontrado" };
        }

        return { success: true, data: servico[0] };

      default:
        return { success: false, error: "Ação não reconhecida" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}