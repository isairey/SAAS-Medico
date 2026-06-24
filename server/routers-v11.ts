/**
 * V11 Routers — Appointments, Notifications, Trello, PWA Sync
 * Alias Núcleo: agendamentos, notificacoes_internas, cards_trello, fila_sync_offline
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  return next({ ctx });
});

// ─── APPOINTMENT ROUTER ──────────────────────────────────────
export const appointmentRouter = router({
  list: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      professionalId: z.number().optional(),
      status: z.enum(["agendado", "confirmado", "em_atendimento", "concluido", "cancelado", "no_show", "reagendado"]).optional(),
      clinicId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listAppointments(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getAppointment(input.id)),

  create: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      patientName: z.string().optional(),
      professionalId: z.number().optional(),
      professionalName: z.string().optional(),
      type: z.enum(["consulta_integrativa", "consulta_estetica", "retorno", "anamnese", "procedimento", "exame", "acompanhamento"]).optional(),
      scheduledAt: z.string(),
      durationMinutes: z.number().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      reminderType: z.enum(["email", "whatsapp", "sms", "push", "nenhum"]).optional(),
      isRecurring: z.boolean().optional(),
      recurrenceRule: z.string().optional(),
      clinicId: z.number().optional(),
      entryLeadId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const data: any = { ...input, scheduledAt: new Date(input.scheduledAt) };
      const id = await db.createAppointment(data);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "appointment", entityId: id ?? undefined });
      // Create notification for the appointment
      if (id) {
        await db.createNotification({
          recipientId: ctx.user.id,
          recipientType: "admin",
          title: `Novo agendamento: ${input.patientName || "Paciente"}`,
          content: `Agendamento ${input.type || "consulta"} para ${new Date(input.scheduledAt).toLocaleDateString("pt-BR")}`,
          type: "agendamento",
          entityType: "appointment",
          entityId: id,
          clinicId: input.clinicId,
        });
      }
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["agendado", "confirmado", "em_atendimento", "concluido", "cancelado", "no_show", "reagendado"]).optional(),
      scheduledAt: z.string().optional(),
      durationMinutes: z.number().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      professionalId: z.number().optional(),
      professionalName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, scheduledAt, ...rest } = input;
      const data: any = { ...rest };
      if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
      await db.updateAppointment(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "appointment", entityId: id });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteAppointment(input.id);
      await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "appointment", entityId: input.id });
    }),
});

// ─── NOTIFICATION ROUTER ─────────────────────────────────────
export const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({
      isRead: z.boolean().optional(),
      type: z.enum([
        "alerta_clinico", "prescricao_pendente", "validacao_pendente",
        "despacho_atualizado", "agendamento", "lead_novo", "sistema",
        "lembrete", "resultado_exame",
      ]).optional(),
      clinicId: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => db.listNotifications({ ...input, recipientId: ctx.user.id })),

  unreadCount: protectedProcedure
    .query(async ({ ctx }) => db.getUnreadCount(ctx.user.id)),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.markNotificationRead(input.id)),

  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => db.markAllNotificationsRead(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      recipientType: z.enum(["admin", "medico", "enfermeiro", "consultora", "paciente"]).optional(),
      title: z.string().min(1),
      content: z.string().optional(),
      type: z.enum([
        "alerta_clinico", "prescricao_pendente", "validacao_pendente",
        "despacho_atualizado", "agendamento", "lead_novo", "sistema",
        "lembrete", "resultado_exame",
      ]).optional(),
      priority: z.enum(["baixa", "normal", "alta", "urgente"]).optional(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      channel: z.enum(["interno", "email", "whatsapp", "push"]).optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createNotification(input);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "notification", entityId: id ?? undefined });
      return { id };
    }),
});

// ─── TRELLO ROUTER ───────────────────────────────────────────
export const trelloRouter = router({
  // Cards
  listCards: protectedProcedure
    .input(z.object({
      entityType: z.enum(["alerta", "prescricao", "validacao", "lead", "agendamento", "despacho"]).optional(),
      syncStatus: z.enum(["pendente", "sincronizado", "erro", "arquivado"]).optional(),
      clinicId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listTrelloCards(input)),

  createCard: protectedProcedure
    .input(z.object({
      entityType: z.enum(["alerta", "prescricao", "validacao", "lead", "agendamento", "despacho"]),
      entityId: z.number(),
      cardTitle: z.string().min(1),
      cardDescription: z.string().optional(),
      labels: z.string().optional(),
      dueDate: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const data: any = { ...input };
      if (input.dueDate) data.dueDate = new Date(input.dueDate);
      const id = await db.createTrelloCard(data);
      await db.logAudit({ userId: ctx.user.id, action: "create", entity: "trello_card", entityId: id ?? undefined });
      return { id };
    }),

  updateCard: protectedProcedure
    .input(z.object({
      id: z.number(),
      syncStatus: z.enum(["pendente", "sincronizado", "erro", "arquivado"]).optional(),
      trelloCardId: z.string().optional(),
      trelloUrl: z.string().optional(),
      syncError: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.syncStatus === "sincronizado") updateData.lastSyncAt = new Date();
      await db.updateTrelloCard(id, updateData);
      await db.logAudit({ userId: ctx.user.id, action: "update", entity: "trello_card", entityId: id });
    }),

  // Config
  getConfig: protectedProcedure
    .input(z.object({ clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.getTrelloConfig(input?.clinicId)),

  upsertConfig: adminProcedure
    .input(z.object({
      apiKey: z.string().optional(),
      apiToken: z.string().optional(),
      defaultBoardId: z.string().optional(),
      listMappings: z.string().optional(),
      isActive: z.boolean().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.upsertTrelloConfig(input);
      await db.logAudit({ userId: ctx.user.id, action: "upsert", entity: "trello_config", entityId: id ?? undefined });
      return { id };
    }),
});

// ─── PWA SYNC ROUTER ─────────────────────────────────────────
export const pwaSyncRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["pendente", "sincronizando", "sincronizado", "erro", "conflito"]).optional(),
      patientId: z.number().optional(),
      clinicId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => db.listPwaSyncQueue(input)),

  // Public endpoint for offline sync from patient portal
  submit: publicProcedure
    .input(z.object({
      patientId: z.number().optional(),
      operationType: z.enum(["relato_diario", "resposta_anamnese", "agendamento", "atualizacao_dados"]),
      payload: z.string(),
      deviceId: z.string().optional(),
      offlineCreatedAt: z.string().optional(),
      clinicId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const data: any = { ...input };
      if (input.offlineCreatedAt) data.offlineCreatedAt = new Date(input.offlineCreatedAt);
      const id = await db.createPwaSyncEntry(data);
      return { id, status: "pendente" };
    }),

  process: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.processPwaSyncEntry(input.id);
      await db.logAudit({ userId: ctx.user.id, action: "process", entity: "pwa_sync", entityId: input.id });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "sincronizando", "sincronizado", "erro", "conflito"]),
      lastSyncError: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updatePwaSyncEntry(id, data);
      await db.logAudit({ userId: ctx.user.id, action: "update_status", entity: "pwa_sync", entityId: id });
    }),
});
