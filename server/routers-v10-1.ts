/**
 * V10.1 Routers — Graus de Conduta + Webhook Intake + Auto-Dispatch + Recipe Delivery
 * Alias Núcleo: graus_conduta, webhooks_entrada, config_entrega_receita, templates_anamnese_rapida
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  return next({ ctx });
});

// ─── CONDUCT GRADE ROUTER ─────────────────────────────────────
export const conductGradeRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listConductGrades(input?.clinicId)),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      grade: z.enum(["grau_1_auto", "grau_2_semi", "grau_3_manual"]),
      validationLevel: z.enum(["N1", "N2", "N3"]),
      minScore: z.number(),
      maxScore: z.number(),
      description: z.string().optional(),
      autoGenerateRecipe: z.boolean().optional(),
      autoDispatchPharmacy: z.boolean().optional(),
      requiresConsultantClick: z.boolean().optional(),
      requiresFullCascade: z.boolean().optional(),
      color: z.string().optional(),
      sortOrder: z.number().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createConductGrade(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "conduct_grade", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      minScore: z.number().optional(),
      maxScore: z.number().optional(),
      description: z.string().optional(),
      autoGenerateRecipe: z.boolean().optional(),
      autoDispatchPharmacy: z.boolean().optional(),
      requiresConsultantClick: z.boolean().optional(),
      requiresFullCascade: z.boolean().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateConductGrade(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "conduct_grade", entityId: id });
    }),

  // Determina o grau de conduta baseado no score
  resolveGrade: protectedProcedure
    .input(z.object({ score: z.number(), clinicId: z.number().optional() }))
    .query(async ({ input }) => {
      const grades = await db.listConductGrades(input.clinicId);
      const activeGrades = grades.filter(g => g.isActive);
      const matched = activeGrades.find(g => input.score >= g.minScore && input.score <= g.maxScore);
      return matched ?? null;
    }),
});

// ─── WEBHOOK ENDPOINT ROUTER ──────────────────────────────────
export const webhookEndpointRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listWebhookEndpoints(input?.clinicId)),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      platform: z.enum(["manychat", "typebot", "botpress", "n8n", "zapier", "make", "custom"]),
      targetAction: z.enum(["create_lead", "start_quick_anamnesis", "update_lead_status", "trigger_prescription"]),
      fieldMapping: z.any().optional(),
      defaultChannelId: z.number().optional(),
      defaultChannelType: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot"]).optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const secretToken = nanoid(48);
      const id = await db.createWebhookEndpoint({ ...input, secretToken });
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "webhook_endpoint", entityId: id ?? undefined });
      return { id, secretToken };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      fieldMapping: z.any().optional(),
      defaultChannelId: z.number().optional(),
      defaultChannelType: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateWebhookEndpoint(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "webhook_endpoint", entityId: id });
    }),

  regenerateToken: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const newToken = nanoid(48);
      await db.updateWebhookEndpoint(input.id, { secretToken: newToken });
      await db.logAudit({ userId: ctx.user.id, action: "regenerate_token", entity: "webhook_endpoint", entityId: input.id });
      return { secretToken: newToken };
    }),
});

// ─── WEBHOOK INTAKE (public endpoint para ManyChat/Typebot/etc) ─
export const webhookIntakeRouter = router({
  // Endpoint público que recebe dados de automações externas
  ingest: publicProcedure
    .input(z.object({
      token: z.string(),
      payload: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ input }) => {
      // 1. Validar token
      const endpoint = await db.getWebhookEndpointByToken(input.token);
      if (!endpoint || !endpoint.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou endpoint desativado" });
      }

      // 2. Incrementar contador
      await db.updateWebhookEndpoint(endpoint.id, {
        lastCalledAt: new Date(),
        callCount: endpoint.callCount + 1,
      });

      // 3. Mapear campos
      const mapping = (endpoint.fieldMapping as Record<string, string>) || {};
      const mapped: Record<string, any> = {};
      for (const [targetField, sourceField] of Object.entries(mapping)) {
        if (input.payload[sourceField] !== undefined) {
          mapped[targetField] = input.payload[sourceField];
        }
      }
      // Fallback: usar campos diretos se não houver mapping
      const data = Object.keys(mapped).length > 0 ? mapped : input.payload;

      // 4. Executar ação
      switch (endpoint.targetAction) {
        case "create_lead": {
          const leadId = await db.createEntryLead({
            channelType: endpoint.defaultChannelType || "trafego_pago",
            channelId: endpoint.defaultChannelId,
            name: data.name || data.nome || "Lead via " + endpoint.platform,
            phone: data.phone || data.telefone || data.whatsapp,
            email: data.email,
            cpf: data.cpf,
            utmSource: data.utm_source || data.utmSource,
            utmMedium: data.utm_medium || data.utmMedium,
            utmCampaign: data.utm_campaign || data.utmCampaign,
            landingPage: data.landing_page || data.landingPage,
            clinicId: endpoint.clinicId,
            status: "novo",
          });
          return { success: true, action: "create_lead", leadId };
        }

        case "start_quick_anamnesis": {
          // Cria lead + marca como anamnese_iniciada
          const leadId = await db.createEntryLead({
            channelType: endpoint.defaultChannelType || "trafego_pago",
            channelId: endpoint.defaultChannelId,
            name: data.name || data.nome || "Lead via " + endpoint.platform,
            phone: data.phone || data.telefone,
            email: data.email,
            clinicId: endpoint.clinicId,
            status: "anamnese_iniciada",
          });
          return { success: true, action: "start_quick_anamnesis", leadId };
        }

        case "update_lead_status": {
          if (!data.leadId) throw new TRPCError({ code: "BAD_REQUEST", message: "leadId obrigatório" });
          await db.updateEntryLead(data.leadId, {
            status: data.status || "contatado",
            notes: data.notes,
          });
          return { success: true, action: "update_lead_status", leadId: data.leadId };
        }

        case "trigger_prescription": {
          // Marca lead como prescricao_gerada (a prescrição real é gerada pelo motor)
          if (data.leadId) {
            await db.updateEntryLead(data.leadId, { status: "prescricao_gerada" });
          }
          return { success: true, action: "trigger_prescription", leadId: data.leadId };
        }

        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ação desconhecida" });
      }
    }),
});

// ─── RECIPE DELIVERY CONFIG ROUTER ────────────────────────────
export const recipeDeliveryRouter = router({
  get: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.getRecipeDeliveryConfig(input?.clinicId)),

  upsert: adminProcedure
    .input(z.object({
      deliveryTarget: z.enum(["paciente", "farmacia", "ambos"]).optional(),
      defaultPharmacyId: z.number().nullable().optional(),
      autoSelectPharmacy: z.boolean().optional(),
      pharmacySelectionCriteria: z.enum(["mais_proxima", "menor_preco", "maior_comissao", "rotativa", "fixa"]).optional(),
      sendViaWhatsapp: z.boolean().optional(),
      sendViaEmail: z.boolean().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.upsertRecipeDeliveryConfig(input);
      await db.logAudit({ userId: ctx.user.id, action: "upsert", entity: "recipe_delivery_config", entityId: id ?? undefined });
      return { id };
    }),
});

// ─── QUICK ANAMNESIS TEMPLATE ROUTER ──────────────────────────
export const quickAnamnesisRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listQuickAnamnesisTemplates(input?.clinicId)),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      questionIds: z.array(z.number()),
      targetConductGrade: z.enum(["grau_1_auto", "grau_2_semi"]).optional(),
      autoPrescriptionTemplate: z.any().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createQuickAnamnesisTemplate(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "quick_anamnesis_template", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      questionIds: z.array(z.number()).optional(),
      targetConductGrade: z.enum(["grau_1_auto", "grau_2_semi"]).optional(),
      autoPrescriptionTemplate: z.any().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateQuickAnamnesisTemplate(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "quick_anamnesis_template", entityId: id });
    }),
});

// ─── REGULATORY COMPETENCE ROUTER (Score Competência Reguladora) ─
export const regulatoryCompetenceRouter = router({
  list: protectedProcedure
    .input(z.object({
      clinicId: z.number().optional(),
      category: z.string().optional(),
      validationLevel: z.string().optional(),
    }).optional())
    .query(async ({ input }) => db.listRegulatoryCompetence(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getRegulatoryCompetence(input.id)),

  create: adminProcedure
    .input(z.object({
      itemName: z.string().min(1),
      itemCategory: z.enum(["medicamento", "suplemento", "formula_magistral", "procedimento", "exame", "protocolo", "conduta_clinica", "dispositivo"]),
      administrationRoute: z.enum(["oral", "injetavel_iv", "injetavel_im", "injetavel_sc", "topico", "implante", "inalatorio", "sublingual", "retal", "oftalmico", "nasal", "transdermico", "procedimento_invasivo", "procedimento_nao_invasivo", "nenhuma"]),
      regulatoryScore: z.number().min(0).max(100),
      canMedico: z.boolean().optional(),
      canEnfermeiro: z.boolean().optional(),
      canFarmaceutico: z.boolean().optional(),
      canBiomedico: z.boolean().optional(),
      canNutricionista: z.boolean().optional(),
      canPsicologo: z.boolean().optional(),
      requiresCRM: z.boolean().optional(),
      requiresSpecialPrescription: z.boolean().optional(),
      prescriptionType: z.enum(["simples", "comum", "controle_especial", "antimicrobiano", "retencao", "notificacao_a", "nenhuma"]).optional(),
      autoValidationLevel: z.enum(["N1", "N2", "N3"]),
      regulatoryNotes: z.string().optional(),
      legalBasis: z.string().optional(),
      exampleDosage: z.string().optional(),
      therapeuticGroup: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.createRegulatoryCompetence(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "regulatory_competence", entityId: result.id ?? undefined });
      return result;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      itemName: z.string().optional(),
      itemCategory: z.enum(["medicamento", "suplemento", "formula_magistral", "procedimento", "exame", "protocolo", "conduta_clinica", "dispositivo"]).optional(),
      administrationRoute: z.enum(["oral", "injetavel_iv", "injetavel_im", "injetavel_sc", "topico", "implante", "inalatorio", "sublingual", "retal", "oftalmico", "nasal", "transdermico", "procedimento_invasivo", "procedimento_nao_invasivo", "nenhuma"]).optional(),
      regulatoryScore: z.number().min(0).max(100).optional(),
      canMedico: z.boolean().optional(),
      canEnfermeiro: z.boolean().optional(),
      canFarmaceutico: z.boolean().optional(),
      canBiomedico: z.boolean().optional(),
      canNutricionista: z.boolean().optional(),
      canPsicologo: z.boolean().optional(),
      requiresCRM: z.boolean().optional(),
      requiresSpecialPrescription: z.boolean().optional(),
      prescriptionType: z.enum(["simples", "comum", "controle_especial", "antimicrobiano", "retencao", "notificacao_a", "nenhuma"]).optional(),
      autoValidationLevel: z.enum(["N1", "N2", "N3"]).optional(),
      regulatoryNotes: z.string().optional(),
      legalBasis: z.string().optional(),
      exampleDosage: z.string().optional(),
      therapeuticGroup: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await db.updateRegulatoryCompetence(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "regulatory_competence", entityId: id });
      return result;
    }),

  // Motor de resolução: dado item + profissional → pode/não pode
  resolve: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      professionalRole: z.string(),
    }))
    .query(async ({ input }) => db.resolveCompetence(input.itemId, input.professionalRole)),
});
