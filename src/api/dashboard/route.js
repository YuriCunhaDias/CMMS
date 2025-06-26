async function handler() {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    const [
      statsResult,
      ordensRecentes,
      proximasManutencoes,
      equipamentosProblemas,
      performanceMensal,
    ] = await sql.transaction([
      sql`
        SELECT 
          COUNT(CASE WHEN situacao IN ('ORCAMENTO', 'APROVADA', 'EM EXECUCAO', 'AGUARDANDO PECAS') THEN 1 END) as ordens_abertas,
          COUNT(CASE WHEN situacao = 'CONCLUIDA' THEN 1 END) as ordens_concluidas,
          COALESCE(SUM(CASE 
            WHEN situacao = 'CONCLUIDA' 
            AND data_realizada >= ${firstDayOfMonth} 
            AND data_realizada <= ${lastDayOfMonth}
            THEN (
              COALESCE((SELECT SUM(valor_total) FROM ordem_servicos WHERE ordem_id = ordens_servico.id), 0) +
              COALESCE((SELECT SUM(valor_total) FROM ordem_pecas WHERE ordem_id = ordens_servico.id), 0) -
              COALESCE(desconto, 0)
            )
          END), 0) as receita_mensal,
          AVG(CASE 
            WHEN situacao = 'CONCLUIDA' AND data_aprovacao IS NOT NULL AND data_realizada IS NOT NULL
            THEN EXTRACT(EPOCH FROM (data_realizada - data_aprovacao)) / 86400
          END) as tempo_medio_resolucao
        FROM ordens_servico
      `,
      sql`
        SELECT 
          os.id,
          os.numero_ordem,
          os.situacao,
          os.categoria,
          os.data_geracao,
          c.nome_empresa as cliente_nome,
          e.fabricante as equipamento_fabricante,
          e.numero_serie as equipamento_serie
        FROM ordens_servico os
        LEFT JOIN clientes c ON os.cliente_id = c.id
        LEFT JOIN equipamentos e ON os.equipamento_id = e.id
        ORDER BY os.data_geracao DESC
        LIMIT 10
      `,
      sql`
        SELECT 
          os.id,
          os.numero_ordem,
          os.data_prevista,
          os.categoria,
          c.nome_empresa as cliente_nome,
          e.fabricante as equipamento_fabricante,
          e.numero_serie as equipamento_serie
        FROM ordens_servico os
        LEFT JOIN clientes c ON os.cliente_id = c.id
        LEFT JOIN equipamentos e ON os.equipamento_id = e.id
        WHERE os.data_prevista >= CURRENT_DATE
        AND os.situacao IN ('APROVADA', 'EM EXECUCAO')
        ORDER BY os.data_prevista ASC
        LIMIT 10
      `,
      sql`
        SELECT 
          e.id,
          e.fabricante,
          e.numero_serie,
          c.nome_empresa as cliente_nome,
          COUNT(os.id) as total_ordens,
          COUNT(CASE WHEN os.categoria = 'Manutencao' THEN 1 END) as manutencoes
        FROM equipamentos e
        LEFT JOIN ordens_servico os ON e.id = os.equipamento_id
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE os.data_geracao >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY e.id, e.fabricante, e.numero_serie, c.nome_empresa
        HAVING COUNT(os.id) > 0
        ORDER BY COUNT(os.id) DESC
        LIMIT 10
      `,
      sql`
        SELECT 
          DATE_TRUNC('month', data_realizada) as mes,
          COUNT(*) as ordens_concluidas,
          COALESCE(SUM(
            COALESCE((SELECT SUM(valor_total) FROM ordem_servicos WHERE ordem_id = ordens_servico.id), 0) +
            COALESCE((SELECT SUM(valor_total) FROM ordem_pecas WHERE ordem_id = ordens_servico.id), 0) -
            COALESCE(desconto, 0)
          ), 0) as receita,
          AVG(CASE 
            WHEN data_aprovacao IS NOT NULL AND data_realizada IS NOT NULL
            THEN EXTRACT(EPOCH FROM (data_realizada - data_aprovacao)) / 86400
          END) as tempo_medio_dias
        FROM ordens_servico
        WHERE situacao = 'CONCLUIDA'
        AND data_realizada >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', data_realizada)
        ORDER BY mes DESC
        LIMIT 12
      `,
    ]);

    const stats = statsResult[0] || {};

    return {
      estatisticas: {
        ordens_abertas: parseInt(stats.ordens_abertas) || 0,
        ordens_concluidas: parseInt(stats.ordens_concluidas) || 0,
        receita_mensal: parseFloat(stats.receita_mensal) || 0,
        tempo_medio_resolucao: parseFloat(stats.tempo_medio_resolucao) || 0,
      },
      ordens_recentes: ordensRecentes.map((ordem) => ({
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        situacao: ordem.situacao,
        categoria: ordem.categoria,
        data_geracao: ordem.data_geracao,
        cliente: ordem.cliente_nome,
        equipamento: `${ordem.equipamento_fabricante || "N/A"} - ${
          ordem.equipamento_serie || "N/A"
        }`,
      })),
      proximas_manutencoes: proximasManutencoes.map((ordem) => ({
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        data_prevista: ordem.data_prevista,
        categoria: ordem.categoria,
        cliente: ordem.cliente_nome,
        equipamento: `${ordem.equipamento_fabricante || "N/A"} - ${
          ordem.equipamento_serie || "N/A"
        }`,
      })),
      equipamentos_problemas: equipamentosProblemas.map((eq) => ({
        id: eq.id,
        fabricante: eq.fabricante,
        numero_serie: eq.numero_serie,
        cliente: eq.cliente_nome,
        total_ordens: parseInt(eq.total_ordens),
        manutencoes: parseInt(eq.manutencoes),
      })),
      performance_mensal: performanceMensal.map((perf) => ({
        mes: perf.mes,
        ordens_concluidas: parseInt(perf.ordens_concluidas),
        receita: parseFloat(perf.receita) || 0,
        tempo_medio_dias: parseFloat(perf.tempo_medio_dias) || 0,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return {
      error: "Erro interno do servidor",
      estatisticas: {
        ordens_abertas: 0,
        ordens_concluidas: 0,
        receita_mensal: 0,
        tempo_medio_resolucao: 0,
      },
      ordens_recentes: [],
      proximas_manutencoes: [],
      equipamentos_problemas: [],
      performance_mensal: [],
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}