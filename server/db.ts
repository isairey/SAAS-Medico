import { eq, desc, and, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, patients, consultants, anamnesisQuestions,
  anamnesisSessions, anamnesisResponses, prescriptions, prescriptionComponents,
  dailyReports, prescriptionReports, alerts, alertRules, followUpSessions,
  exams, auditLog, scoringWeights, scoringBands, motorActions, clinicalFlags,
  funnelStatus, medications, flowConfig, clinicalSystems, sleepDetails,
  physicalActivityDetails, polypharmacyRules, teamQueue, protocolDocuments, clinics,
  entryChannels, entryLeads, pharmacies, prescriptionDispatches,
  validationCascade, professionalTrust, validationConfig,
  conductGrades, webhookEndpoints, recipeDeliveryConfig, quickAnamnesisTemplates,
  regulatoryCompetence,
  appointments, internalNotifications, trelloCards, trelloConfig, pwaSyncQueue
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (e) { console.warn("[DB] Failed:", e); _db = null; }
  }
  return _db;
}

// ─── USER HELPERS ──────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(f => {
    const v = user[f]; if (v === undefined) return;
    (values as any)[f] = v ?? null; updateSet[f] = v ?? null;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0] ?? undefined;
}

// ─── PATIENT HELPERS ───────────────────────────────────────────
export async function listPatients(createdById?: number, clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [];
  if (createdById) conditions.push(eq(patients.createdById, createdById));
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  if (conditions.length > 0) return db.select().from(patients).where(and(...conditions)).orderBy(desc(patients.createdAt));
  return db.select().from(patients).orderBy(desc(patients.createdAt));
}

export async function getPatient(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return r[0] ?? undefined;
}

export async function getPatientByToken(token: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(patients).where(eq(patients.accessToken, token)).limit(1);
  return r[0] ?? undefined;
}

export async function createPatient(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(patients).values(data);
  return result[0].insertId;
}

export async function updatePatient(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(patients).set(data).where(eq(patients.id, id));
}

// ─── CONSULTANT HELPERS ────────────────────────────────────────
export async function listConsultants(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(consultants).where(eq(consultants.clinicId, clinicId)).orderBy(desc(consultants.createdAt));
  return db.select().from(consultants).orderBy(desc(consultants.createdAt));
}

export async function createConsultant(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(consultants).values(data);
  return r[0].insertId;
}

export async function updateConsultant(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(consultants).set(data).where(eq(consultants.id, id));
}

export async function deleteConsultant(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(consultants).where(eq(consultants.id, id));
}

// ─── ANAMNESIS QUESTION HELPERS ────────────────────────────────
export async function listQuestions(category?: "integrativa" | "estetica" | "relato_diario", clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [];
  if (category) conditions.push(eq(anamnesisQuestions.category, category));
  if (clinicId) conditions.push(eq(anamnesisQuestions.clinicId, clinicId));
  if (conditions.length > 0) return db.select().from(anamnesisQuestions).where(and(...conditions)).orderBy(asc(anamnesisQuestions.sortOrder));
  return db.select().from(anamnesisQuestions).orderBy(asc(anamnesisQuestions.sortOrder));
}

export async function createQuestion(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(anamnesisQuestions).values(data);
  return r[0].insertId;
}

export async function updateQuestion(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(anamnesisQuestions).set(data).where(eq(anamnesisQuestions.id, id));
}

export async function deleteQuestion(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(anamnesisQuestions).where(eq(anamnesisQuestions.id, id));
}

// ─── ANAMNESIS SESSION HELPERS ─────────────────────────────────
export async function listSessions(patientId: number, category?: "integrativa" | "estetica") {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(anamnesisSessions.patientId, patientId)];
  if (category) conditions.push(eq(anamnesisSessions.category, category));
  return db.select().from(anamnesisSessions).where(and(...conditions)).orderBy(desc(anamnesisSessions.createdAt));
}

export async function createSession(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(anamnesisSessions).values(data);
  return r[0].insertId;
}

export async function updateSession(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(anamnesisSessions).set(data).where(eq(anamnesisSessions.id, id));
}

// ─── ANAMNESIS RESPONSE HELPERS ────────────────────────────────
export async function getResponses(sessionId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(anamnesisResponses).where(eq(anamnesisResponses.sessionId, sessionId));
}

export async function saveResponses(sessionId: number, responses: any[]) {
  const db = await getDb(); if (!db) return;
  // Delete existing and re-insert
  await db.delete(anamnesisResponses).where(eq(anamnesisResponses.sessionId, sessionId));
  if (responses.length > 0) {
    await db.insert(anamnesisResponses).values(responses.map(r => ({ ...r, sessionId })));
  }
}

// ─── PRESCRIPTION HELPERS ──────────────────────────────────────
export async function listPrescriptions(patientId: number, clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(prescriptions.patientId, patientId)];
  if (clinicId) conditions.push(eq(prescriptions.clinicId, clinicId));
  return db.select().from(prescriptions).where(and(...conditions)).orderBy(desc(prescriptions.createdAt));
}

export async function createPrescription(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(prescriptions).values(data);
  return r[0].insertId;
}

export async function updatePrescription(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(prescriptions).set(data).where(eq(prescriptions.id, id));
}

export async function getPrescriptionComponents(prescriptionId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(prescriptionComponents).where(eq(prescriptionComponents.prescriptionId, prescriptionId)).orderBy(asc(prescriptionComponents.sortOrder));
}

export async function savePrescriptionComponents(prescriptionId: number, components: any[]) {
  const db = await getDb(); if (!db) return;
  await db.delete(prescriptionComponents).where(eq(prescriptionComponents.prescriptionId, prescriptionId));
  if (components.length > 0) {
    await db.insert(prescriptionComponents).values(components.map((c, i) => ({ ...c, prescriptionId, sortOrder: i })));
  }
}

// ─── DAILY REPORT HELPERS ──────────────────────────────────────
export async function listDailyReports(patientId: number, limit = 30, clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(dailyReports.patientId, patientId)];
  if (clinicId) conditions.push(eq(dailyReports.clinicId, clinicId));
  return db.select().from(dailyReports).where(and(...conditions)).orderBy(desc(dailyReports.reportDate)).limit(limit);
}

export async function createDailyReport(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(dailyReports).values(data);
  return r[0].insertId;
}

// ─── PRESCRIPTION REPORT HELPERS ───────────────────────────────
export async function listPrescriptionReports(patientId?: number) {
  const db = await getDb(); if (!db) return [];
  if (patientId) return db.select().from(prescriptionReports).where(eq(prescriptionReports.patientId, patientId)).orderBy(desc(prescriptionReports.reportedAt));
  return db.select().from(prescriptionReports).orderBy(desc(prescriptionReports.reportedAt));
}

export async function createPrescriptionReport(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(prescriptionReports).values(data);
  return r[0].insertId;
}

export async function updatePrescriptionReport(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(prescriptionReports).set(data).where(eq(prescriptionReports.id, id));
}

// ─── ALERT HELPERS ─────────────────────────────────────────────
export async function listAlerts(patientId?: number, clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [];
  if (patientId) conditions.push(eq(alerts.patientId, patientId));
  if (clinicId) conditions.push(eq(alerts.clinicId, clinicId));
  if (conditions.length > 0) return db.select().from(alerts).where(and(...conditions)).orderBy(desc(alerts.createdAt));
  return db.select().from(alerts).orderBy(desc(alerts.createdAt));
}

export async function createAlert(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(alerts).values(data);
  return r[0].insertId;
}

export async function updateAlert(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(alerts).set(data).where(eq(alerts.id, id));
}

export async function listAlertRules() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
}

export async function createAlertRule(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(alertRules).values(data);
  return r[0].insertId;
}

export async function updateAlertRule(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(alertRules).set(data).where(eq(alertRules.id, id));
}

// ─── EXAM HELPERS ──────────────────────────────────────────────
export async function listExams(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(exams).where(eq(exams.patientId, patientId)).orderBy(desc(exams.examDate));
}

export async function createExam(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(exams).values(data);
  return r[0].insertId;
}

export async function updateExam(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(exams).set(data).where(eq(exams.id, id));
}

// ─── FOLLOW-UP SESSION HELPERS ─────────────────────────────────
export async function listFollowUpSessions(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(followUpSessions).where(eq(followUpSessions.patientId, patientId)).orderBy(desc(followUpSessions.sessionDate));
}

export async function createFollowUpSession(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(followUpSessions).values(data);
  return r[0].insertId;
}

export async function updateFollowUpSession(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(followUpSessions).set(data).where(eq(followUpSessions.id, id));
}

// ─── AUDIT LOG HELPERS ─────────────────────────────────────────
export async function logAudit(data: { userId?: number; action: string; entity: string; entityId?: number; details?: any; ipAddress?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function listAuditLogs(limit = 100) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}

//// ─── SCORING HELPERS ────────────────────────────────────────
export async function listScoringWeights() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(scoringWeights).where(eq(scoringWeights.isActive, true));
}
export async function listScoringBands() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(scoringBands).orderBy(asc(scoringBands.sortOrder));
}
export async function listMotorActions(triggerCode?: string) {
  const db = await getDb(); if (!db) return [];
  if (triggerCode) return db.select().from(motorActions).where(and(eq(motorActions.triggerCode, triggerCode), eq(motorActions.isActive, true)));
  return db.select().from(motorActions).where(eq(motorActions.isActive, true));
}
export async function createMotorAction(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(motorActions).values(data);
  return r[0].insertId;
}
export async function updateMotorAction(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(motorActions).set(data).where(eq(motorActions.id, id));
}
export async function createScoringWeight(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(scoringWeights).values(data);
  return r[0].insertId;
}

// ─── CLINICAL FLAGS HELPERS ──────────────────────────────────
export async function listClinicalFlags(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(clinicalFlags).where(eq(clinicalFlags.patientId, patientId)).orderBy(desc(clinicalFlags.createdAt));
}
export async function createClinicalFlag(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(clinicalFlags).values(data);
  return r[0].insertId;
}
export async function updateClinicalFlag(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(clinicalFlags).set(data).where(eq(clinicalFlags.id, id));
}

// ─── FUNNEL HELPERS ─────────────────────────────────────────
export async function getFunnelStatus(patientId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(funnelStatus).where(eq(funnelStatus.patientId, patientId)).limit(1);
  return r[0] ?? undefined;
}
export async function upsertFunnelStatus(patientId: number, data: any) {
  const db = await getDb(); if (!db) return;
  const existing = await getFunnelStatus(patientId);
  if (existing) {
    await db.update(funnelStatus).set(data).where(eq(funnelStatus.patientId, patientId));
  } else {
    await db.insert(funnelStatus).values({ ...data, patientId });
  }
}
export async function listFunnelStats() {
  const db = await getDb(); if (!db) return [];
  return db.select({ stage: funnelStatus.stage, count: sql<number>`count(*)` }).from(funnelStatus).groupBy(funnelStatus.stage);
}

// ─── MEDICATION HELPERS ──────────────────────────────────────
export async function listMedications(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(medications).where(eq(medications.patientId, patientId)).orderBy(desc(medications.createdAt));
}
export async function createMedication(data: any) {
  const db = await getDb(); if (!db) return null;
  const total = (data.morningQty ?? 0) + (data.afternoonQty ?? 0) + (data.nightQty ?? 0);
  const r = await db.insert(medications).values({ ...data, totalDaily: total });
  return r[0].insertId;
}
export async function updateMedication(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  if (data.morningQty !== undefined || data.afternoonQty !== undefined || data.nightQty !== undefined) {
    const med = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
    if (med[0]) {
      data.totalDaily = (data.morningQty ?? Number(med[0].morningQty)) + (data.afternoonQty ?? Number(med[0].afternoonQty)) + (data.nightQty ?? Number(med[0].nightQty));
    }
  }
  await db.update(medications).set(data).where(eq(medications.id, id));
}
export async function deleteMedication(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(medications).where(eq(medications.id, id));
}

// ─── FLOW CONFIG HELPERS ─────────────────────────────────────
export async function listFlowConfigs() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(flowConfig);
}
export async function updateFlowConfig(key: string, value: string) {
  const db = await getDb(); if (!db) return;
  await db.update(flowConfig).set({ configValue: value }).where(eq(flowConfig.configKey, key));
}
export async function getFlowConfig(key: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(flowConfig).where(eq(flowConfig.configKey, key)).limit(1);
  return r[0] ?? undefined;
}

// ─── DASHBOARD STATS ─────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb(); if (!db) return null;
  const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patients);
  const [alertCount] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.status, "ativo"));
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(prescriptionReports).where(eq(prescriptionReports.status, "aberto"));
  const [consultantCount] = await db.select({ count: sql<number>`count(*)` }).from(consultants).where(eq(consultants.isActive, true));
  const [flagCount] = await db.select({ count: sql<number>`count(*)` }).from(clinicalFlags).where(eq(clinicalFlags.status, "pendente"));
  const [prescriptionCount] = await db.select({ count: sql<number>`count(*)` }).from(prescriptions).where(eq(prescriptions.status, "ativa"));
  const [medicationCount] = await db.select({ count: sql<number>`count(*)` }).from(medications);
  const funnelStats = await listFunnelStats();
  return {
    totalPatients: patientCount?.count ?? 0,
    activeAlerts: alertCount?.count ?? 0,
    openReports: reportCount?.count ?? 0,
    activeConsultants: consultantCount?.count ?? 0,
    pendingFlags: flagCount?.count ?? 0,
    activePrescriptions: prescriptionCount?.count ?? 0,
    totalMedications: medicationCount?.count ?? 0,
    funnelStats,
  };
}

// ─── CLINICAL SYSTEMS HELPERS ────────────────────────────────
export async function listClinicalSystems(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(clinicalSystems).where(eq(clinicalSystems.patientId, patientId)).orderBy(asc(clinicalSystems.system));
}
export async function createClinicalSystem(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(clinicalSystems).values(data);
  return r[0].insertId;
}
export async function updateClinicalSystem(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(clinicalSystems).set(data).where(eq(clinicalSystems.id, id));
}
export async function deleteClinicalSystem(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(clinicalSystems).where(eq(clinicalSystems.id, id));
}

// ─── SLEEP DETAIL HELPERS ────────────────────────────────────
export async function listSleepDetails(patientId: number, limit = 30) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(sleepDetails).where(eq(sleepDetails.patientId, patientId)).orderBy(desc(sleepDetails.createdAt)).limit(limit);
}
export async function createSleepDetail(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(sleepDetails).values(data);
  return r[0].insertId;
}

// ─── PHYSICAL ACTIVITY DETAIL HELPERS ────────────────────────
export async function listPhysicalActivityDetails(patientId: number, limit = 30) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(physicalActivityDetails).where(eq(physicalActivityDetails.patientId, patientId)).orderBy(desc(physicalActivityDetails.createdAt)).limit(limit);
}
export async function createPhysicalActivityDetail(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(physicalActivityDetails).values(data);
  return r[0].insertId;
}

// ─── POLYPHARMACY RULES HELPERS ──────────────────────────────
export async function listPolypharmacyRules() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(polypharmacyRules).where(eq(polypharmacyRules.isActive, true));
}
export async function createPolypharmacyRule(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(polypharmacyRules).values(data);
  return r[0].insertId;
}
export async function updatePolypharmacyRule(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(polypharmacyRules).set(data).where(eq(polypharmacyRules.id, id));
}

export async function checkPolypharmacy(patientId: number) {
  const db = await getDb(); if (!db) return { alerts: [], totalMeds: 0 };
  const meds = await db.select().from(medications).where(and(eq(medications.patientId, patientId), eq(medications.isActive, true)));
  const rules = await listPolypharmacyRules();
  const result: { type: string; description: string; severity: string }[] = [];
  
  // Check threshold rules
  const thresholdRules = rules.filter(r => r.interactionType === 'limiar_polifarmacia' && r.threshold);
  for (const rule of thresholdRules) {
    if (meds.length >= (rule.threshold ?? 999)) {
      result.push({ type: 'limiar_polifarmacia', description: rule.description, severity: (rule.threshold ?? 0) >= 10 ? 'grave' : 'moderado' });
    }
  }
  
  // Check interaction rules
  const interactionRules = rules.filter(r => r.interactionType !== 'limiar_polifarmacia');
  const medNames = meds.map(m => m.name.toLowerCase());
  for (const rule of interactionRules) {
    const hasA = medNames.some(n => n.includes(rule.medicationA.toLowerCase()));
    const hasB = rule.medicationB ? medNames.some(n => n.includes(rule.medicationB!.toLowerCase())) : false;
    if (hasA && hasB) {
      result.push({ type: rule.interactionType, description: rule.description, severity: rule.interactionType === 'contraindicacao' ? 'grave' : 'moderado' });
    }
  }
  
  return { alerts: result, totalMeds: meds.length };
}

// ─── TEAM QUEUE HELPERS ──────────────────────────────────────
export async function listTeamQueue(profile?: string) {
  const db = await getDb(); if (!db) return [];
  if (profile && profile !== 'todos') {
    return db.select().from(teamQueue).where(eq(teamQueue.assignedProfile, profile as any)).orderBy(desc(teamQueue.createdAt));
  }
  return db.select().from(teamQueue).orderBy(desc(teamQueue.createdAt));
}
export async function createTeamQueueItem(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(teamQueue).values(data);
  return r[0].insertId;
}
export async function updateTeamQueueItem(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(teamQueue).set(data).where(eq(teamQueue.id, id));
}

// ─── PROTOCOL DOCUMENT HELPERS ───────────────────────────────
export async function listProtocolDocuments(patientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(protocolDocuments).where(eq(protocolDocuments.patientId, patientId)).orderBy(desc(protocolDocuments.createdAt));
}
export async function createProtocolDocument(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(protocolDocuments).values(data);
  return r[0].insertId;
}
export async function updateProtocolDocument(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(protocolDocuments).set(data).where(eq(protocolDocuments.id, id));
}

// ─── CLINICS (multi-tenancy) ────────────────────────────────
export async function createClinic(data: { slug: string; name: string; ownerUserId: number; logoUrl?: string; primaryColor?: string; secondaryColor?: string; phone?: string; email?: string; address?: string; cnpj?: string; plan?: "starter" | "pro" | "enterprise"; maxPatients?: number; maxConsultants?: number }) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(clinics).values(data).$returningId();
  return result;
}

export async function listClinics() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(clinics).orderBy(clinics.name);
}

export async function getClinicBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(clinics).where(eq(clinics.slug, slug)).limit(1);
  return rows[0];
}

export async function getClinicById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  return rows[0];
}

export async function updateClinic(id: number, data: Partial<{ name: string; slug: string; logoUrl: string; primaryColor: string; secondaryColor: string; phone: string; email: string; address: string; cnpj: string; plan: "starter" | "pro" | "enterprise"; maxPatients: number; maxConsultants: number; isActive: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(clinics).set(data).where(eq(clinics.id, id));
}

// ═══════════════════════════════════════════════════════════
// V10 — BRAÇOS DE ENTRADA + GOVERNANÇA + DISPATCHER FARMÁCIA
// ═══════════════════════════════════════════════════════════

// ─── ENTRY CHANNEL HELPERS ────────────────────────────────────
export async function listEntryChannels(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(entryChannels).where(eq(entryChannels.clinicId, clinicId)).orderBy(desc(entryChannels.createdAt));
  return db.select().from(entryChannels).orderBy(desc(entryChannels.createdAt));
}

export async function createEntryChannel(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(entryChannels).values(data);
  return r[0].insertId;
}

export async function updateEntryChannel(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(entryChannels).set(data).where(eq(entryChannels.id, id));
}

export async function deleteEntryChannel(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(entryChannels).where(eq(entryChannels.id, id));
}

// ─── ENTRY LEAD HELPERS ──────────────────────────────────────
export async function listEntryLeads(opts?: { clinicId?: number; channelType?: string; status?: string; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions: any[] = [];
  if (opts?.clinicId) conditions.push(eq(entryLeads.clinicId, opts.clinicId));
  if (opts?.channelType) conditions.push(eq(entryLeads.channelType, opts.channelType as any));
  if (opts?.status) conditions.push(eq(entryLeads.status, opts.status as any));
  const query = conditions.length > 0
    ? db.select().from(entryLeads).where(and(...conditions)).orderBy(desc(entryLeads.createdAt))
    : db.select().from(entryLeads).orderBy(desc(entryLeads.createdAt));
  return opts?.limit ? query.limit(opts.limit) : query;
}

export async function createEntryLead(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(entryLeads).values(data);
  return r[0].insertId;
}

export async function updateEntryLead(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(entryLeads).set(data).where(eq(entryLeads.id, id));
}

export async function getEntryLead(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(entryLeads).where(eq(entryLeads.id, id)).limit(1);
  return r[0] ?? undefined;
}

export async function getLeadStats(clinicId?: number) {
  const db = await getDb(); if (!db) return {};
  const conditions = clinicId ? [eq(entryLeads.clinicId, clinicId)] : [];
  const allLeads = conditions.length > 0
    ? await db.select().from(entryLeads).where(and(...conditions))
    : await db.select().from(entryLeads);

  const byChannel: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const lead of allLeads) {
    byChannel[lead.channelType] = (byChannel[lead.channelType] || 0) + 1;
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
  }
  return { total: allLeads.length, byChannel, byStatus };
}

// ─── PHARMACY HELPERS ─────────────────────────────────────────
export async function listPharmacies(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(pharmacies).where(eq(pharmacies.clinicId, clinicId)).orderBy(desc(pharmacies.createdAt));
  return db.select().from(pharmacies).orderBy(desc(pharmacies.createdAt));
}

export async function createPharmacy(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(pharmacies).values(data);
  return r[0].insertId;
}

export async function updatePharmacy(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(pharmacies).set(data).where(eq(pharmacies.id, id));
}

export async function getPharmacy(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(pharmacies).where(eq(pharmacies.id, id)).limit(1);
  return r[0] ?? undefined;
}

// ─── PRESCRIPTION DISPATCH HELPERS ────────────────────────────
export async function listDispatches(opts?: { prescriptionId?: number; pharmacyId?: number; status?: string; clinicId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions: any[] = [];
  if (opts?.prescriptionId) conditions.push(eq(prescriptionDispatches.prescriptionId, opts.prescriptionId));
  if (opts?.pharmacyId) conditions.push(eq(prescriptionDispatches.pharmacyId, opts.pharmacyId));
  if (opts?.status) conditions.push(eq(prescriptionDispatches.status, opts.status as any));
  if (opts?.clinicId) conditions.push(eq(prescriptionDispatches.clinicId, opts.clinicId));
  if (conditions.length > 0) return db.select().from(prescriptionDispatches).where(and(...conditions)).orderBy(desc(prescriptionDispatches.createdAt));
  return db.select().from(prescriptionDispatches).orderBy(desc(prescriptionDispatches.createdAt));
}

export async function createDispatch(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(prescriptionDispatches).values(data);
  return r[0].insertId;
}

export async function updateDispatch(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(prescriptionDispatches).set(data).where(eq(prescriptionDispatches.id, id));
}

export async function getDispatch(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(prescriptionDispatches).where(eq(prescriptionDispatches.id, id)).limit(1);
  return r[0] ?? undefined;
}

export async function getDispatchStats(clinicId?: number) {
  const db = await getDb(); if (!db) return {};
  const conditions = clinicId ? [eq(prescriptionDispatches.clinicId, clinicId)] : [];
  const allDispatches = conditions.length > 0
    ? await db.select().from(prescriptionDispatches).where(and(...conditions))
    : await db.select().from(prescriptionDispatches);

  const byStatus: Record<string, number> = {};
  let totalValue = 0;
  let totalCommission = 0;
  for (const d of allDispatches) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    totalValue += Number(d.totalValue || 0);
    totalCommission += Number(d.commissionValue || 0);
  }
  return { total: allDispatches.length, byStatus, totalValue, totalCommission };
}

// ─── VALIDATION CASCADE HELPERS ───────────────────────────────
export async function listValidationCascade(opts?: { entityType?: string; entityId?: number; patientId?: number; status?: string; clinicId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions: any[] = [];
  if (opts?.entityType) conditions.push(eq(validationCascade.entityType, opts.entityType as any));
  if (opts?.entityId) conditions.push(eq(validationCascade.entityId, opts.entityId));
  if (opts?.patientId) conditions.push(eq(validationCascade.patientId, opts.patientId));
  if (opts?.status) conditions.push(eq(validationCascade.status, opts.status as any));
  if (opts?.clinicId) conditions.push(eq(validationCascade.clinicId, opts.clinicId));
  if (conditions.length > 0) return db.select().from(validationCascade).where(and(...conditions)).orderBy(desc(validationCascade.createdAt));
  return db.select().from(validationCascade).orderBy(desc(validationCascade.createdAt));
}

export async function createValidationEntry(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(validationCascade).values(data);
  return r[0].insertId;
}

export async function updateValidationEntry(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(validationCascade).set(data).where(eq(validationCascade.id, id));
}

export async function getValidationEntry(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(validationCascade).where(eq(validationCascade.id, id)).limit(1);
  return r[0] ?? undefined;
}

// ─── PROFESSIONAL TRUST HELPERS ───────────────────────────────
export async function listProfessionalTrust(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(professionalTrust).where(eq(professionalTrust.clinicId, clinicId)).orderBy(desc(professionalTrust.createdAt));
  return db.select().from(professionalTrust).orderBy(desc(professionalTrust.createdAt));
}

export async function createProfessionalTrust(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(professionalTrust).values(data);
  return r[0].insertId;
}

export async function updateProfessionalTrust(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(professionalTrust).set(data).where(eq(professionalTrust.id, id));
}

export async function getProfessionalTrustByProfessional(professionalId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(professionalTrust).where(and(eq(professionalTrust.professionalId, professionalId), eq(professionalTrust.isActive, true))).limit(1);
  return r[0] ?? undefined;
}

// ─── VALIDATION CONFIG HELPERS ────────────────────────────────
export async function listValidationConfig(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(validationConfig).where(eq(validationConfig.clinicId, clinicId)).orderBy(desc(validationConfig.createdAt));
  return db.select().from(validationConfig).orderBy(desc(validationConfig.createdAt));
}

export async function createValidationConfig(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(validationConfig).values(data);
  return r[0].insertId;
}

export async function updateValidationConfig(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(validationConfig).set(data).where(eq(validationConfig.id, id));
}

export async function getValidationConfigForItem(itemType: string, clinicId?: number) {
  const db = await getDb(); if (!db) return undefined;
  const conditions = [eq(validationConfig.itemType, itemType)];
  if (clinicId) conditions.push(eq(validationConfig.clinicId, clinicId));
  const r = await db.select().from(validationConfig).where(and(...conditions)).limit(1);
  return r[0] ?? undefined;
}

// ═══════════════════════════════════════════════════════════
// V10.1 — GRAUS DE CONDUTA + WEBHOOK + DELIVERY CONFIG
// ═══════════════════════════════════════════════════════════

// ─── CONDUCT GRADE HELPERS ────────────────────────────────────
export async function listConductGrades(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(conductGrades).where(eq(conductGrades.clinicId, clinicId)).orderBy(asc(conductGrades.sortOrder));
  return db.select().from(conductGrades).orderBy(asc(conductGrades.sortOrder));
}

export async function createConductGrade(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(conductGrades).values(data);
  return r[0].insertId;
}

export async function updateConductGrade(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(conductGrades).set(data).where(eq(conductGrades.id, id));
}

// ─── WEBHOOK ENDPOINT HELPERS ─────────────────────────────────
export async function listWebhookEndpoints(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(webhookEndpoints).where(eq(webhookEndpoints.clinicId, clinicId)).orderBy(desc(webhookEndpoints.createdAt));
  return db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt));
}

export async function createWebhookEndpoint(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(webhookEndpoints).values(data);
  return r[0].insertId;
}

export async function updateWebhookEndpoint(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(webhookEndpoints).set(data).where(eq(webhookEndpoints.id, id));
}

export async function getWebhookEndpointByToken(token: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.secretToken, token)).limit(1);
  return r[0] ?? undefined;
}

// ─── RECIPE DELIVERY CONFIG HELPERS ───────────────────────────
export async function getRecipeDeliveryConfig(clinicId?: number) {
  const db = await getDb(); if (!db) return undefined;
  if (clinicId) {
    const r = await db.select().from(recipeDeliveryConfig).where(eq(recipeDeliveryConfig.clinicId, clinicId)).limit(1);
    return r[0] ?? undefined;
  }
  const r = await db.select().from(recipeDeliveryConfig).limit(1);
  return r[0] ?? undefined;
}

export async function upsertRecipeDeliveryConfig(data: any) {
  const db = await getDb(); if (!db) return null;
  // Try to find existing
  const existing = data.clinicId
    ? await db.select().from(recipeDeliveryConfig).where(eq(recipeDeliveryConfig.clinicId, data.clinicId)).limit(1)
    : await db.select().from(recipeDeliveryConfig).limit(1);
  if (existing[0]) {
    await db.update(recipeDeliveryConfig).set(data).where(eq(recipeDeliveryConfig.id, existing[0].id));
    return existing[0].id;
  }
  const r = await db.insert(recipeDeliveryConfig).values(data);
  return r[0].insertId;
}

// ─── QUICK ANAMNESIS TEMPLATE HELPERS ─────────────────────────
export async function listQuickAnamnesisTemplates(clinicId?: number) {
  const db = await getDb(); if (!db) return [];
  if (clinicId) return db.select().from(quickAnamnesisTemplates).where(eq(quickAnamnesisTemplates.clinicId, clinicId)).orderBy(desc(quickAnamnesisTemplates.createdAt));
  return db.select().from(quickAnamnesisTemplates).orderBy(desc(quickAnamnesisTemplates.createdAt));
}

export async function createQuickAnamnesisTemplate(data: any) {
  const db = await getDb(); if (!db) return null;
  const r = await db.insert(quickAnamnesisTemplates).values(data);
  return r[0].insertId;
}

export async function updateQuickAnamnesisTemplate(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(quickAnamnesisTemplates).set(data).where(eq(quickAnamnesisTemplates.id, id));
}

// ─── REGULATORY COMPETENCE (Score Competência Reguladora) ─────
export async function listRegulatoryCompetence(opts?: { clinicId?: number; category?: string; validationLevel?: string }) {
  const db = await getDb(); if (!db) return [];
  const conditions: any[] = [eq(regulatoryCompetence.isActive, true)];
  if (opts?.clinicId) conditions.push(eq(regulatoryCompetence.clinicId, opts.clinicId));
  if (opts?.category) conditions.push(eq(regulatoryCompetence.itemCategory, opts.category as any));
  if (opts?.validationLevel) conditions.push(eq(regulatoryCompetence.autoValidationLevel, opts.validationLevel as any));
  return db.select().from(regulatoryCompetence).where(and(...conditions)).orderBy(regulatoryCompetence.regulatoryScore);
}

export async function getRegulatoryCompetence(id: number) {
  const db = await getDb(); if (!db) return null;
  const [row] = await db.select().from(regulatoryCompetence).where(eq(regulatoryCompetence.id, id)).limit(1);
  return row ?? null;
}

export async function createRegulatoryCompetence(data: {
  itemName: string; itemCategory: string; administrationRoute: string;
  regulatoryScore: number; canMedico?: boolean; canEnfermeiro?: boolean;
  canFarmaceutico?: boolean; canBiomedico?: boolean; canNutricionista?: boolean;
  canPsicologo?: boolean; requiresCRM?: boolean; requiresSpecialPrescription?: boolean;
  prescriptionType?: string; autoValidationLevel: string;
  regulatoryNotes?: string; legalBasis?: string; exampleDosage?: string;
  therapeuticGroup?: string; clinicId?: number;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(regulatoryCompetence).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateRegulatoryCompetence(id: number, data: Partial<{
  itemName: string; itemCategory: string; administrationRoute: string;
  regulatoryScore: number; canMedico: boolean; canEnfermeiro: boolean;
  canFarmaceutico: boolean; canBiomedico: boolean; canNutricionista: boolean;
  canPsicologo: boolean; requiresCRM: boolean; requiresSpecialPrescription: boolean;
  prescriptionType: string; autoValidationLevel: string;
  regulatoryNotes: string; legalBasis: string; exampleDosage: string;
  therapeuticGroup: string; isActive: boolean; clinicId: number;
}>) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.update(regulatoryCompetence).set(data as any).where(eq(regulatoryCompetence.id, id));
  return getRegulatoryCompetence(id);
}

// Motor de resolução: dado item + profissional → pode/não pode + nível
export async function resolveCompetence(itemId: number, professionalRole: string) {
  const item = await getRegulatoryCompetence(itemId);
  if (!item) return { allowed: false, reason: "Item não encontrado", level: "N3" as const };
  
  const roleMap: Record<string, keyof typeof item> = {
    medico: "canMedico", medico_consultor: "canMedico", medico_assistente: "canMedico",
    enfermeiro: "canEnfermeiro", farmaceutico: "canFarmaceutico",
    biomedico: "canBiomedico", nutricionista: "canNutricionista",
    psicologo: "canPsicologo",
  };
  
  const field = roleMap[professionalRole];
  const allowed = field ? Boolean(item[field]) : false;
  
  return {
    allowed,
    reason: allowed 
      ? `${professionalRole} pode prescrever ${item.itemName}`
      : `${professionalRole} NÃO pode prescrever ${item.itemName}. Requer: ${item.requiresCRM ? "CRM médico" : "profissional habilitado"}`,
    level: item.autoValidationLevel as "N1" | "N2" | "N3",
    requiresCRM: item.requiresCRM,
    prescriptionType: item.prescriptionType,
    regulatoryScore: item.regulatoryScore,
  };
}

// ═══════════════════════════════════════════════════════════════
// V11 — Appointments, Notifications, Trello, PWA Sync
// ═══════════════════════════════════════════════════════════════

// ─── APPOINTMENTS ─────────────────────────────────────────────
export async function listAppointments(opts?: { patientId?: number; professionalId?: number; status?: string; clinicId?: number; from?: Date; to?: Date }) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(appointments).orderBy(desc(appointments.scheduledAt));
  const conditions: any[] = [];
  if (opts?.patientId) conditions.push(eq(appointments.patientId, opts.patientId));
  if (opts?.clinicId) conditions.push(eq(appointments.clinicId, opts.clinicId));
  if (opts?.status) conditions.push(eq(appointments.status, opts.status as any));
  if (conditions.length) q = q.where(and(...conditions)) as any;
  return q;
}

export async function getAppointment(id: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(appointments).where(eq(appointments.id, id));
  return rows[0] ?? null;
}

export async function createAppointment(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(appointments).values(data);
  return result.insertId;
}

export async function updateAppointment(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(appointments).where(eq(appointments.id, id));
}

// ─── INTERNAL NOTIFICATIONS ───────────────────────────────────
export async function listNotifications(opts?: { recipientId?: number; isRead?: boolean; type?: string; clinicId?: number; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(internalNotifications).orderBy(desc(internalNotifications.createdAt));
  const conditions: any[] = [];
  if (opts?.recipientId) conditions.push(eq(internalNotifications.recipientId, opts.recipientId));
  if (opts?.isRead !== undefined) conditions.push(eq(internalNotifications.isRead, opts.isRead));
  if (opts?.clinicId) conditions.push(eq(internalNotifications.clinicId, opts.clinicId));
  if (opts?.type) conditions.push(eq(internalNotifications.type, opts.type as any));
  if (conditions.length) q = q.where(and(...conditions)) as any;
  if (opts?.limit) q = q.limit(opts.limit) as any;
  return q;
}

export async function createNotification(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(internalNotifications).values(data);
  return result.insertId;
}

export async function markNotificationRead(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(internalNotifications).set({ isRead: true, readAt: new Date() }).where(eq(internalNotifications.id, id));
}

export async function markAllNotificationsRead(recipientId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(internalNotifications).set({ isRead: true, readAt: new Date() }).where(
    and(eq(internalNotifications.recipientId, recipientId), eq(internalNotifications.isRead, false))
  );
}

export async function getUnreadCount(recipientId: number) {
  const db = await getDb(); if (!db) return 0;
  const rows = await db.select().from(internalNotifications).where(
    and(eq(internalNotifications.recipientId, recipientId), eq(internalNotifications.isRead, false))
  );
  return rows.length;
}

// ─── TRELLO CARDS ─────────────────────────────────────────────
export async function listTrelloCards(opts?: { entityType?: string; syncStatus?: string; clinicId?: number }) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(trelloCards).orderBy(desc(trelloCards.createdAt));
  const conditions: any[] = [];
  if (opts?.entityType) conditions.push(eq(trelloCards.entityType, opts.entityType as any));
  if (opts?.syncStatus) conditions.push(eq(trelloCards.syncStatus, opts.syncStatus as any));
  if (opts?.clinicId) conditions.push(eq(trelloCards.clinicId, opts.clinicId));
  if (conditions.length) q = q.where(and(...conditions)) as any;
  return q;
}

export async function createTrelloCard(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(trelloCards).values(data);
  return result.insertId;
}

export async function updateTrelloCard(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(trelloCards).set(data).where(eq(trelloCards.id, id));
}

// ─── TRELLO CONFIG ────────────────────────────────────────────
export async function getTrelloConfig(clinicId?: number) {
  const db = await getDb(); if (!db) return null;
  const conditions: any[] = [];
  if (clinicId) conditions.push(eq(trelloConfig.clinicId, clinicId));
  const rows = conditions.length
    ? await db.select().from(trelloConfig).where(and(...conditions))
    : await db.select().from(trelloConfig);
  return rows[0] ?? null;
}

export async function upsertTrelloConfig(data: any) {
  const db = await getDb(); if (!db) return null;
  const existing = await getTrelloConfig(data.clinicId);
  if (existing) {
    await db.update(trelloConfig).set(data).where(eq(trelloConfig.id, existing.id));
    return existing.id;
  }
  const [result] = await db.insert(trelloConfig).values(data);
  return result.insertId;
}

// ─── PWA SYNC QUEUE ───────────────────────────────────────────
export async function listPwaSyncQueue(opts?: { status?: string; patientId?: number; clinicId?: number }) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(pwaSyncQueue).orderBy(desc(pwaSyncQueue.createdAt));
  const conditions: any[] = [];
  if (opts?.status) conditions.push(eq(pwaSyncQueue.status, opts.status as any));
  if (opts?.patientId) conditions.push(eq(pwaSyncQueue.patientId, opts.patientId));
  if (opts?.clinicId) conditions.push(eq(pwaSyncQueue.clinicId, opts.clinicId));
  if (conditions.length) q = q.where(and(...conditions)) as any;
  return q;
}

export async function createPwaSyncEntry(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(pwaSyncQueue).values(data);
  return result.insertId;
}

export async function updatePwaSyncEntry(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(pwaSyncQueue).set(data).where(eq(pwaSyncQueue.id, id));
}

export async function processPwaSyncEntry(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(pwaSyncQueue).set({ status: "sincronizado" as any, resolvedAt: new Date() }).where(eq(pwaSyncQueue.id, id));
}
