import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { calculateScore, calculateScoreFromSession } from "./scoring-engine";
import {
  entryChannelRouter, entryLeadRouter, pharmacyRouter, dispatchRouter,
  validationCascadeRouter, professionalTrustRouter, validationConfigRouter
} from "./routers-v10";
import {
  conductGradeRouter, webhookEndpointRouter, webhookIntakeRouter,
  recipeDeliveryRouter, quickAnamnesisRouter, regulatoryCompetenceRouter
} from "./routers-v10-1";
import { exportRouter } from "./routers-export";
import { appointmentRouter, notificationRouter, trelloRouter, pwaSyncRouter } from "./routers-v11";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  return next({ ctx });
});

// ─── PATIENT ROUTER ────────────────────────────────────────────
const patientRouter = router({
  list: protectedProcedure.input(z.object({ clinicId: z.number().optional() }).optional()).query(async ({ input }) => db.listPatients(undefined, input?.clinicId)),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getPatient(input.id)),
  getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => db.getPatientByToken(input.token)),
  create: protectedProcedure.input(z.object({
    name: z.string().min(1), cpf: z.string().optional(), birthDate: z.string().optional(),
    sex: z.enum(["M", "F", "O"]).optional(), phone: z.string().optional(),
    email: z.string().optional(), notes: z.string().optional(),
    clinicId: z.number().optional(),
    entryChannel: z.enum(["trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot", "direto"]).optional(),
    entryLeadId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const token = nanoid(32);
    const id = await db.createPatient({ ...input, accessToken: token, createdById: ctx.user.id });
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "patient", entityId: id ?? undefined });
    return { id, accessToken: token };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), name: z.string().optional(), cpf: z.string().optional(),
    birthDate: z.string().optional(), sex: z.enum(["M", "F", "O"]).optional(),
    phone: z.string().optional(), email: z.string().optional(),
    notes: z.string().optional(), isActive: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updatePatient(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "patient", entityId: id });
  }),
});

// ─── CONSULTANT ROUTER ─────────────────────────────────────────
const consultantRouter = router({
  list: protectedProcedure.input(z.object({ clinicId: z.number().optional() }).optional()).query(async ({ input }) => db.listConsultants(input?.clinicId)),
  create: adminProcedure.input(z.object({
    name: z.string().min(1), role: z.enum(["enfermeira", "biomedica", "nutricionista", "esteticista", "outro"]),
    email: z.string().optional(), phone: z.string().optional(),
    canAccessIntegrative: z.boolean().optional(), canAccessAesthetic: z.boolean().optional(), canAccessReports: z.boolean().optional(),
    clinicId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createConsultant(input);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "consultant", entityId: id ?? undefined });
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), name: z.string().optional(),
    role: z.enum(["enfermeira", "biomedica", "nutricionista", "esteticista", "outro"]).optional(),
    email: z.string().optional(), phone: z.string().optional(),
    isActive: z.boolean().optional(), canAccessIntegrative: z.boolean().optional(),
    canAccessAesthetic: z.boolean().optional(), canAccessReports: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateConsultant(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "consultant", entityId: id });
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await db.deleteConsultant(input.id);
    await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "consultant", entityId: input.id });
  }),
});

// ─── ANAMNESIS QUESTION ROUTER ─────────────────────────────────
const questionRouter = router({
  list: protectedProcedure.input(z.object({ category: z.enum(["integrativa", "estetica", "relato_diario"]).optional(), clinicId: z.number().optional() }).optional())
    .query(async ({ input }) => db.listQuestions(input?.category as any, input?.clinicId)),
  listPublic: publicProcedure.input(z.object({ category: z.enum(["integrativa", "estetica", "relato_diario"]), clinicId: z.number().optional() }))
    .query(async ({ input }) => db.listQuestions(input.category as any, input.clinicId)),
  create: adminProcedure.input(z.object({
    category: z.enum(["integrativa", "estetica", "relato_diario"]), section: z.string().min(1),
    questionText: z.string().min(1),
    fieldType: z.enum(["text", "number", "scale", "select", "multiselect", "checkbox", "date", "textarea"]),
    options: z.any().optional(), scaleMin: z.number().optional(), scaleMax: z.number().optional(),
    isRequired: z.boolean().optional(), sortOrder: z.number().optional(),
    code: z.string().optional(), block: z.string().optional(), step: z.number().optional(),
    clinicalGoal: z.string().optional(), commercialGoal: z.string().optional(),
    helper: z.string().optional(), technicalName: z.string().optional(),
    weight: z.string().optional(), videoUrl: z.string().optional(),
    clinicId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createQuestion(input);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "question", entityId: id ?? undefined });
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), section: z.string().optional(), questionText: z.string().optional(),
    fieldType: z.enum(["text", "number", "scale", "select", "multiselect", "checkbox", "date", "textarea"]).optional(),
    options: z.any().optional(), scaleMin: z.number().optional(), scaleMax: z.number().optional(),
    isRequired: z.boolean().optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional(),
    code: z.string().optional(), block: z.string().optional(), step: z.number().optional(),
    clinicalGoal: z.string().optional(), commercialGoal: z.string().optional(),
    helper: z.string().optional(), technicalName: z.string().optional(),
    weight: z.string().optional(), videoUrl: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateQuestion(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "question", entityId: id });
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await db.deleteQuestion(input.id);
    await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "question", entityId: input.id });
  }),
});

// ─── ANAMNESIS SESSION ROUTER ──────────────────────────────────
const anamnesisRouter = router({
  listSessions: protectedProcedure.input(z.object({ patientId: z.number(), category: z.enum(["integrativa", "estetica"]).optional() }))
    .query(async ({ input }) => db.listSessions(input.patientId, input.category)),
  createSession: protectedProcedure.input(z.object({
    patientId: z.number(), category: z.enum(["integrativa", "estetica"]),
    conductedByType: z.enum(["medico", "consultora", "paciente"]).optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createSession({ ...input, conductedById: ctx.user.id, status: "em_andamento" });
    return { id };
  }),
  getResponses: protectedProcedure.input(z.object({ sessionId: z.number() })).query(async ({ input }) => db.getResponses(input.sessionId)),
  saveResponses: protectedProcedure.input(z.object({
    sessionId: z.number(),
    responses: z.array(z.object({ questionId: z.number(), answerText: z.string().optional(), answerNumber: z.string().optional(), answerJson: z.any().optional() })),
  })).mutation(async ({ input }) => {
    await db.saveResponses(input.sessionId, input.responses);
  }),
  completeSession: protectedProcedure.input(z.object({ sessionId: z.number(), notes: z.string().optional() })).mutation(async ({ input }) => {
    await db.updateSession(input.sessionId, { status: "concluida", completedAt: new Date(), notes: input.notes });
    // Calculate score after completing session
    const scoreResult = await calculateScoreFromSession(input.sessionId);
    return { scoreResult };
  }),
  // Public endpoints for patient self-service
  createPatientSession: publicProcedure.input(z.object({
    token: z.string(), category: z.enum(["integrativa", "estetica"]),
  })).mutation(async ({ input }) => {
    const patient = await db.getPatientByToken(input.token);
    if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente nao encontrado" });
    const id = await db.createSession({ patientId: patient.id, category: input.category, conductedByType: "paciente", status: "em_andamento" });
    return { id, patientId: patient.id };
  }),
  savePatientResponses: publicProcedure.input(z.object({
    token: z.string(), sessionId: z.number(),
    responses: z.array(z.object({ questionId: z.number(), answerText: z.string().optional(), answerNumber: z.string().optional(), answerJson: z.any().optional() })),
  })).mutation(async ({ input }) => {
    const patient = await db.getPatientByToken(input.token);
    if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente nao encontrado" });
    await db.saveResponses(input.sessionId, input.responses);
    await db.updateSession(input.sessionId, { status: "concluida", completedAt: new Date() });
    // Calculate score and update funnel
    const scoreResult = await calculateScoreFromSession(input.sessionId);
    if (scoreResult) {
      await db.upsertFunnelStatus(patient.id, {
        stage: "concluiu_clinico",
        score: scoreResult.normalizedScore,
        scoreBand: scoreResult.band?.name ?? null,
      });
      // Create clinical flags
      for (const flag of scoreResult.flags) {
        await db.createClinicalFlag({
          patientId: patient.id, flagType: flag.type, code: flag.code,
          description: flag.description, source: "anamnese", sourceId: input.sessionId,
        });
      }
    }
    return { scoreResult };
  }),
});

// ─── PRESCRIPTION ROUTER ───────────────────────────────────────
const prescriptionRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number(), clinicId: z.number().optional() })).query(async ({ input }) => db.listPrescriptions(input.patientId, input.clinicId)),
  listByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const patient = await db.getPatientByToken(input.token);
    if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
    return db.listPrescriptions(patient.id, patient.clinicId ?? undefined);
  }),
  create: protectedProcedure.input(z.object({
    patientId: z.number(), code: z.string(), name: z.string(), via: z.string().optional(),
    form: z.string().optional(), dosage: z.string().optional(), frequency: z.string().optional(),
    duration: z.string().optional(), objective: z.string().optional(),
    components: z.array(z.object({ componentName: z.string(), dosage: z.string().optional(), unit: z.string().optional(), notes: z.string().optional() })).optional(),
    clinicId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { components, ...prescData } = input;
    const id = await db.createPrescription(prescData);
    if (id && components?.length) await db.savePrescriptionComponents(id, components);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "prescription", entityId: id ?? undefined });
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), status: z.enum(["ativa", "pausada", "encerrada"]).optional(),
    name: z.string().optional(), dosage: z.string().optional(), frequency: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updatePrescription(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "prescription", entityId: id });
  }),
  getComponents: protectedProcedure.input(z.object({ prescriptionId: z.number() })).query(async ({ input }) => db.getPrescriptionComponents(input.prescriptionId)),
});

// ─── DAILY REPORT ROUTER ───────────────────────────────────────
const dailyReportRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number(), limit: z.number().optional(), clinicId: z.number().optional() })).query(async ({ input }) => db.listDailyReports(input.patientId, input.limit, input.clinicId)),
  create: publicProcedure.input(z.object({
    token: z.string().optional(), patientId: z.number().optional(),
    reportDate: z.string(), period: z.enum(["manha", "tarde", "noite"]),
    sleep: z.string().optional(), energy: z.string().optional(), mood: z.string().optional(),
    focus: z.string().optional(), concentration: z.string().optional(), libido: z.string().optional(),
    strength: z.string().optional(), physicalActivity: z.string().optional(),
    systolicBP: z.number().optional(), diastolicBP: z.number().optional(),
    weight: z.string().optional(), generalNotes: z.string().optional(),
    clinicId: z.number().optional(),
  })).mutation(async ({ input }) => {
    let pId = input.patientId;
    if (input.token && !pId) {
      const patient = await db.getPatientByToken(input.token);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      pId = patient.id;
    }
    if (!pId) throw new TRPCError({ code: "BAD_REQUEST", message: "Patient ID required" });
    const { token, clinicId, ...data } = input;
    const id = await db.createDailyReport({ ...data, patientId: pId, clinicId });
    return { id };
  }),
});

// ─── PRESCRIPTION REPORT ROUTER ────────────────────────────────
const prescriptionReportRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number().optional() }).optional()).query(async ({ input }) => db.listPrescriptionReports(input?.patientId)),
  create: publicProcedure.input(z.object({
    token: z.string().optional(), patientId: z.number().optional(),
    prescriptionId: z.number(), reportType: z.enum(["reacao_adversa", "melhora", "sem_efeito", "duvida", "outro"]),
    severity: z.enum(["leve", "moderada", "grave"]).optional(), description: z.string().min(1),
  })).mutation(async ({ input }) => {
    let pId = input.patientId;
    if (input.token && !pId) {
      const patient = await db.getPatientByToken(input.token);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      pId = patient.id;
    }
    if (!pId) throw new TRPCError({ code: "BAD_REQUEST" });
    const { token, ...data } = input;
    const id = await db.createPrescriptionReport({ ...data, patientId: pId });
    // Auto-create alert for adverse reactions (propagate clinicId from patient)
    if (input.reportType === "reacao_adversa") {
      const patientData = pId ? await db.getPatient(pId) : null;
      await db.createAlert({
        patientId: pId, category: "Reacao a Formula",
        priority: input.severity === "grave" ? "critica" : input.severity === "moderada" ? "alta" : "moderada",
        title: "Reacao adversa reportada", description: input.description,
        source: "prescription_report", sourceId: id,
        clinicId: patientData?.clinicId ?? undefined,
      });
    }
    return { id };
  }),
  resolve: protectedProcedure.input(z.object({
    id: z.number(), resolutionNotes: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.updatePrescriptionReport(input.id, { status: "resolvido", resolvedAt: new Date(), resolvedById: ctx.user.id, resolutionNotes: input.resolutionNotes });
  }),
});

// ─── ALERT ROUTER ──────────────────────────────────────────────
const alertRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number().optional(), clinicId: z.number().optional() }).optional()).query(async ({ input }) => db.listAlerts(input?.patientId, input?.clinicId)),
  update: protectedProcedure.input(z.object({
    id: z.number(), status: z.enum(["ativo", "em_analise", "resolvido", "descartado"]).optional(),
    assignedToId: z.number().optional(), resolutionNotes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    if (data.status === "resolvido") (data as any).resolvedAt = new Date();
    await db.updateAlert(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "alert", entityId: id });
  }),
  rules: router({
    list: protectedProcedure.query(async () => db.listAlertRules()),
    create: adminProcedure.input(z.object({
      name: z.string(), source: z.string(), condition: z.string(),
      alertCategory: z.string(), alertPriority: z.enum(["baixa", "moderada", "alta", "critica"]).optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createAlertRule(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAlertRule(id, data);
    }),
  }),
});

// ─── EXAM ROUTER ───────────────────────────────────────────────
const examRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listExams(input.patientId)),
  create: protectedProcedure.input(z.object({
    patientId: z.number(), examName: z.string().min(1), value: z.string().optional(),
    unit: z.string().optional(), referenceMin: z.string().optional(), referenceMax: z.string().optional(),
    classification: z.string().optional(), examDate: z.string(), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createExam(input);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "exam", entityId: id ?? undefined });
    // Auto-alert engine (propagate clinicId from patient)
    if (input.value && input.referenceMax) {
      const val = parseFloat(input.value);
      const max = parseFloat(input.referenceMax);
      const min = input.referenceMin ? parseFloat(input.referenceMin) : 0;
      const patientData = await db.getPatient(input.patientId);
      const alertClinicId = patientData?.clinicId ?? undefined;
      if (!isNaN(val) && !isNaN(max) && val > max) {
        await db.createAlert({
          patientId: input.patientId, category: "Exame Alterado",
          priority: val > max * 1.5 ? "critica" : val > max * 1.2 ? "alta" : "moderada",
          title: `${input.examName} acima do limite (${input.value} ${input.unit ?? ""})`,
          description: `Valor: ${input.value}, Referencia: ${input.referenceMin ?? "0"}-${input.referenceMax}`,
          source: "exam", sourceId: id, clinicId: alertClinicId,
        });
      } else if (!isNaN(val) && !isNaN(min) && val < min && min > 0) {
        await db.createAlert({
          patientId: input.patientId, category: "Exame Alterado", priority: "moderada",
          title: `${input.examName} abaixo do limite (${input.value} ${input.unit ?? ""})`,
          description: `Valor: ${input.value}, Referencia: ${input.referenceMin}-${input.referenceMax}`,
          source: "exam", sourceId: id, clinicId: alertClinicId,
        });
      }
    }
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), value: z.string().optional(), classification: z.string().optional(), notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateExam(id, data);
  }),
});

// ─── FOLLOW-UP SESSION ROUTER ──────────────────────────────────
const followUpRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listFollowUpSessions(input.patientId)),
  create: protectedProcedure.input(z.object({
    patientId: z.number(), sessionType: z.enum(["presencial", "online"]).optional(),
    sessionDate: z.string(), clinicalScore: z.string().optional(),
    scoreBreakdown: z.any().optional(), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createFollowUpSession({ ...input, sessionDate: new Date(input.sessionDate), conductedById: ctx.user.id });
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), status: z.enum(["agendada", "realizada", "cancelada"]).optional(),
    clinicalScore: z.string().optional(), scoreBreakdown: z.any().optional(), notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateFollowUpSession(id, data);
  }),
});

// ─── SCORING ROUTER ────────────────────────────────────────────
const scoringRouter = router({
  bands: publicProcedure.query(async () => db.listScoringBands()),
  weights: protectedProcedure.query(async () => db.listScoringWeights()),
  motorActions: protectedProcedure.input(z.object({ triggerCode: z.string().optional() }).optional())
    .query(async ({ input }) => db.listMotorActions(input?.triggerCode)),
  calculateFromSession: protectedProcedure.input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => calculateScoreFromSession(input.sessionId)),
  calculate: publicProcedure.input(z.object({
    responses: z.array(z.object({
      questionId: z.number(), code: z.string().optional(),
      answerText: z.string().optional(), answerNumber: z.string().optional(), answerJson: z.any().optional(),
    })),
  })).mutation(async ({ input }) => {
    const questions = await db.listQuestions();
    return calculateScore(input.responses, questions as any);
  }),
  createMotorAction: adminProcedure.input(z.object({
    triggerCode: z.string(), triggerCondition: z.string(),
    actionType: z.enum(["formula", "exame", "encaminhamento", "alerta", "painel"]),
    actionValue: z.string(), priority: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createMotorAction(input);
    return { id };
  }),
  updateMotorAction: adminProcedure.input(z.object({
    id: z.number(), isActive: z.boolean().optional(), actionValue: z.string().optional(), priority: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateMotorAction(id, data);
  }),
});

// ─── CLINICAL FLAGS ROUTER ─────────────────────────────────────
const clinicalFlagRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listClinicalFlags(input.patientId)),
  validate: protectedProcedure.input(z.object({
    id: z.number(), status: z.enum(["aprovado", "rejeitado"]), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateClinicalFlag(input.id, {
      status: input.status, validatedById: ctx.user.id, validatedAt: new Date(), notes: input.notes,
    });
    await db.logAudit({ userId: ctx.user.id, action: `flag_${input.status}`, entity: "clinical_flag", entityId: input.id });
  }),
});

// ─── MEDICATION ROUTER ─────────────────────────────────────────
const medicationRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listMedications(input.patientId)),
  listByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const patient = await db.getPatientByToken(input.token);
    if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
    return db.listMedications(patient.id);
  }),
  create: protectedProcedure.input(z.object({
    patientId: z.number(), name: z.string().min(1), dosageUnit: z.string().optional(),
    dosageValue: z.string().optional(), associatedDisease: z.string().optional(),
    morningQty: z.number().optional(), afternoonQty: z.number().optional(), nightQty: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createMedication(input);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "medication", entityId: id ?? undefined });
    // Check polypharmacy
    const allMeds = await db.listMedications(input.patientId);
    if (allMeds.length >= 5) {
      const config = await db.getFlowConfig("TRAVAR_POLIFARMACIA");
      if (config?.configValue === "ON") {
        await db.createClinicalFlag({
          patientId: input.patientId, flagType: "warning", code: "POLIFARMACIA",
          description: `Polifarmacia detectada: ${allMeds.length} medicamentos ativos`,
          source: "medication", sourceId: id,
        });
      }
    }
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), name: z.string().optional(), dosageUnit: z.string().optional(),
    dosageValue: z.string().optional(), associatedDisease: z.string().optional(),
    morningQty: z.number().optional(), afternoonQty: z.number().optional(), nightQty: z.number().optional(),
    isActive: z.boolean().optional(), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateMedication(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "medication", entityId: id });
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await db.deleteMedication(input.id);
    await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "medication", entityId: input.id });
  }),
});

// ─── FUNNEL ROUTER ─────────────────────────────────────────────
const funnelRouter = router({
  get: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.getFunnelStatus(input.patientId)),
  stats: protectedProcedure.query(async () => db.listFunnelStats()),
  update: protectedProcedure.input(z.object({
    patientId: z.number(),
    stage: z.enum(["iniciou_e_parou", "concluiu_clinico", "concluiu_financeiro", "alto_interesse", "convertido"]),
    score: z.number().optional(), scoreBand: z.string().optional(),
    stoppedAtStep: z.number().optional(), stoppedAtModule: z.string().optional(), notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { patientId, ...data } = input;
    await db.upsertFunnelStatus(patientId, data);
  }),
  // Backend: detect abandoned patients (started anamnesis but no session completed in X days)
  detectAbandonment: protectedProcedure.input(z.object({ daysThreshold: z.number().optional() })).query(async ({ input }) => {
    const threshold = input.daysThreshold ?? 7;
    const allPatients = await db.listPatients();
    const abandoned: any[] = [];
    for (const p of allPatients) {
      const sessions = await db.listSessions(p.id);
      if (sessions.length === 0) continue;
      const lastSession = sessions[0];
      if (lastSession.status !== "concluida") {
        const lastDate = new Date(lastSession.createdAt);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= threshold) {
          abandoned.push({
            patientId: p.id, patientName: p.name, phone: p.phone, email: p.email,
            lastSessionDate: lastSession.createdAt, daysSinceActivity: daysSince,
            stoppedAtCategory: lastSession.category,
          });
        }
      }
    }
    return abandoned;
  }),
  // Backend: classify high-interest patients (completed clinical + financial + high score)
  classifyHighInterest: protectedProcedure.query(async () => {
    const allFunnel = await db.listFunnelStats();
    const allPatients = await db.listPatients();
    const highInterest: any[] = [];
    for (const p of allPatients) {
      const funnel = await db.getFunnelStatus(p.id);
      if (!funnel) continue;
      const isHigh = (funnel.stage === "concluiu_financeiro" || funnel.stage === "alto_interesse") && (funnel.score ?? 0) >= 50;
      if (isHigh) {
        highInterest.push({
          patientId: p.id, patientName: p.name, phone: p.phone,
          score: funnel.score, scoreBand: funnel.scoreBand, stage: funnel.stage,
        });
      }
    }
    return highInterest;
  }),
  // Backend: commercial forecast by band (deterministic from real data)
  commercialForecast: protectedProcedure.query(async () => {
    const allPatients = await db.listPatients();
    const bandCounts: Record<string, { count: number; patients: string[] }> = {
      "B\u00e1sico": { count: 0, patients: [] }, "Intermedi\u00e1rio": { count: 0, patients: [] },
      "Avan\u00e7ado": { count: 0, patients: [] }, "Full": { count: 0, patients: [] },
    };
    for (const p of allPatients) {
      const funnel = await db.getFunnelStatus(p.id);
      if (funnel?.scoreBand && bandCounts[funnel.scoreBand]) {
        bandCounts[funnel.scoreBand].count++;
        bandCounts[funnel.scoreBand].patients.push(p.name);
      }
    }
    const priceRanges: Record<string, { min: number; max: number }> = {
      "B\u00e1sico": { min: 500, max: 800 }, "Intermedi\u00e1rio": { min: 1200, max: 2000 },
      "Avan\u00e7ado": { min: 2500, max: 4000 }, "Full": { min: 5000, max: 8000 },
    };
    return Object.entries(bandCounts).map(([band, data]) => ({
      band, count: data.count, patients: data.patients,
      revenueMin: data.count * (priceRanges[band]?.min ?? 0),
      revenueMax: data.count * (priceRanges[band]?.max ?? 0),
    }));
  }),
});

// ─── FLOW CONFIG ROUTER ────────────────────────────────────────
const flowConfigRouter = router({
  list: protectedProcedure.query(async () => db.listFlowConfigs()),
  update: adminProcedure.input(z.object({
    key: z.string(), value: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateFlowConfig(input.key, input.value);
    await db.logAudit({ userId: ctx.user.id, action: "update_config", entity: "flow_config", details: input });
  }),
});

// ─── DASHBOARD ROUTER ──────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => db.getDashboardStats(ctx.user.id)),
  auditLog: adminProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => db.listAuditLogs(input?.limit)),
  patientTimeline: protectedProcedure.input(z.object({ patientId: z.number(), days: z.number().optional() })).query(async ({ input }) => {
    const days = input.days ?? 90;
    const reports = await db.listDailyReports(input.patientId, days);
    const exams = await db.listExams(input.patientId);
    const sessions = await db.listFollowUpSessions(input.patientId);
    const flags = await db.listClinicalFlags(input.patientId);
    const funnel = await db.getFunnelStatus(input.patientId);
    const meds = await db.listMedications(input.patientId);
    // Build symptom evolution data
    const symptomData = (reports ?? []).map((r: any) => ({
      date: r.reportDate, period: r.period,
      sleep: r.sleep ? parseFloat(r.sleep) : null, energy: r.energy ? parseFloat(r.energy) : null,
      mood: r.mood ? parseFloat(r.mood) : null, focus: r.focus ? parseFloat(r.focus) : null,
      concentration: r.concentration ? parseFloat(r.concentration) : null, libido: r.libido ? parseFloat(r.libido) : null,
      strength: r.strength ? parseFloat(r.strength) : null, physicalActivity: r.physicalActivity ? parseFloat(r.physicalActivity) : null,
      systolicBP: r.systolicBP, diastolicBP: r.diastolicBP, weight: r.weight,
    }));
    // Build exam evolution data grouped by exam name
    const examGroups: Record<string, any[]> = {};
    (exams ?? []).forEach((e: any) => {
      if (!examGroups[e.examName]) examGroups[e.examName] = [];
      examGroups[e.examName].push({ date: e.examDate, value: e.value ? parseFloat(e.value) : null, unit: e.unit, refMin: e.referenceMin, refMax: e.referenceMax });
    });
    // Compute clinical score from latest reports
    const latestReports = (reports ?? []).slice(0, 7);
    let clinicalScore = null;
    if (latestReports.length > 0) {
      const axes = ["sleep", "energy", "mood", "focus", "concentration", "libido", "strength", "physicalActivity"];
      const scores: Record<string, number> = {};
      axes.forEach(axis => {
        const vals = latestReports.map((r: any) => r[axis] ? parseFloat(r[axis]) : null).filter((v: any): v is number => v !== null);
        scores[axis] = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
      });
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      clinicalScore = { axes: scores, total: Math.round((total / (axes.length * 10)) * 100) };
    }
    return { symptomData, examGroups, sessions, clinicalScore, flags, funnel, medications: meds };
  }),
});

// ─── CLINICAL SYSTEM ROUTER ───────────────────────────────────
const clinicalSystemRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listClinicalSystems(input.patientId)),
  create: protectedProcedure.input(z.object({
    patientId: z.number(),
    system: z.enum(["cardiovascular", "metabolico", "endocrino", "digestivo", "neuro_humor", "sono", "atividade_fisica"]),
    conditionCode: z.string(), conditionName: z.string(),
    status: z.enum(["diagnosticado", "potencial", "descartado", "em_investigacao"]).optional(),
    severity: z.enum(["leve", "moderado", "grave"]).optional(),
    notes: z.string().optional(), diagnosedAt: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createClinicalSystem(input);
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "clinical_system", entityId: id ?? undefined });
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), status: z.enum(["diagnosticado", "potencial", "descartado", "em_investigacao"]).optional(),
    severity: z.enum(["leve", "moderado", "grave"]).optional(), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateClinicalSystem(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "clinical_system", entityId: id });
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await db.deleteClinicalSystem(input.id);
    await db.logAudit({ userId: ctx.user.id, action: "delete", entity: "clinical_system", entityId: input.id });
  }),
});

// ─── SLEEP DETAIL ROUTER ──────────────────────────────────────
const sleepDetailRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listSleepDetails(input.patientId)),
  create: protectedProcedure.input(z.object({
    dailyReportId: z.number(), patientId: z.number(),
    fallingAsleep: z.string().optional(), waking: z.string().optional(),
    fragmented: z.string().optional(), daytimeSleepiness: z.string().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createSleepDetail(input);
    return { id };
  }),
});

// ─── PHYSICAL ACTIVITY DETAIL ROUTER ──────────────────────────
const physicalActivityRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listPhysicalActivityDetails(input.patientId)),
  create: protectedProcedure.input(z.object({
    dailyReportId: z.number(), patientId: z.number(),
    activityType: z.string(), frequencyPerWeek: z.number().optional(),
    period: z.enum(["manha", "tarde", "noite"]).optional(),
    intensity: z.enum(["leve", "moderada", "intensa"]).optional(),
    durationMinutes: z.number().optional(), notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createPhysicalActivityDetail(input);
    return { id };
  }),
});

// ─── POLYPHARMACY ROUTER ──────────────────────────────────────
const polypharmacyRouter = router({
  rules: protectedProcedure.query(async () => db.listPolypharmacyRules()),
  check: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.checkPolypharmacy(input.patientId)),
  createRule: adminProcedure.input(z.object({
    name: z.string(), medicationA: z.string(), medicationB: z.string().optional(),
    interactionType: z.enum(["contraindicacao", "precaucao", "monitorar", "limiar_polifarmacia"]),
    description: z.string(), threshold: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createPolypharmacyRule(input);
    return { id };
  }),
  updateRule: adminProcedure.input(z.object({
    id: z.number(), isActive: z.boolean().optional(), description: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updatePolypharmacyRule(id, data);
  }),
});

// ─── TEAM QUEUE ROUTER ────────────────────────────────────────
const teamQueueRouter = router({
  list: protectedProcedure.input(z.object({ profile: z.string().optional() }).optional())
    .query(async ({ input }) => db.listTeamQueue(input?.profile)),
  create: protectedProcedure.input(z.object({
    patientId: z.number(),
    assignedProfile: z.enum(["enfermagem", "medico_assistente", "supervisor", "nao_atribuido"]).optional(),
    assignedToId: z.number().optional(),
    priority: z.enum(["baixa", "normal", "alta", "urgente"]).optional(),
    reason: z.string(), source: z.string().optional(), notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    // Auto-route by complexity if config enabled
    let profile = input.assignedProfile ?? "nao_atribuido";
    const autoRouteUrgente = await db.getFlowConfig("auto_route_urgente_supervisor");
    const autoRouteAlta = await db.getFlowConfig("auto_route_alta_medico");
    if (autoRouteUrgente?.configValue === "true" && input.priority === "urgente") {
      profile = "supervisor";
    } else if (autoRouteAlta?.configValue === "true" && input.priority === "alta") {
      profile = "medico_assistente";
    }
    const id = await db.createTeamQueueItem({ ...input, assignedProfile: profile });
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "team_queue", entityId: id ?? undefined });
    return { id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(), assignedProfile: z.enum(["enfermagem", "medico_assistente", "supervisor", "nao_atribuido"]).optional(),
    assignedToId: z.number().optional(), status: z.enum(["pendente", "em_atendimento", "concluido"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateTeamQueueItem(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "team_queue", entityId: id });
  }),
});

// ─── PROTOCOL DOCUMENT ROUTER ─────────────────────────────────
const protocolDocumentRouter = router({
  list: protectedProcedure.input(z.object({ patientId: z.number() })).query(async ({ input }) => db.listProtocolDocuments(input.patientId)),
  create: protectedProcedure.input(z.object({
    patientId: z.number(), sessionId: z.number().optional(),
    documentType: z.enum(["protocolo", "anamnese", "relatorio"]).optional(),
    title: z.string(), scoreBand: z.string().optional(), score: z.number().optional(),
    signedByName: z.string().optional(), signedByCRM: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    // Check if protocol creation is blocked by pending flags
    const blockConfig = await db.getFlowConfig("bloquear_protocolo_flag_pendente");
    if (blockConfig?.configValue === "true") {
      const flags = await db.listClinicalFlags(input.patientId);
      const pendingFlags = flags.filter((f: any) => f.status === "pendente");
      if (pendingFlags.length > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Protocolo bloqueado: ${pendingFlags.length} flag(s) cl\u00ednica(s) pendente(s) de valida\u00e7\u00e3o humana.` });
      }
    }
    const id = await db.createProtocolDocument({ ...input, signedAt: input.signedByName ? new Date() : null });
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "protocol_document", entityId: id ?? undefined });
    return { id };
  }),
  markSent: protectedProcedure.input(z.object({
    id: z.number(), sentVia: z.enum(["whatsapp", "email"]),
  })).mutation(async ({ input, ctx }) => {
    await db.updateProtocolDocument(input.id, { sentVia: input.sentVia, sentAt: new Date() });
    await db.logAudit({ userId: ctx.user.id, action: "send_protocol", entity: "protocol_document", entityId: input.id });
  }),
});

// ─── CLINIC (multi-tenancy) ──────────────────────────────────────────────
const clinicRouter = router({
  list: adminProcedure.query(async () => db.listClinics()),
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const clinic = await db.getClinicBySlug(input.slug);
    if (!clinic) throw new TRPCError({ code: "NOT_FOUND", message: "Clínica não encontrada" });
    return { id: clinic.id, name: clinic.name, slug: clinic.slug, logoUrl: clinic.logoUrl, primaryColor: clinic.primaryColor, secondaryColor: clinic.secondaryColor, phone: clinic.phone, email: clinic.email, plan: clinic.plan };
  }),
  create: adminProcedure.input(z.object({
    slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(255),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    cnpj: z.string().optional(),
    plan: z.enum(["starter", "pro", "enterprise"]).optional(),
    maxPatients: z.number().int().positive().optional(),
    maxConsultants: z.number().int().positive().optional(),
  })).mutation(async ({ input, ctx }) => {
    const existing = await db.getClinicBySlug(input.slug);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug já em uso" });
    const id = await db.createClinic({ ...input, ownerUserId: ctx.user.id });
    await db.logAudit({ userId: ctx.user.id, action: "create", entity: "clinic", entityId: id?.id });
    return id;
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(2).optional(),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    cnpj: z.string().optional(),
    plan: z.enum(["starter", "pro", "enterprise"]).optional(),
    maxPatients: z.number().int().positive().optional(),
    maxConsultants: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    if (data.slug) {
      const existing = await db.getClinicBySlug(data.slug);
      if (existing && existing.id !== id) throw new TRPCError({ code: "CONFLICT", message: "Slug já em uso" });
    }
    await db.updateClinic(id, data);
    await db.logAudit({ userId: ctx.user.id, action: "update", entity: "clinic", entityId: id });
  }),
});

// ─── MAIN ROUTER ───────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  patient: patientRouter,
  consultant: consultantRouter,
  question: questionRouter,
  anamnesis: anamnesisRouter,
  prescription: prescriptionRouter,
  dailyReport: dailyReportRouter,
  prescriptionReport: prescriptionReportRouter,
  alert: alertRouter,
  exam: examRouter,
  followUp: followUpRouter,
  dashboard: dashboardRouter,
  scoring: scoringRouter,
  clinicalFlag: clinicalFlagRouter,
  medication: medicationRouter,
  funnel: funnelRouter,
  flowConfig: flowConfigRouter,
  clinicalSystem: clinicalSystemRouter,
  sleepDetail: sleepDetailRouter,
  physicalActivity: physicalActivityRouter,
  polypharmacy: polypharmacyRouter,
  teamQueue: teamQueueRouter,
  protocolDocument: protocolDocumentRouter,
  clinic: clinicRouter,
  // V10 — Braços de Entrada + Governança + Dispatcher
  entryChannel: entryChannelRouter,
  entryLead: entryLeadRouter,
  pharmacy: pharmacyRouter,
  dispatch: dispatchRouter,
  validationCascade: validationCascadeRouter,
  professionalTrust: professionalTrustRouter,
  validationConfig: validationConfigRouter,
  // V10.1 — Graus de Conduta + Webhook + Auto-Dispatch
  conductGrade: conductGradeRouter,
  webhookEndpoint: webhookEndpointRouter,
  webhookIntake: webhookIntakeRouter,
  recipeDelivery: recipeDeliveryRouter,
  quickAnamnesis: quickAnamnesisRouter,
  regulatoryCompetence: regulatoryCompetenceRouter,
  // V11 — Exportação CSV
  export: exportRouter,
  // V11 — Agendamento, Notificações, Trello, PWA
  appointment: appointmentRouter,
  notification: notificationRouter,
  trello: trelloRouter,
  pwaSync: pwaSyncRouter,
});

export type AppRouter = typeof appRouter;
