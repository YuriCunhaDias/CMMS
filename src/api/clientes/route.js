async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const cliente = await sql`SELECT * FROM clientes WHERE id = ${query.id}`;
      if (cliente.length === 0) {
        return null;
      }

      const contatos =
        await sql`SELECT * FROM contatos_cliente WHERE cliente_id = ${query.id}`;

      return {
        ...cliente[0],
        contatos,
      };
    }

    if (query?.search) {
      const clientes = await sql`
        SELECT * FROM clientes 
        WHERE 
          LOWER(nome_empresa) LIKE LOWER(${"%" + query.search + "%"}) 
          OR LOWER(cnpj) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(email) LIKE LOWER(${"%" + query.search + "%"})
        ORDER BY nome_empresa
      `;
      return { clientes };
    }

    const clientes = await sql`SELECT * FROM clientes ORDER BY nome_empresa`;
    return { clientes };
  }

  if (method === "POST") {
    const { nome_empresa, endereco, cnpj, telefone, email, contatos } = body;

    if (!nome_empresa) {
      return { error: "Nome da empresa é obrigatório" };
    }

    const novoCliente = await sql`
      INSERT INTO clientes (nome_empresa, endereco, cnpj, telefone, email)
      VALUES (${nome_empresa}, ${endereco || null}, ${cnpj || null}, ${
      telefone || null
    }, ${email || null})
      RETURNING *
    `;

    const clienteId = novoCliente[0].id;

    if (contatos && contatos.length > 0) {
      for (const contato of contatos) {
        if (contato.nome) {
          await sql`
            INSERT INTO contatos_cliente (cliente_id, nome, telefone, whatsapp)
            VALUES (${clienteId}, ${contato.nome}, ${
            contato.telefone || null
          }, ${contato.whatsapp || null})
          `;
        }
      }
    }

    return { cliente: novoCliente[0], message: "Cliente criado com sucesso" };
  }

  if (method === "PUT") {
    const { id, nome_empresa, endereco, cnpj, telefone, email, contatos } =
      body;

    if (!id || !nome_empresa) {
      return { error: "ID e nome da empresa são obrigatórios" };
    }

    const clienteAtualizado = await sql`
      UPDATE clientes 
      SET nome_empresa = ${nome_empresa}, endereco = ${endereco || null}, 
          cnpj = ${cnpj || null}, telefone = ${telefone || null}, email = ${
      email || null
    }
      WHERE id = ${id}
      RETURNING *
    `;

    if (clienteAtualizado.length === 0) {
      return { error: "Cliente não encontrado" };
    }

    await sql`DELETE FROM contatos_cliente WHERE cliente_id = ${id}`;

    if (contatos && contatos.length > 0) {
      for (const contato of contatos) {
        if (contato.nome) {
          await sql`
            INSERT INTO contatos_cliente (cliente_id, nome, telefone, whatsapp)
            VALUES (${id}, ${contato.nome}, ${contato.telefone || null}, ${
            contato.whatsapp || null
          })
          `;
        }
      }
    }

    return {
      cliente: clienteAtualizado[0],
      message: "Cliente atualizado com sucesso",
    };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID do cliente é obrigatório" };
    }

    await sql`DELETE FROM clientes WHERE id = ${id}`;
    return { message: "Cliente removido com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}