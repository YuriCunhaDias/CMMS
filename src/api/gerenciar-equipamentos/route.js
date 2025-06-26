async function handler({ action, equipamento, cliente_id, equipamento_id }) {
  try {
    if (action === "listar") {
      if (cliente_id) {
        const equipamentos = await sql`
          SELECT e.*, c.nome_empresa 
          FROM equipamentos e
          JOIN clientes c ON e.cliente_id = c.id
          WHERE e.cliente_id = ${cliente_id}
          ORDER BY e.created_at DESC
        `;
        return { equipamentos };
      } else {
        const equipamentos = await sql`
          SELECT e.*, c.nome_empresa 
          FROM equipamentos e
          JOIN clientes c ON e.cliente_id = c.id
          ORDER BY e.created_at DESC
        `;
        return { equipamentos };
      }
    }

    if (action === "criar") {
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM equipamentos 
        WHERE cliente_id = ${equipamento.cliente_id}
      `;

      if (countResult[0].count >= 20) {
        return {
          error: "Cliente já possui o máximo de 20 equipamentos cadastrados",
        };
      }

      const novoEquipamento = await sql`
        INSERT INTO equipamentos (
          cliente_id, fabricante, numero_serie, fabricacao, potencia, horimetro,
          motor_fabricante, motor_modelo, motor_numero_serie,
          gerador_fabricante, gerador_modelo, gerador_numero_serie
        ) VALUES (
          ${equipamento.cliente_id}, ${equipamento.fabricante || null}, 
          ${equipamento.numero_serie || null}, ${
        equipamento.fabricacao || null
      },
          ${equipamento.potencia || null}, ${equipamento.horimetro || null},
          ${equipamento.motor_fabricante || null}, ${
        equipamento.motor_modelo || null
      },
          ${equipamento.motor_numero_serie || null}, ${
        equipamento.gerador_fabricante || null
      },
          ${equipamento.gerador_modelo || null}, ${
        equipamento.gerador_numero_serie || null
      }
        )
        RETURNING *
      `;

      return { equipamento: novoEquipamento[0], success: true };
    }

    if (action === "atualizar") {
      const equipamentoAtualizado = await sql`
        UPDATE equipamentos SET
          fabricante = ${equipamento.fabricante || null},
          numero_serie = ${equipamento.numero_serie || null},
          fabricacao = ${equipamento.fabricacao || null},
          potencia = ${equipamento.potencia || null},
          horimetro = ${equipamento.horimetro || null},
          motor_fabricante = ${equipamento.motor_fabricante || null},
          motor_modelo = ${equipamento.motor_modelo || null},
          motor_numero_serie = ${equipamento.motor_numero_serie || null},
          gerador_fabricante = ${equipamento.gerador_fabricante || null},
          gerador_modelo = ${equipamento.gerador_modelo || null},
          gerador_numero_serie = ${equipamento.gerador_numero_serie || null}
        WHERE id = ${equipamento_id}
        RETURNING *
      `;

      if (equipamentoAtualizado.length === 0) {
        return { error: "Equipamento não encontrado" };
      }

      return { equipamento: equipamentoAtualizado[0], success: true };
    }

    if (action === "deletar") {
      const equipamentoDeletado = await sql`
        DELETE FROM equipamentos 
        WHERE id = ${equipamento_id}
        RETURNING *
      `;

      if (equipamentoDeletado.length === 0) {
        return { error: "Equipamento não encontrado" };
      }

      return { success: true };
    }

    if (action === "buscar") {
      const equipamento = await sql`
        SELECT e.*, c.nome_empresa 
        FROM equipamentos e
        JOIN clientes c ON e.cliente_id = c.id
        WHERE e.id = ${equipamento_id}
      `;

      if (equipamento.length === 0) {
        return { error: "Equipamento não encontrado" };
      }

      return { equipamento: equipamento[0] };
    }

    return { error: "Ação não reconhecida" };
  } catch (error) {
    return { error: "Erro interno do servidor: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}