async function handler({ action, id, cliente, contato, search }) {
  try {
    switch (action) {
      case "list":
        let query = "SELECT * FROM clientes WHERE 1=1";
        let values = [];
        let paramCount = 0;

        if (search) {
          paramCount++;
          query += ` AND (LOWER(nome_empresa) LIKE LOWER($${paramCount}) OR LOWER(cnpj) LIKE LOWER($${paramCount}) OR LOWER(email) LIKE LOWER($${paramCount}))`;
          values.push(`%${search}%`);
        }

        query += " ORDER BY nome_empresa";

        const clientes = await sql(query, values);

        const clientesComContatos = await Promise.all(
          clientes.map(async (cliente) => {
            const contatos = await sql(
              "SELECT * FROM contatos_cliente WHERE cliente_id = $1 ORDER BY nome",
              [cliente.id]
            );
            return { ...cliente, contatos };
          })
        );

        return { success: true, clientes: clientesComContatos };

      case "create":
        if (!cliente?.nome_empresa) {
          return { success: false, error: "Nome da empresa é obrigatório" };
        }

        const novoCliente = await sql(
          "INSERT INTO clientes (nome_empresa, endereco, cnpj, telefone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [
            cliente.nome_empresa,
            cliente.endereco || null,
            cliente.cnpj || null,
            cliente.telefone || null,
            cliente.email || null,
          ]
        );

        return { success: true, cliente: novoCliente[0] };

      case "update":
        if (!id) {
          return { success: false, error: "ID do cliente é obrigatório" };
        }

        if (!cliente?.nome_empresa) {
          return { success: false, error: "Nome da empresa é obrigatório" };
        }

        const clienteAtualizado = await sql(
          "UPDATE clientes SET nome_empresa = $1, endereco = $2, cnpj = $3, telefone = $4, email = $5 WHERE id = $6 RETURNING *",
          [
            cliente.nome_empresa,
            cliente.endereco || null,
            cliente.cnpj || null,
            cliente.telefone || null,
            cliente.email || null,
            id,
          ]
        );

        if (clienteAtualizado.length === 0) {
          return { success: false, error: "Cliente não encontrado" };
        }

        return { success: true, cliente: clienteAtualizado[0] };

      case "delete":
        if (!id) {
          return { success: false, error: "ID do cliente é obrigatório" };
        }

        await sql("DELETE FROM clientes WHERE id = $1", [id]);
        return { success: true, message: "Cliente excluído com sucesso" };

      case "get":
        if (!id) {
          return { success: false, error: "ID do cliente é obrigatório" };
        }

        const clienteEncontrado = await sql(
          "SELECT * FROM clientes WHERE id = $1",
          [id]
        );

        if (clienteEncontrado.length === 0) {
          return { success: false, error: "Cliente não encontrado" };
        }

        const contatos = await sql(
          "SELECT * FROM contatos_cliente WHERE cliente_id = $1 ORDER BY nome",
          [id]
        );

        return {
          success: true,
          cliente: { ...clienteEncontrado[0], contatos },
        };

      case "add_contact":
        if (!id || !contato?.nome) {
          return {
            success: false,
            error: "ID do cliente e nome do contato são obrigatórios",
          };
        }

        const novoContato = await sql(
          "INSERT INTO contatos_cliente (cliente_id, nome, telefone, whatsapp) VALUES ($1, $2, $3, $4) RETURNING *",
          [id, contato.nome, contato.telefone || null, contato.whatsapp || null]
        );

        return { success: true, contato: novoContato[0] };

      case "update_contact":
        if (!contato?.id || !contato?.nome) {
          return {
            success: false,
            error: "ID e nome do contato são obrigatórios",
          };
        }

        const contatoAtualizado = await sql(
          "UPDATE contatos_cliente SET nome = $1, telefone = $2, whatsapp = $3 WHERE id = $4 RETURNING *",
          [
            contato.nome,
            contato.telefone || null,
            contato.whatsapp || null,
            contato.id,
          ]
        );

        if (contatoAtualizado.length === 0) {
          return { success: false, error: "Contato não encontrado" };
        }

        return { success: true, contato: contatoAtualizado[0] };

      case "delete_contact":
        if (!contato?.id) {
          return { success: false, error: "ID do contato é obrigatório" };
        }

        await sql("DELETE FROM contatos_cliente WHERE id = $1", [contato.id]);
        return { success: true, message: "Contato excluído com sucesso" };

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