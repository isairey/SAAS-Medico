/**
 * V10 Routers — Braços de Entrada + Governança + Dispatcher Farmácia
 * Alias Núcleo: canais_entrada, leads_entrada, farmacias_parceiras,
 *               despachos_prescricao, fila_preceptor, profissional_confianca
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

// ─── ENTRY CHANNEL ROUTER ─────────────────────────────────────
export const entryChannelRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listEntryChannels(input?.clinicId)),

  create: adminProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot"]),
      description: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      linkTemplate: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createEntryChannel(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "entry_channel", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      linkTemplate: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateEntryChannel(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "entry_channel", entityId: id });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteEntryChannel(input.id);
      await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "entry_channel", entityId: input.id });
    }),
});

// ─── ENTRY LEAD ROUTER ────────────────────────────────────────
export const entryLeadRouter = router({
  list: protectedProcedure
    .input(z.object({
      clinicId: z.number().optional(),
      channelType: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot"]).optional(),
      status: z.enum(["novo", "contatado", "agendado", "anamnese_iniciada", "anamnese_concluida", "prescricao_gerada", "convertido", "perdido", "reativado"]).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listEntryLeads(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getEntryLead(input.id)),

  stats: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.getLeadStats(input?.clinicId)),

  create: protectedProcedure
    .input(z.object({
      channelType: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot"]),
      channelId: z.number().optional(),
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      cpf: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
      landingPage: z.string().optional(),
      referredByPatientId: z.number().optional(),
      vendorId: z.number().optional(),
      consultantId: z.number().optional(),
      clinicId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createEntryLead(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "entry_lead", entityId: id ?? undefined });
      return { id };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["novo", "contatado", "agendado", "anamnese_iniciada", "anamnese_concluida", "prescricao_gerada", "convertido", "perdido", "reativado"]),
      patientId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateEntryLead(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update_status", entity: "entry_lead", entityId: id });
    }),
});

// ─── PHARMACY ROUTER ──────────────────────────────────────────
export const pharmacyRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listPharmacies(input?.clinicId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getPharmacy(input.id)),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      cnpj: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().max(2).optional(),
      contactPerson: z.string().optional(),
      commissionPercent: z.string().optional(),
      integrationModel: z.enum(["portal", "marketplace", "drive", "manual"]).optional(),
      capabilities: z.any().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createPharmacy(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "pharmacy", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      cnpj: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().max(2).optional(),
      contactPerson: z.string().optional(),
      commissionPercent: z.string().optional(),
      integrationModel: z.enum(["portal", "marketplace", "drive", "manual"]).optional(),
      capabilities: z.any().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updatePharmacy(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "pharmacy", entityId: id });
    }),
});

// ─── PRESCRIPTION DISPATCH ROUTER ─────────────────────────────
export const dispatchRouter = router({
  list: protectedProcedure
    .input(z.object({
      prescriptionId: z.number().optional(),
      pharmacyId: z.number().optional(),
      status: z.enum(["pendente", "enviado", "aceito", "em_manipulacao", "pronto", "entregue", "cancelado"]).optional(),
      clinicId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listDispatches(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getDispatch(input.id)),

  stats: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.getDispatchStats(input?.clinicId)),

  create: protectedProcedure
    .input(z.object({
      prescriptionId: z.number(),
      patientId: z.number(),
      pharmacyId: z.number(),
      totalValue: z.string().optional(),
      commissionPercent: z.string().optional(),
      notes: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Calculate commission
      const commissionValue = input.totalValue && input.commissionPercent
        ? String(Number(input.totalValue) * Number(input.commissionPercent) / 100)
        : undefined;
      const id = await db.createDispatch({
        ...input,
        commissionValue,
        status: "pendente",
      });
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "prescription_dispatch", entityId: id ?? undefined });
      return { id };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "enviado", "aceito", "em_manipulacao", "pronto", "entregue", "cancelado"]),
      cancelReason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, status, ...rest } = input;
      const timestampField: Record<string, string> = {
        enviado: "sentAt", aceito: "acceptedAt", pronto: "readyAt",
        entregue: "deliveredAt", cancelado: "cancelledAt",
      };
      const data: any = { status, ...rest };
      if (timestampField[status]) data[timestampField[status]] = new Date();
      await db.updateDispatch(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update_status", entity: "prescription_dispatch", entityId: id });
    }),
});

// ─── VALIDATION CASCADE ROUTER ────────────────────────────────
export const validationCascadeRouter = router({
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(["prescricao", "protocolo", "anamnese", "exame", "formula", "injetavel", "implante"]).optional(),
      entityId: z.number().optional(),
      patientId: z.number().optional(),
      status: z.enum(["aguardando", "homologado", "devolvido", "vencido", "dispensado"]).optional(),
      clinicId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listValidationCascade(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getValidationEntry(input.id)),

  create: protectedProcedure
    .input(z.object({
      entityType: z.enum(["prescricao", "protocolo", "anamnese", "exame", "formula", "injetavel", "implante"]),
      entityId: z.number(),
      patientId: z.number(),
      step: z.enum(["triagem_enfermagem", "validacao_medico", "validacao_preceptor"]),
      professionalId: z.number().optional(),
      professionalName: z.string().optional(),
      professionalCRM: z.string().optional(),
      deadline: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const data: any = { ...input };
      if (input.deadline) data.deadline = new Date(input.deadline);
      const id = await db.createValidationEntry(data);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "validation_cascade", entityId: id ?? undefined });
      return { id };
    }),

  validate: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["homologado", "devolvido", "dispensado"]),
      observation: z.string().optional(),
      returnReason: z.string().optional(),
      certificateDigital: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateValidationEntry(id, {
        ...data,
        professionalId: ctx.user.id,
        professionalName: ctx.user.name,
        validatedAt: new Date(),
      });
      await db.logAudit({ userId: ctx.user.id, action: "validate", entity: "validation_cascade", entityId: id });
    }),
});

// ─── PROFESSIONAL TRUST ROUTER ────────────────────────────────
export const professionalTrustRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listProfessionalTrust(input?.clinicId)),

  getByProfessional: protectedProcedure
    .input(z.object({ professionalId: z.number() }))
    .query(async ({ input }) => db.getProfessionalTrustByProfessional(input.professionalId)),

  create: adminProcedure
    .input(z.object({
      professionalId: z.number(),
      professionalName: z.string().min(1),
      professionalCRM: z.string().optional(),
      professionalRole: z.enum(["medico_consultor", "medico_assistente", "enfermeiro", "biomedico", "nutricionista", "psicologo"]),
      trustLevel: z.enum(["total", "parcial", "supervisionado"]),
      observation: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createProfessionalTrust({
        ...input,
        delegatedById: ctx.user.id,
        delegatedByName: ctx.user.name,
      });
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "professional_trust", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      trustLevel: z.enum(["total", "parcial", "supervisionado"]).optional(),
      isActive: z.boolean().optional(),
      observation: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateProfessionalTrust(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "professional_trust", entityId: id });
    }),
});

// ─── VALIDATION CONFIG ROUTER ─────────────────────────────────
export const validationConfigRouter = router({
  list: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listValidationConfig(input?.clinicId)),

  getForItem: protectedProcedure
    .input(z.object({ itemType: z.string(), clinicId: z.number().optional() }))
    .query(async ({ input }) => db.getValidationConfigForItem(input.itemType, input.clinicId)),

  create: adminProcedure
    .input(z.object({
      itemType: z.string().min(1),
      itemName: z.string().optional(),
      requiresHumanValidation: z.boolean().optional(),
      requiresCRM: z.boolean().optional(),
      minimumTrustLevel: z.enum(["total", "parcial", "supervisionado"]).optional(),
      autoApproveBelow: z.string().optional(),
      notes: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createValidationConfig(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "validation_config", entityId: id ?? undefined });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      requiresHumanValidation: z.boolean().optional(),
      requiresCRM: z.boolean().optional(),
      minimumTrustLevel: z.enum(["total", "parcial", "supervisionado"]).optional(),
      autoApproveBelow: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateValidationConfig(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "validation_config", entityId: id });
    }),
});
