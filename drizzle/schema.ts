import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// ─── USERS (auth) ──────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── PATIENTS ──────────────────────────────────────────────────
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: varchar("birthDate", { length: 10 }),
  sex: mysqlEnum("sex", ["M", "F", "O"]),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  accessToken: varchar("accessToken", { length: 64 }).notNull().unique(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  clinicId: int("clinicId"),
  entryChannel: mysqlEnum("entryChannel", [
    "trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot", "direto",
  ]).default("direto"),
  entryLeadId: int("entryLeadId"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Patient = typeof patients.$inferSelect;

// ─── CONSULTANTS (enfermeiras, biomédicas, etc.) ───────────────
export const consultants = mysqlTable("consultants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  canAccessIntegrative: boolean("canAccessIntegrative").default(true).notNull(),
  canAccessAesthetic: boolean("canAccessAesthetic").default(false).notNull(),
  canAccessReports: boolean("canAccessReports").default(true).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Consultant = typeof consultants.$inferSelect;

// ─── ANAMNESIS QUESTIONS (CRUD dinâmico) ───────────────────────
export const anamnesisQuestions = mysqlTable("anamnesis_questions", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["integrativa", "estetica", "relato_diario"]).notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "scale", "select", "multiselect", "checkbox", "date", "textarea"]).notNull(),
  options: json("options"),
  scaleMin: int("scaleMin"),
  scaleMax: int("scaleMax"),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  code: varchar("code", { length: 50 }),
  block: varchar("block", { length: 50 }),
  step: int("step"),
  clinicalGoal: text("clinicalGoal"),
  commercialGoal: text("commercialGoal"),
  helper: text("helper"),
  technicalName: varchar("technicalName", { length: 255 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AnamnesisQuestion = typeof anamnesisQuestions.$inferSelect;

// ─── ANAMNESIS SESSIONS ────────────────────────────────────────
export const anamnesisSessions = mysqlTable("anamnesis_sessions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  category: mysqlEnum("category", ["integrativa", "estetica"]).notNull(),
  conductedById: int("conductedById"),
  conductedByType: mysqlEnum("conductedByType", ["medico", "consultora", "paciente"]).default("medico"),
  status: mysqlEnum("status", ["rascunho", "em_andamento", "concluida"]).default("rascunho").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AnamnesisSession = typeof anamnesisSessions.$inferSelect;

// ─── ANAMNESIS RESPONSES ───────────────────────────────────────
export const anamnesisResponses = mysqlTable("anamnesis_responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: int("questionId").notNull(),
  answerText: text("answerText"),
  answerNumber: decimal("answerNumber", { precision: 10, scale: 2 }),
  answerJson: json("answerJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AnamnesisResponse = typeof anamnesisResponses.$inferSelect;

// ─── PRESCRIPTIONS (fórmulas) ──────────────────────────────────
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  via: varchar("via", { length: 50 }),
  form: varchar("form", { length: 50 }),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  duration: varchar("duration", { length: 50 }),
  objective: text("objective"),
  status: mysqlEnum("status", ["ativa", "pausada", "encerrada"]).default("ativa").notNull(),
  prescribedAt: timestamp("prescribedAt").defaultNow().notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Prescription = typeof prescriptions.$inferSelect;

// ─── PRESCRIPTION COMPONENTS ───────────────────────────────────
export const prescriptionComponents = mysqlTable("prescription_components", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  componentName: varchar("componentName", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  unit: varchar("unit", { length: 20 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  notes: text("notes"),
});
export type PrescriptionComponent = typeof prescriptionComponents.$inferSelect;

// ─── DAILY REPORTS (Via 3 — relatos diários) ───────────────────
export const dailyReports = mysqlTable("daily_reports", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  reportDate: varchar("reportDate", { length: 10 }).notNull(),
  period: mysqlEnum("period", ["manha", "tarde", "noite"]).notNull(),
  sleep: decimal("sleep", { precision: 4, scale: 1 }),
  energy: decimal("energy", { precision: 4, scale: 1 }),
  mood: decimal("mood", { precision: 4, scale: 1 }),
  focus: decimal("focus", { precision: 4, scale: 1 }),
  concentration: decimal("concentration", { precision: 4, scale: 1 }),
  libido: decimal("libido", { precision: 4, scale: 1 }),
  strength: decimal("strength", { precision: 4, scale: 1 }),
  physicalActivity: decimal("physicalActivity", { precision: 4, scale: 1 }),
  systolicBP: int("systolicBP"),
  diastolicBP: int("diastolicBP"),
  weight: decimal("weight", { precision: 5, scale: 1 }),
  generalNotes: text("generalNotes"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyReport = typeof dailyReports.$inferSelect;

// ─── PRESCRIPTION REPORTS (relatos vinculados a fórmulas) ──────
export const prescriptionReports = mysqlTable("prescription_reports", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  prescriptionId: int("prescriptionId").notNull(),
  reportType: mysqlEnum("reportType", ["reacao_adversa", "melhora", "sem_efeito", "duvida", "outro"]).notNull(),
  severity: mysqlEnum("severity", ["leve", "moderada", "grave"]).default("leve").notNull(),
  description: text("description").notNull(),
  reportedAt: timestamp("reportedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedById: int("resolvedById"),
  resolutionNotes: text("resolutionNotes"),
  status: mysqlEnum("status", ["aberto", "em_analise", "resolvido"]).default("aberto").notNull(),
});
export type PrescriptionReport = typeof prescriptionReports.$inferSelect;

// ─── ALERTS ────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  priority: mysqlEnum("priority", ["baixa", "moderada", "alta", "critica"]).default("moderada").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  source: varchar("source", { length: 100 }),
  sourceId: int("sourceId"),
  status: mysqlEnum("status", ["ativo", "em_analise", "resolvido", "descartado"]).default("ativo").notNull(),
  assignedToId: int("assignedToId"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Alert = typeof alerts.$inferSelect;

// ─── ALERT RULES ───────────────────────────────────────────────
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  condition: text("conditionExpr").notNull(),
  alertCategory: varchar("alertCategory", { length: 100 }).notNull(),
  alertPriority: mysqlEnum("alertPriority", ["baixa", "moderada", "alta", "critica"]).default("moderada").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AlertRule = typeof alertRules.$inferSelect;

// ─── FOLLOW-UP SESSIONS ────────────────────────────────────────
export const followUpSessions = mysqlTable("follow_up_sessions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  sessionType: mysqlEnum("sessionType", ["presencial", "online"]).default("presencial").notNull(),
  conductedById: int("conductedById"),
  sessionDate: timestamp("sessionDate").notNull(),
  clinicalScore: decimal("clinicalScore", { precision: 5, scale: 1 }),
  scoreBreakdown: json("scoreBreakdown"),
  notes: text("notes"),
  status: mysqlEnum("status", ["agendada", "realizada", "cancelada"]).default("agendada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FollowUpSession = typeof followUpSessions.$inferSelect;

// ─── EXAMS ─────────────────────────────────────────────────────
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  examName: varchar("examName", { length: 255 }).notNull(),
  value: varchar("value", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  referenceMin: varchar("referenceMin", { length: 50 }),
  referenceMax: varchar("referenceMax", { length: 50 }),
  classification: varchar("classification", { length: 50 }),
  examDate: varchar("examDate", { length: 10 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Exam = typeof exams.$inferSelect;

// ─── AUDIT LOG ─────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLogEntry = typeof auditLog.$inferSelect;

// ─── SCORING WEIGHTS (motor de score V15) ─────────────────────
export const scoringWeights = mysqlTable("scoring_weights", {
  id: int("id").autoincrement().primaryKey(),
  questionCode: varchar("questionCode", { length: 50 }).notNull(),
  axis: varchar("axis", { length: 50 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  maxRawPoints: int("maxRawPoints").default(10).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});
export type ScoringWeight = typeof scoringWeights.$inferSelect;

// ─── SCORING BANDS (faixas de conduta) ────────────────────────
export const scoringBands = mysqlTable("scoring_bands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  minScore: int("minScore").notNull(),
  maxScore: int("maxScore").notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  actions: json("actions"),
  sortOrder: int("sortOrder").default(0).notNull(),
});
export type ScoringBand = typeof scoringBands.$inferSelect;

// ─── MOTOR ACTIONS (regras determinísticas) ───────────────────
export const motorActions = mysqlTable("motor_actions", {
  id: int("id").autoincrement().primaryKey(),
  triggerCode: varchar("triggerCode", { length: 50 }).notNull(),
  triggerCondition: varchar("triggerCondition", { length: 100 }).notNull(),
  actionType: mysqlEnum("actionType", ["formula", "exame", "encaminhamento", "alerta", "painel"]).notNull(),
  actionValue: text("actionValue").notNull(),
  priority: int("priority").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});
export type MotorAction = typeof motorActions.$inferSelect;

// ─── CLINICAL FLAGS (validação humana obrigatória) ────────────
export const clinicalFlags = mysqlTable("clinical_flags", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  flagType: mysqlEnum("flagType", ["validation", "warning", "info"]).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description").notNull(),
  source: varchar("source", { length: 100 }),
  sourceId: int("sourceId"),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  validatedById: int("validatedById"),
  validatedAt: timestamp("validatedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ClinicalFlag = typeof clinicalFlags.$inferSelect;

// ─── FUNNEL STATUS (funil comercial) ──────────────────────────
export const funnelStatus = mysqlTable("funnel_status", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  stage: mysqlEnum("stage", ["iniciou_e_parou", "concluiu_clinico", "concluiu_financeiro", "alto_interesse", "convertido"]).notNull(),
  scoreBand: varchar("scoreBand", { length: 50 }),
  score: int("score"),
  stoppedAtStep: int("stoppedAtStep"),
  stoppedAtModule: varchar("stoppedAtModule", { length: 50 }),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FunnelStatus = typeof funnelStatus.$inferSelect;

// ─── MEDICATIONS (matriz dosada V16) ──────────────────────────
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dosageUnit: varchar("dosageUnit", { length: 50 }),
  dosageValue: decimal("dosageValue", { precision: 10, scale: 2 }),
  associatedDisease: varchar("associatedDisease", { length: 100 }),
  morningQty: int("morningQty").default(0).notNull(),
  afternoonQty: int("afternoonQty").default(0).notNull(),
  nightQty: int("nightQty").default(0).notNull(),
  totalDaily: int("totalDaily").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Medication = typeof medications.$inferSelect;

// ─── FLOW CONFIG (governança e roteamento) ────────────────────
export const flowConfig = mysqlTable("flow_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  configValue: varchar("configValue", { length: 50 }).notNull(),
  showToggle: boolean("showToggle").default(true).notNull(),
  description: text("description"),
  ifOn: text("ifOn"),
  ifOff: text("ifOff"),
  defaultProfile: varchar("defaultProfile", { length: 50 }),
  notes: text("notes"),
});
export type FlowConfig = typeof flowConfig.$inferSelect;

// ─── CLINICAL SYSTEMS (painéis por sistema clínico V16) ──────
export const clinicalSystems = mysqlTable("clinical_systems", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  system: mysqlEnum("system", ["cardiovascular", "metabolico", "endocrino", "digestivo", "neuro_humor", "sono", "atividade_fisica"]).notNull(),
  conditionCode: varchar("conditionCode", { length: 50 }).notNull(),
  conditionName: varchar("conditionName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["diagnosticado", "potencial", "descartado", "em_investigacao"]).default("potencial").notNull(),
  severity: mysqlEnum("severity", ["leve", "moderado", "grave"]).default("leve"),
  notes: text("notes"),
  diagnosedAt: varchar("diagnosedAt", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClinicalSystem = typeof clinicalSystems.$inferSelect;

// ─── SLEEP DETAIL (4 sub-escalas de sono V16) ────────────────
export const sleepDetails = mysqlTable("sleep_details", {
  id: int("id").autoincrement().primaryKey(),
  dailyReportId: int("dailyReportId").notNull(),
  patientId: int("patientId").notNull(),
  fallingAsleep: decimal("fallingAsleep", { precision: 4, scale: 1 }),
  waking: decimal("waking", { precision: 4, scale: 1 }),
  fragmented: decimal("fragmented", { precision: 4, scale: 1 }),
  daytimeSleepiness: decimal("daytimeSleepiness", { precision: 4, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SleepDetail = typeof sleepDetails.$inferSelect;

// ─── PHYSICAL ACTIVITY DETAIL (sub-bloco V16) ────────────────
export const physicalActivityDetails = mysqlTable("physical_activity_details", {
  id: int("id").autoincrement().primaryKey(),
  dailyReportId: int("dailyReportId").notNull(),
  patientId: int("patientId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  frequencyPerWeek: int("frequencyPerWeek"),
  period: mysqlEnum("period", ["manha", "tarde", "noite"]),
  intensity: mysqlEnum("intensity", ["leve", "moderada", "intensa"]),
  durationMinutes: int("durationMinutes"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PhysicalActivityDetail = typeof physicalActivityDetails.$inferSelect;

// ─── POLYPHARMACY RULES ──────────────────────────────────────
export const polypharmacyRules = mysqlTable("polypharmacy_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  medicationA: varchar("medicationA", { length: 255 }).notNull(),
  medicationB: varchar("medicationB", { length: 255 }),
  interactionType: mysqlEnum("interactionType", ["contraindicacao", "precaucao", "monitorar", "limiar_polifarmacia"]).notNull(),
  description: text("description").notNull(),
  threshold: int("threshold"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PolypharmacyRule = typeof polypharmacyRules.$inferSelect;

// ─── TEAM QUEUE (fila da equipe) ─────────────────────────────
export const teamQueue = mysqlTable("team_queue", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  assignedProfile: mysqlEnum("assignedProfile", ["enfermagem", "medico_assistente", "supervisor", "nao_atribuido"]).default("nao_atribuido").notNull(),
  assignedToId: int("assignedToId"),
  priority: mysqlEnum("priority", ["baixa", "normal", "alta", "urgente"]).default("normal").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["pendente", "em_atendimento", "concluido"]).default("pendente").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamQueueItem = typeof teamQueue.$inferSelect;

// ─── PROTOCOL DOCUMENTS (PDF gerado) ─────────────────────────
export const protocolDocuments = mysqlTable("protocol_documents", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  sessionId: int("sessionId"),
  documentType: mysqlEnum("documentType", ["protocolo", "anamnese", "relatorio"]).default("protocolo").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 255 }),
  scoreBand: varchar("scoreBand", { length: 50 }),
  score: int("score"),
  signedByName: varchar("signedByName", { length: 255 }),
  signedByCRM: varchar("signedByCRM", { length: 50 }),
  signedAt: timestamp("signedAt"),
  sentVia: mysqlEnum("sentVia", ["whatsapp", "email", "nenhum"]).default("nenhum"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProtocolDocument = typeof protocolDocuments.$inferSelect;

// ─── CLINICS (multi-tenancy) ────────────────────────────────
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#10553C"),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#D4AF37"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  cnpj: varchar("cnpj", { length: 20 }),
  ownerUserId: int("ownerUserId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  plan: mysqlEnum("plan", ["starter", "pro", "enterprise"]).default("starter").notNull(),
  maxPatients: int("maxPatients").default(50),
  maxConsultants: int("maxConsultants").default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

// ═══════════════════════════════════════════════════════════
// V10 — BRAÇOS DE ENTRADA + GOVERNANÇA + DISPATCHER FARMÁCIA
// ═══════════════════════════════════════════════════════════

// ─── ENTRY CHANNELS (canais de entrada) ─────────────────────
// Alias Núcleo: canais_entrada
export const entryChannels = mysqlTable("entry_channels", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "trafego_pago",      // E1: Beacon/Linktree/Meta Ads
    "consultora",        // E2: Consultora/Assistente inicia
    "site",              // E3: Paciente solicita pelo site
    "vendedor_externo",  // E4: Vendedor envia link
    "referral",          // E5: Indicação de paciente existente
    "whatsapp_bot",      // E6: WhatsApp Bot → triagem
  ]).notNull(),
  description: text("description"),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  linkTemplate: text("linkTemplate"),
  isActive: boolean("isActive").default(true).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EntryChannel = typeof entryChannels.$inferSelect;

// ─── ENTRY LEADS (leads capturados por qualquer braço) ──────
// Alias Núcleo: leads_entrada
export const entryLeads = mysqlTable("entry_leads", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId"),
  channelType: mysqlEnum("channelType", [
    "trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot",
  ]).notNull(),
  // Dados do lead
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }),
  // Rastreio UTM
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  utmTerm: varchar("utmTerm", { length: 100 }),
  utmContent: varchar("utmContent", { length: 100 }),
  landingPage: varchar("landingPage", { length: 500 }),
  // Referência do originador
  referredByPatientId: int("referredByPatientId"),
  vendorId: int("vendorId"),
  consultantId: int("consultantId"),
  // Funil
  status: mysqlEnum("status", [
    "novo", "contatado", "agendado", "anamnese_iniciada", "anamnese_concluida",
    "prescricao_gerada", "convertido", "perdido", "reativado",
  ]).default("novo").notNull(),
  // Vínculo com paciente (quando converte)
  patientId: int("patientId"),
  clinicId: int("clinicId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EntryLead = typeof entryLeads.$inferSelect;

// ─── PHARMACIES (farmácias parceiras) ───────────────────────
// Alias Núcleo: farmacias_parceiras
export const pharmacies = mysqlTable("pharmacies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).default("30.00").notNull(),
  integrationModel: mysqlEnum("integrationModel", ["portal", "marketplace", "drive", "manual"]).default("portal").notNull(),
  capabilities: json("capabilities"),
  isActive: boolean("isActive").default(true).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Pharmacy = typeof pharmacies.$inferSelect;

// ─── PRESCRIPTION DISPATCHES (despachos para farmácia) ──────
// Alias Núcleo: despachos_prescricao
export const prescriptionDispatches = mysqlTable("prescription_dispatches", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  patientId: int("patientId").notNull(),
  pharmacyId: int("pharmacyId").notNull(),
  status: mysqlEnum("status", [
    "pendente", "enviado", "aceito", "em_manipulacao", "pronto", "entregue", "cancelado",
  ]).default("pendente").notNull(),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }),
  commissionValue: decimal("commissionValue", { precision: 10, scale: 2 }),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }),
  sentAt: timestamp("sentAt"),
  acceptedAt: timestamp("acceptedAt"),
  readyAt: timestamp("readyAt"),
  deliveredAt: timestamp("deliveredAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: text("cancelReason"),
  notes: text("notes"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PrescriptionDispatch = typeof prescriptionDispatches.$inferSelect;

// ─── VALIDATION CASCADE (cascata de validação) ──────────────
// Alias Núcleo: fila_preceptor + eventos_clinicos
export const validationCascade = mysqlTable("validation_cascade", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", [
    "prescricao", "protocolo", "anamnese", "exame", "formula", "injetavel", "implante",
  ]).notNull(),
  entityId: int("entityId").notNull(),
  patientId: int("patientId").notNull(),
  // Etapa na cascata
  step: mysqlEnum("step", [
    "triagem_enfermagem",     // Enfermeira/Biomédica faz anamnese
    "validacao_medico",       // Médico delegado valida (1a lupa)
    "validacao_preceptor",    // Preceptor/CRM chefe valida (microscópio)
  ]).notNull(),
  // Profissional que validou
  professionalId: int("professionalId"),
  professionalName: varchar("professionalName", { length: 255 }),
  professionalCRM: varchar("professionalCRM", { length: 50 }),
  certificateDigital: varchar("certificateDigital", { length: 255 }),
  // Status
  status: mysqlEnum("status", [
    "aguardando", "homologado", "devolvido", "vencido", "dispensado",
  ]).default("aguardando").notNull(),
  observation: text("observation"),
  returnReason: text("returnReason"),
  // Prazos
  deadline: timestamp("deadline"),
  validatedAt: timestamp("validatedAt"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ValidationCascadeEntry = typeof validationCascade.$inferSelect;

// ─── PROFESSIONAL TRUST (delegação de confiança) ────────────
// Alias Núcleo: profissional_confianca
export const professionalTrust = mysqlTable("professional_trust", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professionalId").notNull(),
  professionalName: varchar("professionalName", { length: 255 }).notNull(),
  professionalCRM: varchar("professionalCRM", { length: 50 }),
  professionalRole: mysqlEnum("professionalRole", [
    "medico_consultor", "medico_assistente", "enfermeiro", "biomedico", "nutricionista", "psicologo",
  ]).notNull(),
  // Quem delegou
  delegatedById: int("delegatedById").notNull(),
  delegatedByName: varchar("delegatedByName", { length: 255 }),
  delegatedByCRM: varchar("delegatedByCRM", { length: 50 }),
  // Nível de confiança
  trustLevel: mysqlEnum("trustLevel", [
    "total",        // Pode validar tudo sem preceptor
    "parcial",      // Pode validar itens simples, complexos vão pro preceptor
    "supervisionado", // Tudo vai pro preceptor, mas aparece como validador intermediário
  ]).default("supervisionado").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  observation: text("observation"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProfessionalTrustEntry = typeof professionalTrust.$inferSelect;

// ─── VALIDATION CONFIG (config de validação por tipo de item) ─
// Alias Núcleo: soberania_config (parcial)
export const validationConfig = mysqlTable("validation_config", {
  id: int("id").autoincrement().primaryKey(),
  itemType: varchar("itemType", { length: 100 }).notNull(),
  itemName: varchar("itemName", { length: 255 }),
  requiresHumanValidation: boolean("requiresHumanValidation").default(true).notNull(),
  requiresCRM: boolean("requiresCRM").default(true).notNull(),
  minimumTrustLevel: mysqlEnum("minimumTrustLevel", ["total", "parcial", "supervisionado"]).default("supervisionado").notNull(),
  autoApproveBelow: decimal("autoApproveBelow", { precision: 10, scale: 2 }),
  notes: text("notes"),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ValidationConfigEntry = typeof validationConfig.$inferSelect;

// ═══════════════════════════════════════════════════════════
// V10.1 — GRAUS DE CONDUTA + WEBHOOK + DELIVERY CONFIG
// ═══════════════════════════════════════════════════════════

// ─── CONDUCT GRADES (classificação de condutas por score) ───
// Alias Núcleo: graus_conduta
export const conductGrades = mysqlTable("conduct_grades", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  grade: mysqlEnum("grade", ["grau_1_auto", "grau_2_semi", "grau_3_manual"]).notNull(),
  validationLevel: mysqlEnum("validationLevel", ["N1", "N2", "N3"]).notNull(),
  minScore: int("minScore").notNull(),
  maxScore: int("maxScore").notNull(),
  description: text("description"),
  // N1: IA valida auto → gera receita → despacha farmácia
  // N2: IA valida → precisa 1 clique do consultor delegado
  // N3: cascata completa (enfermeira → médico → preceptor)
  autoGenerateRecipe: boolean("autoGenerateRecipe").default(false).notNull(),
  autoDispatchPharmacy: boolean("autoDispatchPharmacy").default(false).notNull(),
  requiresConsultantClick: boolean("requiresConsultantClick").default(true).notNull(),
  requiresFullCascade: boolean("requiresFullCascade").default(false).notNull(),
  color: varchar("color", { length: 20 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  clinicId: int("clinicId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConductGrade = typeof conductGrades.$inferSelect;

// ─── WEBHOOK ENDPOINTS (integrações ManyChat/Typebot/n8n) ───
// Alias Núcleo: webhooks_entrada
export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", [
    "manychat", "typebot", "botpress", "n8n", "zapier", "make", "custom",
  ]).notNull(),
  secretToken: varchar("secretToken", { length: 128 }).notNull(),
  targetAction: mysqlEnum("targetAction", [
    "create_lead",           // Cria lead no funil
    "start_quick_anamnesis", // Inicia anamnese rápida
    "update_lead_status",    // Atualiza status do lead
    "trigger_prescription",  // Dispara prescrição automática
  ]).notNull(),
  // Config de mapeamento de campos
  fieldMapping: json("fieldMapping"),
  // Qual canal de entrada associar
  defaultChannelId: int("defaultChannelId"),
  defaultChannelType: mysqlEnum("defaultChannelType", [
    "trafego_pago", "consultora", "site", "vendedor_externo", "referral", "whatsapp_bot",
  ]),
  isActive: boolean("isActive").default(true).notNull(),
  lastCalledAt: timestamp("lastCalledAt"),
  callCount: int("callCount").default(0).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;

// ─── RECIPE DELIVERY CONFIG (toggle destino da receita) ─────
// Alias Núcleo: config_entrega_receita
export const recipeDeliveryConfig = mysqlTable("recipe_delivery_config", {
  id: int("id").autoincrement().primaryKey(),
  deliveryTarget: mysqlEnum("deliveryTarget", [
    "paciente",    // Só para o paciente
    "farmacia",    // Só para a farmácia
    "ambos",       // Para paciente E farmácia
  ]).default("ambos").notNull(),
  defaultPharmacyId: int("defaultPharmacyId"),
  autoSelectPharmacy: boolean("autoSelectPharmacy").default(false).notNull(),
  pharmacySelectionCriteria: mysqlEnum("pharmacySelectionCriteria", [
    "mais_proxima", "menor_preco", "maior_comissao", "rotativa", "fixa",
  ]).default("fixa"),
  sendViaWhatsapp: boolean("sendViaWhatsapp").default(false).notNull(),
  sendViaEmail: boolean("sendViaEmail").default(true).notNull(),
  clinicId: int("clinicId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RecipeDeliveryConfigEntry = typeof recipeDeliveryConfig.$inferSelect;

// ─── QUICK ANAMNESIS TEMPLATES (anamnese rápida via chatbot) ─
// Alias Núcleo: templates_anamnese_rapida
export const quickAnamnesisTemplates = mysqlTable("quick_anamnesis_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Subset de questionIds para anamnese rápida
  questionIds: json("questionIds").notNull(),
  targetConductGrade: mysqlEnum("targetConductGrade", ["grau_1_auto", "grau_2_semi"]),
  // Se grau_1, qual prescrição template gerar automaticamente
  autoPrescriptionTemplate: json("autoPrescriptionTemplate"),
  isActive: boolean("isActive").default(true).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QuickAnamnesisTemplate = typeof quickAnamnesisTemplates.$inferSelect;

// ═══════════════════════════════════════════════════════════
// V10.2 — COMPETÊNCIA REGULATÓRIA (quem pode prescrever o quê)
// ═══════════════════════════════════════════════════════════

// ─── REGULATORY COMPETENCE (classificação regulatória de condutas) ─
// Alias Núcleo: competencia_regulatoria / soberania_item
export const regulatoryCompetence = mysqlTable("regulatory_competence", {
  id: int("id").autoincrement().primaryKey(),
  // Identificação do item/conduta
  itemName: varchar("itemName", { length: 255 }).notNull(),
  itemCategory: mysqlEnum("itemCategory", [
    "medicamento", "suplemento", "formula_magistral", "procedimento",
    "exame", "protocolo", "conduta_clinica", "dispositivo",
  ]).notNull(),
  // Via de administração (determina complexidade regulatória)
  administrationRoute: mysqlEnum("administrationRoute", [
    "oral", "injetavel_iv", "injetavel_im", "injetavel_sc",
    "topico", "implante", "inalatorio", "sublingual",
    "retal", "oftalmico", "nasal", "transdermico",
    "procedimento_invasivo", "procedimento_nao_invasivo", "nenhuma",
  ]).notNull(),
  // Score de complexidade regulatória (0-100)
  // 0-30: qualquer profissional habilitado pode (farmacêutico, enfermeiro, etc.)
  // 31-60: profissional de saúde com supervisão médica
  // 61-100: exclusivamente médico com CRM
  regulatoryScore: int("regulatoryScore").notNull(),
  // Quem pode prescrever este item (flags booleanas)
  canMedico: boolean("canMedico").default(true).notNull(),
  canEnfermeiro: boolean("canEnfermeiro").default(false).notNull(),
  canFarmaceutico: boolean("canFarmaceutico").default(false).notNull(),
  canBiomedico: boolean("canBiomedico").default(false).notNull(),
  canNutricionista: boolean("canNutricionista").default(false).notNull(),
  canPsicologo: boolean("canPsicologo").default(false).notNull(),
  // Requer receita com CRM?
  requiresCRM: boolean("requiresCRM").default(true).notNull(),
  // Requer receita especial (controlados)?
  requiresSpecialPrescription: boolean("requiresSpecialPrescription").default(false).notNull(),
  // Tipo de receita necessária
  prescriptionType: mysqlEnum("prescriptionType", [
    "simples",              // Receita simples (vitaminas, suplementos)
    "comum",                // Receita comum (medicamentos não controlados)
    "controle_especial",    // Receita de controle especial (C1)
    "antimicrobiano",       // Receita de antimicrobiano
    "retencao",             // Receita com retenção (B1, B2)
    "notificacao_a",        // Notificação de receita A (entorpecentes)
    "nenhuma",              // Não requer receita
  ]).default("simples").notNull(),
  // Nível de validação automático baseado no score
  autoValidationLevel: mysqlEnum("autoValidationLevel", ["N1", "N2", "N3"]).notNull(),
  // Descrição e observações regulatórias
  regulatoryNotes: text("regulatoryNotes"),
  legalBasis: varchar("legalBasis", { length: 500 }),
  // Exemplos de uso
  exampleDosage: varchar("exampleDosage", { length: 255 }),
  // Agrupamento
  therapeuticGroup: varchar("therapeuticGroup", { length: 255 }),
  // Ativo
  isActive: boolean("isActive").default(true).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RegulatoryCompetenceEntry = typeof regulatoryCompetence.$inferSelect;

// ═══════════════════════════════════════════════════════════════
// V11 — Agendamento, Notificações, Trello, PWA Sync
// Alias Núcleo: agendamentos, notificacoes_internas, cards_trello, fila_sync_offline
// ═══════════════════════════════════════════════════════════════

// ─── APPOINTMENTS (Agendamento de Consultas) ──────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  patientName: varchar("patientName", { length: 255 }),
  professionalId: int("professionalId"),
  professionalName: varchar("professionalName", { length: 255 }),
  type: mysqlEnum("type", [
    "consulta_integrativa", "consulta_estetica", "retorno",
    "anamnese", "procedimento", "exame", "acompanhamento",
  ]).default("consulta_integrativa").notNull(),
  status: mysqlEnum("status", [
    "agendado", "confirmado", "em_atendimento", "concluido",
    "cancelado", "no_show", "reagendado",
  ]).default("agendado").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(30),
  location: varchar("location", { length: 500 }),
  notes: text("notes"),
  // Integração com calendário externo
  externalCalendarId: varchar("externalCalendarId", { length: 255 }),
  externalCalendarProvider: mysqlEnum("externalCalendarProvider", [
    "google", "outlook", "ical", "manual",
  ]).default("manual"),
  // Lembrete
  reminderSentAt: timestamp("reminderSentAt"),
  reminderType: mysqlEnum("reminderType", ["email", "whatsapp", "sms", "push", "nenhum"]).default("nenhum"),
  // Recorrência
  isRecurring: boolean("isRecurring").default(false),
  recurrenceRule: varchar("recurrenceRule", { length: 255 }),
  parentAppointmentId: int("parentAppointmentId"),
  // Multi-tenant
  clinicId: int("clinicId"),
  entryLeadId: int("entryLeadId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Appointment = typeof appointments.$inferSelect;

// ─── INTERNAL NOTIFICATIONS ───────────────────────────────────
export const internalNotifications = mysqlTable("internal_notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientId: int("recipientId").notNull(),
  recipientType: mysqlEnum("recipientType", [
    "admin", "medico", "enfermeiro", "consultora", "paciente",
  ]).default("admin").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: mysqlEnum("type", [
    "alerta_clinico", "prescricao_pendente", "validacao_pendente",
    "despacho_atualizado", "agendamento", "lead_novo", "sistema",
    "lembrete", "resultado_exame",
  ]).default("sistema").notNull(),
  priority: mysqlEnum("priority", ["baixa", "normal", "alta", "urgente"]).default("normal").notNull(),
  // Referência à entidade que gerou a notificação
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  // Canal de envio
  channel: mysqlEnum("channel", ["interno", "email", "whatsapp", "push"]).default("interno").notNull(),
  sentAt: timestamp("sentAt"),
  // Multi-tenant
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InternalNotification = typeof internalNotifications.$inferSelect;

// ─── TRELLO CARDS (Integração com Trello) ─────────────────────
export const trelloCards = mysqlTable("trello_cards", {
  id: int("id").autoincrement().primaryKey(),
  // Referência interna
  entityType: mysqlEnum("entityType", [
    "alerta", "prescricao", "validacao", "lead", "agendamento", "despacho",
  ]).notNull(),
  entityId: int("entityId").notNull(),
  // Dados do card no Trello
  trelloCardId: varchar("trelloCardId", { length: 100 }),
  trelloBoardId: varchar("trelloBoardId", { length: 100 }),
  trelloListId: varchar("trelloListId", { length: 100 }),
  trelloUrl: varchar("trelloUrl", { length: 500 }),
  // Conteúdo
  cardTitle: varchar("cardTitle", { length: 500 }).notNull(),
  cardDescription: text("cardDescription"),
  labels: text("labels"), // JSON array of label names
  dueDate: timestamp("dueDate"),
  // Sync status
  syncStatus: mysqlEnum("syncStatus", [
    "pendente", "sincronizado", "erro", "arquivado",
  ]).default("pendente").notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  syncError: text("syncError"),
  // Multi-tenant
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TrelloCard = typeof trelloCards.$inferSelect;

// ─── TRELLO CONFIG ────────────────────────────────────────────
export const trelloConfig = mysqlTable("trello_config", {
  id: int("id").autoincrement().primaryKey(),
  apiKey: varchar("apiKey", { length: 255 }),
  apiToken: varchar("apiToken", { length: 500 }),
  defaultBoardId: varchar("defaultBoardId", { length: 100 }),
  // Mapeamento de listas por tipo de entidade
  listMappings: text("listMappings"), // JSON: { "alerta": "listId", "prescricao": "listId" }
  isActive: boolean("isActive").default(false).notNull(),
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TrelloConfig = typeof trelloConfig.$inferSelect;

// ─── PWA SYNC QUEUE (Fila de sincronização offline) ───────────
export const pwaSyncQueue = mysqlTable("pwa_sync_queue", {
  id: int("id").autoincrement().primaryKey(),
  // Quem gerou
  userId: int("userId"),
  patientId: int("patientId"),
  // Tipo de operação
  operationType: mysqlEnum("operationType", [
    "relato_diario", "resposta_anamnese", "agendamento", "atualizacao_dados",
  ]).notNull(),
  // Payload JSON com os dados a sincronizar
  payload: text("payload").notNull(),
  // Status
  status: mysqlEnum("status", [
    "pendente", "sincronizando", "sincronizado", "erro", "conflito",
  ]).default("pendente").notNull(),
  // Metadados
  deviceId: varchar("deviceId", { length: 255 }),
  offlineCreatedAt: timestamp("offlineCreatedAt"),
  syncAttempts: int("syncAttempts").default(0),
  lastSyncError: text("lastSyncError"),
  resolvedAt: timestamp("resolvedAt"),
  // Multi-tenant
  clinicId: int("clinicId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PwaSyncQueueEntry = typeof pwaSyncQueue.$inferSelect;
