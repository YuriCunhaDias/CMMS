async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const peca = await sql`SELECT * FROM pecas WHERE id = ${query.id}`;
      return peca.length > 0 ? peca[0] : null;
    }

    if (query?.search) {
      const pecas = await sql`
        SELECT * FROM pecas 
        WHERE 
          LOWER(descricao) LIKE LOWER(${"%" + query.search + "%"}) 
          OR LOWER(classificacao) LIKE LOWER(${"%" + query.search + "%"})
        ORDER BY classificacao, descricao
      `;
      return { pecas };
    }

    if (query?.classificacao) {
      const pecas = await sql`
        SELECT * FROM pecas 
        WHERE classificacao = ${query.classificacao}
        ORDER BY descricao
      `;
      return { pecas };
    }

    const pecas =
      await sql`SELECT * FROM pecas ORDER BY classificacao, descricao`;
    return { pecas };
  }

  if (method === "POST") {
    const {
      classificacao,
      descricao,
      quantidade,
      unidade_medida,
      valor_unitario,
    } = body;

    if (!classificacao || !descricao) {
      return { error: "Classificação e descrição são obrigatórios" };
    }

    const validClassificacoes = ["mecanica", "eletrica", "eletronica"];
    if (!validClassificacoes.includes(classificacao)) {
      return {
        error: "Classificação deve ser: mecanica, eletrica ou eletronica",
      };
    }

    const validUnidades = ["unidade", "peca", "metro", "kilo", "kit"];
    if (unidade_medida && !validUnidades.includes(unidade_medida)) {
      return {
        error: "Unidade de medida deve ser: unidade, peca, metro, kilo ou kit",
      };
    }

    const novaPeca = await sql`
      INSERT INTO pecas (classificacao, descricao, quantidade, unidade_medida, valor_unitario)
      VALUES (${classificacao}, ${descricao}, ${quantidade || 0}, ${
      unidade_medida || "unidade"
    }, ${valor_unitario || 0})
      RETURNING *
    `;

    return { peca: novaPeca[0], message: "Peça criada com sucesso" };
  }

  if (method === "PUT") {
    const {
      id,
      classificacao,
      descricao,
      quantidade,
      unidade_medida,
      valor_unitario,
    } = body;

    if (!id || !classificacao || !descricao) {
      return { error: "ID, classificação e descrição são obrigatórios" };
    }

    const validClassificacoes = ["mecanica", "eletrica", "eletronica"];
    if (!validClassificacoes.includes(classificacao)) {
      return {
        error: "Classificação deve ser: mecanica, eletrica ou eletronica",
      };
    }

    const validUnidades = ["unidade", "peca", "metro", "kilo", "kit"];
    if (unidade_medida && !validUnidades.includes(unidade_medida)) {
      return {
        error: "Unidade de medida deve ser: unidade, peca, metro, kilo ou kit",
      };
    }

    const pecaAtualizada = await sql`
      UPDATE pecas 
      SET classificacao = ${classificacao}, descricao = ${descricao}, 
          quantidade = ${quantidade || 0}, unidade_medida = ${
      unidade_medida || "unidade"
    }, 
          valor_unitario = ${valor_unitario || 0}
      WHERE id = ${id}
      RETURNING *
    `;

    if (pecaAtualizada.length === 0) {
      return { error: "Peça não encontrada" };
    }

    return { peca: pecaAtualizada[0], message: "Peça atualizada com sucesso" };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID da peça é obrigatório" };
    }

    await sql`DELETE FROM pecas WHERE id = ${id}`;
    return { message: "Peça removida com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}