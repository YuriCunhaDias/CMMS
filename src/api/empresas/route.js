async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const empresa =
        await sql`SELECT * FROM empresas WHERE id = ${query.id} AND ativa = true`;
      return empresa.length > 0 ? empresa[0] : null;
    }

    if (query?.search) {
      const empresas = await sql`
        SELECT * FROM empresas 
        WHERE ativa = true 
        AND (
          LOWER(nome) LIKE LOWER(${"%" + query.search + "%"}) 
          OR LOWER(cnpj) LIKE LOWER(${"%" + query.search + "%"})
        )
        ORDER BY nome
      `;
      return { empresas };
    }

    const empresas =
      await sql`SELECT * FROM empresas WHERE ativa = true ORDER BY nome`;
    return { empresas };
  }

  if (method === "POST") {
    const { nome, endereco, cnpj, telefone, whatsapp, email, logo_url } = body;

    if (!nome) {
      return { error: "Nome da empresa é obrigatório" };
    }

    const empresasAtivas =
      await sql`SELECT COUNT(*) as count FROM empresas WHERE ativa = true`;
    if (empresasAtivas[0].count >= 6) {
      return { error: "Limite máximo de 6 empresas atingido" };
    }

    const novaEmpresa = await sql`
      INSERT INTO empresas (nome, endereco, cnpj, telefone, whatsapp, email, logo_url)
      VALUES (${nome}, ${endereco || null}, ${cnpj || null}, ${
      telefone || null
    }, ${whatsapp || null}, ${email || null}, ${logo_url || null})
      RETURNING *
    `;

    return { empresa: novaEmpresa[0], message: "Empresa criada com sucesso" };
  }

  if (method === "PUT") {
    const { id, nome, endereco, cnpj, telefone, whatsapp, email, logo_url } =
      body;

    if (!id || !nome) {
      return { error: "ID e nome da empresa são obrigatórios" };
    }

    const empresaAtualizada = await sql`
      UPDATE empresas 
      SET nome = ${nome}, endereco = ${endereco || null}, cnpj = ${
      cnpj || null
    }, 
          telefone = ${telefone || null}, whatsapp = ${whatsapp || null}, 
          email = ${email || null}, logo_url = ${logo_url || null}
      WHERE id = ${id} AND ativa = true
      RETURNING *
    `;

    if (empresaAtualizada.length === 0) {
      return { error: "Empresa não encontrada" };
    }

    return {
      empresa: empresaAtualizada[0],
      message: "Empresa atualizada com sucesso",
    };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID da empresa é obrigatório" };
    }

    await sql`UPDATE empresas SET ativa = false WHERE id = ${id}`;
    return { message: "Empresa removida com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}