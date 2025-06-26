async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const servico = await sql`SELECT * FROM servicos WHERE id = ${query.id}`;
      return servico.length > 0 ? servico[0] : null;
    }

    if (query?.search) {
      const servicos = await sql`
        SELECT * FROM servicos 
        WHERE 
          LOWER(descricao) LIKE LOWER(${"%" + query.search + "%"}) 
          OR LOWER(unidade_medida) LIKE LOWER(${"%" + query.search + "%"})
        ORDER BY descricao
      `;
      return { servicos };
    }

    if (query?.unidade_medida) {
      const servicos = await sql`
        SELECT * FROM servicos 
        WHERE unidade_medida = ${query.unidade_medida}
        ORDER BY descricao
      `;
      return { servicos };
    }

    const servicos = await sql`SELECT * FROM servicos ORDER BY descricao`;
    return { servicos };
  }

  if (method === "POST") {
    const { descricao, quantidade, unidade_medida, valor_unitario } = body;

    if (!descricao) {
      return { error: "Descrição é obrigatória" };
    }

    const validUnidades = ["unidade", "hora", "diaria", "pedagio", "km"];
    if (unidade_medida && !validUnidades.includes(unidade_medida)) {
      return {
        error:
          "Unidade de medida deve ser: unidade, hora, diaria, pedagio ou km",
      };
    }

    const novoServico = await sql`
      INSERT INTO servicos (descricao, quantidade, unidade_medida, valor_unitario)
      VALUES (${descricao}, ${quantidade || 1}, ${
      unidade_medida || "unidade"
    }, ${valor_unitario || 0})
      RETURNING *
    `;

    return { servico: novoServico[0], message: "Serviço criado com sucesso" };
  }

  if (method === "PUT") {
    const { id, descricao, quantidade, unidade_medida, valor_unitario } = body;

    if (!id || !descricao) {
      return { error: "ID e descrição são obrigatórios" };
    }

    const validUnidades = ["unidade", "hora", "diaria", "pedagio", "km"];
    if (unidade_medida && !validUnidades.includes(unidade_medida)) {
      return {
        error:
          "Unidade de medida deve ser: unidade, hora, diaria, pedagio ou km",
      };
    }

    const servicoAtualizado = await sql`
      UPDATE servicos 
      SET descricao = ${descricao}, quantidade = ${quantidade || 1}, 
          unidade_medida = ${unidade_medida || "unidade"}, valor_unitario = ${
      valor_unitario || 0
    }
      WHERE id = ${id}
      RETURNING *
    `;

    if (servicoAtualizado.length === 0) {
      return { error: "Serviço não encontrado" };
    }

    return {
      servico: servicoAtualizado[0],
      message: "Serviço atualizado com sucesso",
    };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID do serviço é obrigatório" };
    }

    await sql`DELETE FROM servicos WHERE id = ${id}`;
    return { message: "Serviço removido com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}