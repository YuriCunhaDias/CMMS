async function handler() {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [
      ordersStats,
      monthlyRevenue,
      yearlyRevenue,
      lastMonthRevenue,
      equipmentProblems,
      avgResolutionTime,
      recentOrders,
      maintenanceNeeded,
    ] = await sql.transaction([
      sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN situacao = 'ORCAMENTO' THEN 1 END) as orcamento,
          COUNT(CASE WHEN situacao = 'APROVADA' THEN 1 END) as aprovada,
          COUNT(CASE WHEN situacao = 'EM EXECUCAO' THEN 1 END) as em_execucao,
          COUNT(CASE WHEN situacao = 'AGUARDANDO PECAS' THEN 1 END) as aguardando_pecas,
          COUNT(CASE WHEN situacao = 'CONCLUIDA' THEN 1 END) as concluida
        FROM ordens_servico
      `,

      sql`
        SELECT 
          EXTRACT(MONTH FROM os.data_geracao) as mes,
          COALESCE(SUM(
            COALESCE((SELECT SUM(op.valor_total) FROM ordem_pecas op WHERE op.ordem_id = os.id), 0) +
            COALESCE((SELECT SUM(osv.valor_total) FROM ordem_servicos osv WHERE osv.ordem_id = os.id), 0) -
            COALESCE(os.desconto, 0)
          ), 0) as receita
        FROM ordens_servico os
        WHERE EXTRACT(YEAR FROM os.data_geracao) = ${currentYear}
          AND os.situacao IN ('APROVADA', 'EM EXECUCAO', 'CONCLUIDA')
        GROUP BY EXTRACT(MONTH FROM os.data_geracao)
        ORDER BY mes
      `,

      sql`
        SELECT 
          COALESCE(SUM(
            COALESCE((SELECT SUM(op.valor_total) FROM ordem_pecas op WHERE op.ordem_id = os.id), 0) +
            COALESCE((SELECT SUM(osv.valor_total) FROM ordem_servicos osv WHERE osv.ordem_id = os.id), 0) -
            COALESCE(os.desconto, 0)
          ), 0) as receita_anual
        FROM ordens_servico os
        WHERE EXTRACT(YEAR FROM os.data_geracao) = ${currentYear}
          AND os.situacao IN ('APROVADA', 'EM EXECUCAO', 'CONCLUIDA')
      `,

      sql`
        SELECT 
          COALESCE(SUM(
            COALESCE((SELECT SUM(op.valor_total) FROM ordem_pecas op WHERE op.ordem_id = os.id), 0) +
            COALESCE((SELECT SUM(osv.valor_total) FROM ordem_servicos osv WHERE osv.ordem_id = os.id), 0) -
            COALESCE(os.desconto, 0)
          ), 0) as receita_mes_anterior
        FROM ordens_servico os
        WHERE EXTRACT(YEAR FROM os.data_geracao) = ${lastMonthYear}
          AND EXTRACT(MONTH FROM os.data_geracao) = ${lastMonth}
          AND os.situacao IN ('APROVADA', 'EM EXECUCAO', 'CONCLUIDA')
      `,

      sql`
        SELECT 
          e.id,
          e.fabricante,
          e.numero_serie,
          c.nome_empresa,
          COUNT(os.id) as total_problemas
        FROM equipamentos e
        LEFT JOIN ordens_servico os ON e.id = os.equipamento_id
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE os.categoria IN ('Manutencao', 'Retrabalho')
          AND os.data_geracao >= ${new Date(
            currentYear - 1,
            0,
            1
          ).toISOString()}
        GROUP BY e.id, e.fabricante, e.numero_serie, c.nome_empresa
        HAVING COUNT(os.id) > 0
        ORDER BY total_problemas DESC
        LIMIT 10
      `,

      sql`
        SELECT 
          AVG(
            CASE 
              WHEN os.data_realizada IS NOT NULL AND os.data_geracao IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (os.data_realizada::timestamp - os.data_geracao::timestamp)) / 86400
              ELSE NULL 
            END
          ) as tempo_medio_dias
        FROM ordens_servico os
        WHERE os.situacao = 'CONCLUIDA'
          AND os.data_realizada IS NOT NULL
          AND os.data_geracao >= ${new Date(currentYear, 0, 1).toISOString()}
      `,

      sql`
        SELECT 
          os.id,
          os.numero_ordem,
          os.categoria,
          os.situacao,
          os.data_geracao,
          os.data_prevista,
          c.nome_empresa as cliente,
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
          e.id,
          e.fabricante,
          e.numero_serie,
          e.horimetro,
          c.nome_empresa,
          MAX(os.data_realizada) as ultima_manutencao,
          COUNT(CASE WHEN os.categoria = 'Manutencao' AND os.situacao = 'CONCLUIDA' THEN 1 END) as total_manutencoes
        FROM equipamentos e
        LEFT JOIN ordens_servico os ON e.id = os.equipamento_id
        LEFT JOIN clientes c ON e.cliente_id = c.id
        GROUP BY e.id, e.fabricante, e.numero_serie, e.horimetro, c.nome_empresa
        HAVING 
          MAX(os.data_realizada) IS NULL OR 
          MAX(os.data_realizada) < ${
            new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          }
        ORDER BY ultima_manutencao ASC NULLS FIRST
        LIMIT 15
      `,
    ]);

    const monthlyRevenueData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = monthlyRevenue.find((r) => parseInt(r.mes) === month);
      return {
        mes: month,
        receita: found ? parseFloat(found.receita) : 0,
      };
    });

    const currentMonthRevenue =
      monthlyRevenueData.find((r) => r.mes === currentMonth)?.receita || 0;
    const previousMonthRevenue = parseFloat(
      lastMonthRevenue[0]?.receita_mes_anterior || 0
    );
    const revenueGrowth =
      previousMonthRevenue > 0
        ? (
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    return {
      estatisticas_ordens: {
        total: parseInt(ordersStats[0].total),
        abertas:
          parseInt(ordersStats[0].orcamento) +
          parseInt(ordersStats[0].aprovada),
        em_execucao:
          parseInt(ordersStats[0].em_execucao) +
          parseInt(ordersStats[0].aguardando_pecas),
        concluidas: parseInt(ordersStats[0].concluida),
        por_status: {
          orcamento: parseInt(ordersStats[0].orcamento),
          aprovada: parseInt(ordersStats[0].aprovada),
          em_execucao: parseInt(ordersStats[0].em_execucao),
          aguardando_pecas: parseInt(ordersStats[0].aguardando_pecas),
          concluida: parseInt(ordersStats[0].concluida),
        },
      },

      receita: {
        mensal: monthlyRevenueData,
        anual: parseFloat(yearlyRevenue[0]?.receita_anual || 0),
        mes_atual: currentMonthRevenue,
        mes_anterior: previousMonthRevenue,
        crescimento_percentual: parseFloat(revenueGrowth),
      },

      equipamentos_problematicos: equipmentProblems.map((eq) => ({
        id: eq.id,
        fabricante: eq.fabricante,
        numero_serie: eq.numero_serie,
        cliente: eq.nome_empresa,
        total_problemas: parseInt(eq.total_problemas),
      })),

      tempo_medio_resolucao: {
        dias: parseFloat(avgResolutionTime[0]?.tempo_medio_dias || 0).toFixed(
          1
        ),
      },

      ordens_recentes: recentOrders.map((ordem) => ({
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        categoria: ordem.categoria,
        situacao: ordem.situacao,
        data_geracao: ordem.data_geracao,
        data_prevista: ordem.data_prevista,
        cliente: ordem.cliente,
        equipamento: `${ordem.equipamento_fabricante || "N/A"} - ${
          ordem.equipamento_serie || "N/A"
        }`,
      })),

      manutencao_preventiva: maintenanceNeeded.map((eq) => ({
        id: eq.id,
        fabricante: eq.fabricante,
        numero_serie: eq.numero_serie,
        horimetro: eq.horimetro,
        cliente: eq.nome_empresa,
        ultima_manutencao: eq.ultima_manutencao,
        total_manutencoes: parseInt(eq.total_manutencoes),
        dias_sem_manutencao: eq.ultima_manutencao
          ? Math.floor(
              (currentDate - new Date(eq.ultima_manutencao)) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      })),

      resumo_dashboard: {
        total_ordens: parseInt(ordersStats[0].total),
        receita_anual: parseFloat(yearlyRevenue[0]?.receita_anual || 0),
        equipamentos_atencao: equipmentProblems.length,
        manutencoes_pendentes: maintenanceNeeded.length,
        tempo_medio_resolucao_dias: parseFloat(
          avgResolutionTime[0]?.tempo_medio_dias || 0
        ).toFixed(1),
      },
    };
  } catch (error) {
    return {
      error: "Erro ao buscar dados do dashboard",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}