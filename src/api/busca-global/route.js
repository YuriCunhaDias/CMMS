async function handler({ termo }) {
  if (!termo || termo.trim().length < 2) {
    return {
      error: "Termo de busca deve ter pelo menos 2 caracteres",
    };
  }

  const searchTerm = `%${termo.trim()}%`;

  try {
    const [clientes, equipamentos, ordens] = await sql.transaction([
      sql`
        SELECT 
          id,
          nome_empresa,
          email,
          telefone,
          cnpj,
          'cliente' as tipo
        FROM clientes 
        WHERE 
          ILIKE(nome_empresa, ${searchTerm}) OR
          ILIKE(email, ${searchTerm}) OR
          ILIKE(telefone, ${searchTerm}) OR
          ILIKE(cnpj, ${searchTerm})
        ORDER BY nome_empresa
        LIMIT 10
      `,

      sql`
        SELECT 
          e.id,
          e.fabricante,
          e.numero_serie,
          e.potencia,
          e.motor_modelo,
          e.gerador_modelo,
          c.nome_empresa as cliente_nome,
          'equipamento' as tipo
        FROM equipamentos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE 
          ILIKE(e.fabricante, ${searchTerm}) OR
          ILIKE(e.numero_serie, ${searchTerm}) OR
          ILIKE(e.motor_modelo, ${searchTerm}) OR
          ILIKE(e.gerador_modelo, ${searchTerm})
        ORDER BY e.fabricante
        LIMIT 10
      `,

      sql`
        SELECT 
          os.id,
          os.numero_ordem,
          os.categoria,
          os.situacao,
          os.data_geracao,
          os.solicitacao_causa,
          os.descricao_atendimento,
          c.nome_empresa as cliente_nome,
          'ordem' as tipo
        FROM ordens_servico os
        LEFT JOIN clientes c ON os.cliente_id = c.id
        WHERE 
          os.numero_ordem::text ILIKE ${searchTerm} OR
          ILIKE(c.nome_empresa, ${searchTerm}) OR
          ILIKE(os.solicitacao_causa, ${searchTerm}) OR
          ILIKE(os.descricao_atendimento, ${searchTerm})
        ORDER BY os.data_geracao DESC
        LIMIT 10
      `,
    ]);

    return {
      termo: termo.trim(),
      resultados: {
        clientes: clientes.map((c) => ({
          id: c.id,
          nome: c.nome_empresa,
          email: c.email,
          telefone: c.telefone,
          cnpj: c.cnpj,
          tipo: c.tipo,
        })),
        equipamentos: equipamentos.map((e) => ({
          id: e.id,
          fabricante: e.fabricante,
          numero_serie: e.numero_serie,
          potencia: e.potencia,
          motor_modelo: e.motor_modelo,
          gerador_modelo: e.gerador_modelo,
          cliente_nome: e.cliente_nome,
          tipo: e.tipo,
        })),
        ordens: ordens.map((o) => ({
          id: o.id,
          numero_ordem: o.numero_ordem,
          categoria: o.categoria,
          situacao: o.situacao,
          data_geracao: o.data_geracao,
          cliente_nome: o.cliente_nome,
          solicitacao_causa: o.solicitacao_causa,
          descricao_atendimento: o.descricao_atendimento,
          tipo: o.tipo,
        })),
      },
      total: clientes.length + equipamentos.length + ordens.length,
    };
  } catch (error) {
    return {
      error: "Erro ao realizar busca: " + error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}