async function handler({
  action,
  ordem_id,
  template_id,
  imagem_base64,
  descricao_imagem,
  itens_checklist,
  imagem_id,
}) {
  try {
    if (action === "upload_imagem") {
      if (!ordem_id || !imagem_base64) {
        return { error: "ordem_id e imagem_base64 são obrigatórios" };
      }

      const uploadResult = await upload({ base64: imagem_base64 });
      if (uploadResult.error) {
        return {
          error: "Erro ao fazer upload da imagem: " + uploadResult.error,
        };
      }

      const maxOrdem = await sql`
        SELECT COALESCE(MAX(ordem_exibicao), 0) as max_ordem 
        FROM ordem_imagens 
        WHERE ordem_id = ${ordem_id}
      `;

      const novaOrdem = maxOrdem[0].max_ordem + 1;

      const resultado = await sql`
        INSERT INTO ordem_imagens (ordem_id, url_imagem, descricao, ordem_exibicao)
        VALUES (${ordem_id}, ${uploadResult.url}, ${
        descricao_imagem || ""
      }, ${novaOrdem})
        RETURNING *
      `;

      return { success: true, imagem: resultado[0] };
    }

    if (action === "listar_imagens") {
      if (!ordem_id) {
        return { error: "ordem_id é obrigatório" };
      }

      const imagens = await sql`
        SELECT * FROM ordem_imagens 
        WHERE ordem_id = ${ordem_id}
        ORDER BY ordem_exibicao ASC
      `;

      return { success: true, imagens };
    }

    if (action === "deletar_imagem") {
      if (!imagem_id) {
        return { error: "imagem_id é obrigatório" };
      }

      await sql`DELETE FROM ordem_imagens WHERE id = ${imagem_id}`;
      return { success: true, message: "Imagem deletada com sucesso" };
    }

    if (action === "salvar_checklist") {
      if (!ordem_id || !template_id || !itens_checklist) {
        return {
          error: "ordem_id, template_id e itens_checklist são obrigatórios",
        };
      }

      const checklistExistente = await sql`
        SELECT id FROM ordem_checklist 
        WHERE ordem_id = ${ordem_id} AND template_id = ${template_id}
      `;

      if (checklistExistente.length > 0) {
        await sql`
          UPDATE ordem_checklist 
          SET itens_preenchidos = ${JSON.stringify(itens_checklist)}
          WHERE ordem_id = ${ordem_id} AND template_id = ${template_id}
        `;
      } else {
        await sql`
          INSERT INTO ordem_checklist (ordem_id, template_id, itens_preenchidos)
          VALUES (${ordem_id}, ${template_id}, ${JSON.stringify(
          itens_checklist
        )})
        `;
      }

      return { success: true, message: "Checklist salvo com sucesso" };
    }

    if (action === "buscar_checklist") {
      if (!ordem_id) {
        return { error: "ordem_id é obrigatório" };
      }

      const checklists = await sql`
        SELECT oc.*, ct.nome as template_nome, ct.itens as template_itens
        FROM ordem_checklist oc
        JOIN checklist_templates ct ON oc.template_id = ct.id
        WHERE oc.ordem_id = ${ordem_id}
      `;

      return { success: true, checklists };
    }

    if (action === "listar_templates") {
      const templates = await sql`
        SELECT * FROM checklist_templates 
        ORDER BY nome ASC
      `;

      return { success: true, templates };
    }

    if (action === "criar_template") {
      const { nome, itens } = arguments[0];
      if (!nome || !itens) {
        return { error: "nome e itens são obrigatórios" };
      }

      const resultado = await sql`
        INSERT INTO checklist_templates (nome, itens)
        VALUES (${nome}, ${JSON.stringify(itens)})
        RETURNING *
      `;

      return { success: true, template: resultado[0] };
    }

    return { error: "Ação não reconhecida" };
  } catch (error) {
    return { error: "Erro interno: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}