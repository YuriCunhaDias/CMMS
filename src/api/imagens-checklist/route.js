async function handler({
  action,
  ordem_id,
  template_id,
  url_imagem,
  descricao,
  ordem_exibicao,
  nome_template,
  itens,
  itens_preenchidos,
}) {
  try {
    switch (action) {
      case "listar_imagens":
        if (!ordem_id) {
          return { error: "ID da ordem é obrigatório" };
        }

        const imagens = await sql`
          SELECT * FROM ordem_imagens 
          WHERE ordem_id = ${ordem_id} 
          ORDER BY ordem_exibicao ASC, created_at ASC
        `;

        return { imagens };

      case "adicionar_imagem":
        if (!ordem_id || !url_imagem) {
          return { error: "ID da ordem e URL da imagem são obrigatórios" };
        }

        const novaImagem = await sql`
          INSERT INTO ordem_imagens (ordem_id, url_imagem, descricao, ordem_exibicao)
          VALUES (${ordem_id}, ${url_imagem}, ${descricao || ""}, ${
          ordem_exibicao || 0
        })
          RETURNING *
        `;

        return { imagem: novaImagem[0] };

      case "remover_imagem":
        if (!ordem_id) {
          return { error: "ID da imagem é obrigatório" };
        }

        await sql`DELETE FROM ordem_imagens WHERE id = ${ordem_id}`;
        return { success: true };

      case "listar_templates":
        const templates = await sql`
          SELECT * FROM checklist_templates 
          ORDER BY nome ASC
        `;

        return { templates };

      case "criar_template":
        if (!nome_template || !itens) {
          return { error: "Nome do template e itens são obrigatórios" };
        }

        const novoTemplate = await sql`
          INSERT INTO checklist_templates (nome, itens)
          VALUES (${nome_template}, ${JSON.stringify(itens)})
          RETURNING *
        `;

        return { template: novoTemplate[0] };

      case "obter_template":
        if (!template_id) {
          return { error: "ID do template é obrigatório" };
        }

        const template = await sql`
          SELECT * FROM checklist_templates WHERE id = ${template_id}
        `;

        if (template.length === 0) {
          return { error: "Template não encontrado" };
        }

        return { template: template[0] };

      case "salvar_checklist":
        if (!ordem_id || !template_id || !itens_preenchidos) {
          return {
            error: "ID da ordem, template e itens preenchidos são obrigatórios",
          };
        }

        const checklistExistente = await sql`
          SELECT id FROM ordem_checklist 
          WHERE ordem_id = ${ordem_id} AND template_id = ${template_id}
        `;

        if (checklistExistente.length > 0) {
          const checklistAtualizado = await sql`
            UPDATE ordem_checklist 
            SET itens_preenchidos = ${JSON.stringify(itens_preenchidos)}
            WHERE ordem_id = ${ordem_id} AND template_id = ${template_id}
            RETURNING *
          `;

          return { checklist: checklistAtualizado[0] };
        } else {
          const novoChecklist = await sql`
            INSERT INTO ordem_checklist (ordem_id, template_id, itens_preenchidos)
            VALUES (${ordem_id}, ${template_id}, ${JSON.stringify(
            itens_preenchidos
          )})
            RETURNING *
          `;

          return { checklist: novoChecklist[0] };
        }

      case "obter_checklist":
        if (!ordem_id) {
          return { error: "ID da ordem é obrigatório" };
        }

        const checklists = await sql`
          SELECT oc.*, ct.nome as template_nome, ct.itens as template_itens
          FROM ordem_checklist oc
          JOIN checklist_templates ct ON oc.template_id = ct.id
          WHERE oc.ordem_id = ${ordem_id}
        `;

        return { checklists };

      case "upload_imagem":
        if (!url_imagem) {
          return { error: "URL da imagem é obrigatória" };
        }

        const uploadResult = await upload({ url: url_imagem });

        if (uploadResult.error) {
          return { error: uploadResult.error };
        }

        return { url: uploadResult.url, mimeType: uploadResult.mimeType };

      default:
        return { error: "Ação não reconhecida" };
    }
  } catch (error) {
    return { error: "Erro interno do servidor: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}