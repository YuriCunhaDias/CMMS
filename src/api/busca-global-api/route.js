async function handler({ q }) {
  if (!q || q.trim().length === 0) {
    return {
      error: "Parâmetro q é obrigatório",
    };
  }

  const searchTerm = q.trim();
  const searchPattern = `%${searchTerm.toLowerCase()}%`;

  try {
    const [clientes, equipamentos, ordens, pecas, servicos] =
      await sql.transaction([
        sql`
        SELECT 
          id,
          nome_empresa,
          cnpj,
          email,
          telefone,
          endereco
        FROM clientes 
        WHERE 
          LOWER(nome_empresa) LIKE ${searchPattern}
          OR LOWER(cnpj) LIKE ${searchPattern}
          OR LOWER(email) LIKE ${searchPattern}
        LIMIT 10
      `,
        sql`
        SELECT 
          e.id,
          e.fabricante,
          e.numero_serie,
          e.potencia,
          c.nome_empresa as cliente_nome
        FROM equipamentos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE 
          LOWER(e.fabricante) LIKE ${searchPattern}
          OR LOWER(e.numero_serie) LIKE ${searchPattern}
        LIMIT 10
      `,
        sql`
        SELECT 
          o.id,
          o.numero_ordem,
          o.categoria,
          o.situacao,
          o.data_geracao,
          c.nome_empresa as cliente_nome
        FROM ordens_servico o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        WHERE 
          o.numero_ordem::text LIKE ${searchPattern}
          OR LOWER(o.categoria) LIKE ${searchPattern}
          OR LOWER(o.situacao) LIKE ${searchPattern}
        LIMIT 10
      `,
        sql`
        SELECT 
          id,
          descricao,
          classificacao,
          valor_unitario,
          quantidade,
          unidade_medida
        FROM pecas 
        WHERE LOWER(descricao) LIKE ${searchPattern}
        LIMIT 10
      `,
        sql`
        SELECT 
          id,
          descricao,
          valor_unitario,
          unidade_medida
        FROM servicos 
        WHERE LOWER(descricao) LIKE ${searchPattern}
        LIMIT 10
      `,
      ]);

    return {
      query: searchTerm,
      clientes: clientes.map((cliente) => ({
        id: cliente.id,
        nome_empresa: cliente.nome_empresa,
        cnpj: cliente.cnpj,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        tipo: "cliente",
      })),
      equipamentos: equipamentos.map((equipamento) => ({
        id: equipamento.id,
        fabricante: equipamento.fabricante,
        numero_serie: equipamento.numero_serie,
        potencia: equipamento.potencia,
        cliente_nome: equipamento.cliente_nome,
        tipo: "equipamento",
      })),
      ordens: ordens.map((ordem) => ({
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        categoria: ordem.categoria,
        situacao: ordem.situacao,
        data_geracao: ordem.data_geracao,
        cliente_nome: ordem.cliente_nome,
        tipo: "ordem",
      })),
      pecas: pecas.map((peca) => ({
        id: peca.id,
        descricao: peca.descricao,
        classificacao: peca.classificacao,
        valor_unitario: peca.valor_unitario,
        quantidade: peca.quantidade,
        unidade_medida: peca.unidade_medida,
        tipo: "peca",
      })),
      servicos: servicos.map((servico) => ({
        id: servico.id,
        descricao: servico.descricao,
        valor_unitario: servico.valor_unitario,
        unidade_medida: servico.unidade_medida,
        tipo: "servico",
      })),
      total_resultados:
        clientes.length +
        equipamentos.length +
        ordens.length +
        pecas.length +
        servicos.length,
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