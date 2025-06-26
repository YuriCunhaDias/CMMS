async function handler({
  action,
  id,
  classificacao,
  descricao,
  quantidade,
  unidade_medida,
  valor_unitario,
}) {
  try {
    if (action === "create") {
      const result = await sql`
        INSERT INTO pecas (classificacao, descricao, quantidade, unidade_medida, valor_unitario)
        VALUES (${classificacao}, ${descricao}, ${
        quantidade || 0
      }, ${unidade_medida}, ${valor_unitario || 0})
        RETURNING *
      `;
      return { success: true, peca: result[0] };
    }

    if (action === "list") {
      const pecas = await sql`
        SELECT * FROM pecas 
        ORDER BY classificacao, descricao
      `;
      return { success: true, pecas };
    }

    if (action === "get") {
      if (!id) {
        return { success: false, error: "ID é obrigatório" };
      }
      const result = await sql`
        SELECT * FROM pecas WHERE id = ${id}
      `;
      if (result.length === 0) {
        return { success: false, error: "Peça não encontrada" };
      }
      return { success: true, peca: result[0] };
    }

    if (action === "update") {
      if (!id) {
        return { success: false, error: "ID é obrigatório" };
      }

      let setClauses = [];
      let values = [];
      let paramCount = 1;

      if (classificacao !== undefined) {
        setClauses.push(`classificacao = $${paramCount}`);
        values.push(classificacao);
        paramCount++;
      }
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

      const query = `UPDATE pecas SET ${setClauses.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`;
      values.push(id);

      const result = await sql(query, values);
      if (result.length === 0) {
        return { success: false, error: "Peça não encontrada" };
      }
      return { success: true, peca: result[0] };
    }

    if (action === "delete") {
      if (!id) {
        return { success: false, error: "ID é obrigatório" };
      }
      const result = await sql`
        DELETE FROM pecas WHERE id = ${id} RETURNING *
      `;
      if (result.length === 0) {
        return { success: false, error: "Peça não encontrada" };
      }
      return { success: true, message: "Peça excluída com sucesso" };
    }

    if (action === "search") {
      const searchTerm = descricao || "";
      const pecas = await sql`
        SELECT * FROM pecas 
        WHERE LOWER(descricao) LIKE LOWER(${"%" + searchTerm + "%"})
        ORDER BY classificacao, descricao
      `;
      return { success: true, pecas };
    }

    return { success: false, error: "Ação não reconhecida" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}