async function handler({ method, body, query }) {
  if (method === "GET") {
    if (query?.id) {
      const equipamento =
        await sql`SELECT * FROM equipamentos WHERE id = ${query.id}`;
      if (equipamento.length === 0) {
        return null;
      }
      return equipamento[0];
    }

    if (query?.cliente_id) {
      const equipamentos = await sql`
        SELECT * FROM equipamentos 
        WHERE cliente_id = ${query.cliente_id}
        ORDER BY fabricante, numero_serie
      `;
      return { equipamentos };
    }

    if (query?.search) {
      const equipamentos = await sql`
        SELECT e.*, c.nome_empresa 
        FROM equipamentos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE 
          LOWER(e.fabricante) LIKE LOWER(${"%" + query.search + "%"}) 
          OR LOWER(e.numero_serie) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(e.motor_fabricante) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(e.gerador_fabricante) LIKE LOWER(${"%" + query.search + "%"})
          OR LOWER(c.nome_empresa) LIKE LOWER(${"%" + query.search + "%"})
        ORDER BY c.nome_empresa, e.fabricante
      `;
      return { equipamentos };
    }

    const equipamentos = await sql`
      SELECT e.*, c.nome_empresa 
      FROM equipamentos e
      LEFT JOIN clientes c ON e.cliente_id = c.id
      ORDER BY c.nome_empresa, e.fabricante
    `;
    return { equipamentos };
  }

  if (method === "POST") {
    const {
      cliente_id,
      fabricante,
      numero_serie,
      fabricacao,
      potencia,
      horimetro,
      motor_fabricante,
      motor_modelo,
      motor_numero_serie,
      gerador_fabricante,
      gerador_modelo,
      gerador_numero_serie,
    } = body;

    if (!cliente_id || !fabricante || !numero_serie) {
      return {
        error: "Cliente, fabricante e número de série são obrigatórios",
      };
    }

    const equipamentosCliente = await sql`
      SELECT COUNT(*) as count FROM equipamentos WHERE cliente_id = ${cliente_id}
    `;

    if (equipamentosCliente[0].count >= 20) {
      return { error: "Limite máximo de 20 equipamentos por cliente atingido" };
    }

    const equipamentoExistente = await sql`
      SELECT * FROM equipamentos 
      WHERE numero_serie = ${numero_serie} AND fabricante = ${fabricante}
    `;

    if (equipamentoExistente.length > 0) {
      return {
        error:
          "Já existe um equipamento com este número de série para este fabricante",
      };
    }

    const novoEquipamento = await sql`
      INSERT INTO equipamentos (
        cliente_id, fabricante, numero_serie, fabricacao, potencia, horimetro,
        motor_fabricante, motor_modelo, motor_numero_serie,
        gerador_fabricante, gerador_modelo, gerador_numero_serie
      )
      VALUES (
        ${cliente_id}, ${fabricante}, ${numero_serie}, ${fabricacao || null}, 
        ${potencia || null}, ${horimetro || null}, ${motor_fabricante || null}, 
        ${motor_modelo || null}, ${motor_numero_serie || null}, 
        ${gerador_fabricante || null}, ${gerador_modelo || null}, ${
      gerador_numero_serie || null
    }
      )
      RETURNING *
    `;

    return {
      equipamento: novoEquipamento[0],
      message: "Equipamento criado com sucesso",
    };
  }

  if (method === "PUT") {
    const {
      id,
      cliente_id,
      fabricante,
      numero_serie,
      fabricacao,
      potencia,
      horimetro,
      motor_fabricante,
      motor_modelo,
      motor_numero_serie,
      gerador_fabricante,
      gerador_modelo,
      gerador_numero_serie,
    } = body;

    if (!id || !cliente_id || !fabricante || !numero_serie) {
      return {
        error: "ID, cliente, fabricante e número de série são obrigatórios",
      };
    }

    const equipamentoExistente = await sql`
      SELECT * FROM equipamentos 
      WHERE numero_serie = ${numero_serie} AND fabricante = ${fabricante} AND id != ${id}
    `;

    if (equipamentoExistente.length > 0) {
      return {
        error:
          "Já existe outro equipamento com este número de série para este fabricante",
      };
    }

    const equipamentoAtualizado = await sql`
      UPDATE equipamentos 
      SET cliente_id = ${cliente_id}, fabricante = ${fabricante}, numero_serie = ${numero_serie},
          fabricacao = ${fabricacao || null}, potencia = ${potencia || null}, 
          horimetro = ${horimetro || null}, motor_fabricante = ${
      motor_fabricante || null
    },
          motor_modelo = ${motor_modelo || null}, motor_numero_serie = ${
      motor_numero_serie || null
    },
          gerador_fabricante = ${
            gerador_fabricante || null
          }, gerador_modelo = ${gerador_modelo || null},
          gerador_numero_serie = ${gerador_numero_serie || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (equipamentoAtualizado.length === 0) {
      return { error: "Equipamento não encontrado" };
    }

    return {
      equipamento: equipamentoAtualizado[0],
      message: "Equipamento atualizado com sucesso",
    };
  }

  if (method === "DELETE") {
    const { id } = body;

    if (!id) {
      return { error: "ID do equipamento é obrigatório" };
    }

    await sql`DELETE FROM equipamentos WHERE id = ${id}`;
    return { message: "Equipamento removido com sucesso" };
  }

  return { error: "Método não suportado" };
}
export async function POST(request) {
  return handler(await request.json());
}