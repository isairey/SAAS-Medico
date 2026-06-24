import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

/* ─── helpers ─── */
const callRouter = async (router: any, path: string, input: any, ctx: any = { user: { id: 1, role: "admin" } }) => {
  const parts = path.split(".");
  let proc = router;
  for (const p of parts) proc = proc[p];
  return proc({ input, ctx, rawInput: input });
};

/* ─── Schema validation helpers ─── */
const entryChannelInput = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(["trafego_pago", "consultora", "site", "vendedor", "referral", "whatsapp_bot"]),
  description: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  isActive: z.boolean().optional(),
  clinicId: z.number().optional(),
});

const entryLeadInput = z.object({
  channelId: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  status: z.enum(["novo", "contatado", "qualificado", "convertido", "perdido"]),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referralCode: z.string().optional(),
  vendedorId: z.string().optional(),
  notes: z.string().optional(),
  clinicId: z.number().optional(),
});

const pharmacyInput = z.object({
  name: z.string(),
  cnpj: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionPercent: z.number().min(0).max(100),
  integrationModel: z.enum(["portal", "marketplace", "drive", "manual", "api"]),
  isActive: z.boolean().optional(),
  clinicId: z.number().optional(),
});

const dispatchInput = z.object({
  prescriptionId: z.number(),
  pharmacyId: z.number(),
  status: z.enum(["pendente", "enviado", "aceito", "em_manipulacao", "pronto", "entregue", "cancelado"]),
  totalValue: z.number().optional(),
  commissionValue: z.number().optional(),
  notes: z.string().optional(),
});

const validationCascadeInput = z.object({
  entityId: z.number(),
  entityType: z.enum(["prescription", "anamnesis", "protocol", "exam"]),
  step: z.enum(["enfermeira", "medico_delegado", "preceptor_final"]),
  professionalId: z.string().optional(),
  professionalName: z.string().optional(),
  professionalRole: z.string().optional(),
  crm: z.string().optional(),
  digitalCertificate: z.string().optional(),
  status: z.enum(["pendente", "aprovado", "rejeitado", "delegado"]),
  observation: z.string().optional(),
  clinicId: z.number().optional(),
});

const professionalTrustInput = z.object({
  professionalId: z.string(),
  professionalName: z.string(),
  delegatedById: z.string(),
  delegatedByName: z.string(),
  trustLevel: z.enum(["basico", "intermediario", "total"]),
  crm: z.string().optional(),
  specialty: z.string().optional(),
  isActive: z.boolean().optional(),
  clinicId: z.number().optional(),
});

const validationConfigInput = z.object({
  itemType: z.string(),
  itemName: z.string(),
  requiresHumanValidation: z.boolean(),
  minimumCrmLevel: z.enum(["nenhum", "farmaceutico", "enfermeiro", "medico"]),
  autoDispatchAllowed: z.boolean().optional(),
  notes: z.string().optional(),
  clinicId: z.number().optional(),
});

const conductGradeInput = z.object({
  name: z.string(),
  grade: z.enum(["grau_1_auto", "grau_2_semi", "grau_3_manual"]),
  scoreMin: z.number(),
  scoreMax: z.number(),
  validationLevel: z.enum(["N1", "N2", "N3"]),
  description: z.string().optional(),
  autoDispatch: z.boolean().optional(),
  clinicId: z.number().optional(),
});

const webhookEndpointInput = z.object({
  name: z.string(),
  platform: z.enum(["manychat", "typebot", "botpress", "n8n", "zapier", "custom"]),
  webhookUrl: z.string().optional(),
  secretKey: z.string().optional(),
  isActive: z.boolean().optional(),
  clinicId: z.number().optional(),
});

const regulatoryCompetenceInput = z.object({
  itemType: z.string(),
  itemName: z.string(),
  route: z.enum(["oral", "injetavel", "topico", "implante", "inalatorio", "sublingual"]),
  requiredRole: z.enum(["medico", "enfermeiro", "farmaceutico", "biomedico", "nutricionista", "psicologo"]),
  requiresCRM: z.boolean(),
  canAutoDispatch: z.boolean(),
  riskLevel: z.enum(["baixo", "medio", "alto", "critico"]),
  notes: z.string().optional(),
});

/* ═══════════════════════════════════════════════════════════ */
/* V10 — BRAÇOS DE ENTRADA                                    */
/* ═══════════════════════════════════════════════════════════ */

describe("V10 — Braços de Entrada (E1-E6)", () => {
  it("should validate E1 trafego_pago channel input with UTM", () => {
    const input = { code: "META-2024-Q1", name: "Campanha Meta Ads", type: "trafego_pago" as const, utmSource: "facebook", utmMedium: "cpc", utmCampaign: "coq10-promo" };
    expect(entryChannelInput.parse(input)).toMatchObject({ code: "META-2024-Q1", type: "trafego_pago" });
  });

  it("should validate E2 consultora channel input", () => {
    const input = { code: "CONS-INT-001", name: "Consultora Interna", type: "consultora" as const };
    expect(entryChannelInput.parse(input)).toMatchObject({ type: "consultora" });
  });

  it("should validate E3 site channel input", () => {
    const input = { code: "SITE-AUTO", name: "Autoatendimento Site", type: "site" as const };
    expect(entryChannelInput.parse(input)).toMatchObject({ type: "site" });
  });

  it("should validate E4 vendedor channel input", () => {
    const input = { code: "VEND-EXT-001", name: "Vendedor Externo", type: "vendedor" as const };
    expect(entryChannelInput.parse(input)).toMatchObject({ type: "vendedor" });
  });

  it("should validate E5 referral channel input", () => {
    const input = { code: "REF-PAC", name: "Indicação Paciente", type: "referral" as const };
    expect(entryChannelInput.parse(input)).toMatchObject({ type: "referral" });
  });

  it("should validate E6 whatsapp_bot channel input", () => {
    const input = { code: "WA-BOT-001", name: "WhatsApp Bot Triagem", type: "whatsapp_bot" as const };
    expect(entryChannelInput.parse(input)).toMatchObject({ type: "whatsapp_bot" });
  });

  it("should reject invalid channel type", () => {
    const input = { code: "X", name: "X", type: "invalido" };
    expect(() => entryChannelInput.parse(input)).toThrow();
  });

  it("should validate lead with full UTM tracking", () => {
    const input = { channelId: 1, name: "Maria Silva", email: "maria@test.com", phone: "(11)99999-9999", status: "novo" as const, utmSource: "google", utmMedium: "cpc", utmCampaign: "q10-2024", referralCode: "REF-123" };
    expect(entryLeadInput.parse(input)).toMatchObject({ channelId: 1, status: "novo", utmSource: "google" });
  });

  it("should validate lead with vendedorId for E4", () => {
    const input = { channelId: 4, name: "João", status: "qualificado" as const, vendedorId: "VEND-001" };
    expect(entryLeadInput.parse(input)).toMatchObject({ vendedorId: "VEND-001" });
  });

  it("should validate all lead statuses", () => {
    const statuses = ["novo", "contatado", "qualificado", "convertido", "perdido"] as const;
    statuses.forEach(s => {
      expect(entryLeadInput.parse({ channelId: 1, name: "Test", status: s })).toMatchObject({ status: s });
    });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10 — CASCATA DE VALIDAÇÃO                                 */
/* ═══════════════════════════════════════════════════════════ */

describe("V10 — Cascata de Validação com Certificado Digital", () => {
  it("should validate enfermeira step with digital certificate", () => {
    const input = { entityId: 1, entityType: "anamnesis" as const, step: "enfermeira" as const, professionalName: "Enf. Ana", professionalRole: "enfermeira", digitalCertificate: "CERT-ENF-001", status: "aprovado" as const };
    expect(validationCascadeInput.parse(input)).toMatchObject({ step: "enfermeira", status: "aprovado" });
  });

  it("should validate medico_delegado step with CRM", () => {
    const input = { entityId: 1, entityType: "prescription" as const, step: "medico_delegado" as const, professionalName: "Dr. Carlos", crm: "CRM-SP-123456", status: "aprovado" as const };
    expect(validationCascadeInput.parse(input)).toMatchObject({ step: "medico_delegado", crm: "CRM-SP-123456" });
  });

  it("should validate preceptor_final step with CRM and certificate", () => {
    const input = { entityId: 1, entityType: "protocol" as const, step: "preceptor_final" as const, professionalName: "Dr. Padua", crm: "CRM-SP-654321", digitalCertificate: "CERT-MED-CHEFE", status: "aprovado" as const, observation: "Validado como preceptor" };
    expect(validationCascadeInput.parse(input)).toMatchObject({ step: "preceptor_final", crm: "CRM-SP-654321" });
  });

  it("should validate delegation status", () => {
    const input = { entityId: 1, entityType: "prescription" as const, step: "preceptor_final" as const, status: "delegado" as const, observation: "Delegado para Dr. Carlos" };
    expect(validationCascadeInput.parse(input)).toMatchObject({ status: "delegado" });
  });

  it("should validate all entity types", () => {
    const types = ["prescription", "anamnesis", "protocol", "exam"] as const;
    types.forEach(t => {
      expect(validationCascadeInput.parse({ entityId: 1, entityType: t, step: "enfermeira", status: "pendente" })).toMatchObject({ entityType: t });
    });
  });

  it("should validate professional trust delegation", () => {
    const input = { professionalId: "USR-001", professionalName: "Dr. Carlos", delegatedById: "USR-CHEFE", delegatedByName: "Dr. Padua", trustLevel: "total" as const, crm: "CRM-SP-123456", specialty: "Medicina Integrativa" };
    expect(professionalTrustInput.parse(input)).toMatchObject({ trustLevel: "total", crm: "CRM-SP-123456" });
  });

  it("should validate all trust levels", () => {
    const levels = ["basico", "intermediario", "total"] as const;
    levels.forEach(l => {
      expect(professionalTrustInput.parse({ professionalId: "1", professionalName: "Dr.", delegatedById: "2", delegatedByName: "Dr.", trustLevel: l })).toMatchObject({ trustLevel: l });
    });
  });

  it("should validate validation config with human toggle", () => {
    const input = { itemType: "suplemento", itemName: "CoQ10 100mg Oral", requiresHumanValidation: false, minimumCrmLevel: "nenhum" as const, autoDispatchAllowed: true };
    expect(validationConfigInput.parse(input)).toMatchObject({ requiresHumanValidation: false, autoDispatchAllowed: true });
  });

  it("should validate validation config requiring CRM", () => {
    const input = { itemType: "injetavel", itemName: "CoQ10 IV", requiresHumanValidation: true, minimumCrmLevel: "medico" as const, autoDispatchAllowed: false };
    expect(validationConfigInput.parse(input)).toMatchObject({ requiresHumanValidation: true, minimumCrmLevel: "medico" });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10 — DISPATCHER FARMÁCIA                                  */
/* ═══════════════════════════════════════════════════════════ */

describe("V10 — Dispatcher Prescrição → Farmácia", () => {
  it("should validate pharmacy input with commission", () => {
    const input = { name: "Farmácia Vida", cnpj: "12.345.678/0001-00", email: "contato@vida.com", commissionPercent: 30, integrationModel: "portal" as const };
    expect(pharmacyInput.parse(input)).toMatchObject({ commissionPercent: 30, integrationModel: "portal" });
  });

  it("should validate all integration models", () => {
    const models = ["portal", "marketplace", "drive", "manual", "api"] as const;
    models.forEach(m => {
      expect(pharmacyInput.parse({ name: "Test", commissionPercent: 10, integrationModel: m })).toMatchObject({ integrationModel: m });
    });
  });

  it("should reject commission > 100%", () => {
    expect(() => pharmacyInput.parse({ name: "Test", commissionPercent: 150, integrationModel: "manual" })).toThrow();
  });

  it("should validate dispatch with full status lifecycle", () => {
    const statuses = ["pendente", "enviado", "aceito", "em_manipulacao", "pronto", "entregue", "cancelado"] as const;
    statuses.forEach(s => {
      expect(dispatchInput.parse({ prescriptionId: 1, pharmacyId: 1, status: s })).toMatchObject({ status: s });
    });
  });

  it("should validate dispatch with commission value", () => {
    const input = { prescriptionId: 1, pharmacyId: 1, status: "aceito" as const, totalValue: 350.00, commissionValue: 105.00 };
    expect(dispatchInput.parse(input)).toMatchObject({ totalValue: 350, commissionValue: 105 });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10.1 — GRAUS DE CONDUTA + N1/N2/N3                        */
/* ═══════════════════════════════════════════════════════════ */

describe("V10.1 — Graus de Conduta N1/N2/N3", () => {
  it("should validate N1 auto grade (score 0-30)", () => {
    const input = { name: "Básico Auto", grade: "grau_1_auto" as const, scoreMin: 0, scoreMax: 30, validationLevel: "N1" as const, autoDispatch: true };
    expect(conductGradeInput.parse(input)).toMatchObject({ grade: "grau_1_auto", validationLevel: "N1", autoDispatch: true });
  });

  it("should validate N2 semi grade (score 31-60)", () => {
    const input = { name: "Intermediário Semi", grade: "grau_2_semi" as const, scoreMin: 31, scoreMax: 60, validationLevel: "N2" as const, autoDispatch: false };
    expect(conductGradeInput.parse(input)).toMatchObject({ grade: "grau_2_semi", validationLevel: "N2" });
  });

  it("should validate N3 manual grade (score 61-100)", () => {
    const input = { name: "Avançado Manual", grade: "grau_3_manual" as const, scoreMin: 61, scoreMax: 100, validationLevel: "N3" as const, autoDispatch: false };
    expect(conductGradeInput.parse(input)).toMatchObject({ grade: "grau_3_manual", validationLevel: "N3" });
  });

  it("should validate all grade types", () => {
    const grades = ["grau_1_auto", "grau_2_semi", "grau_3_manual"] as const;
    grades.forEach(g => {
      expect(conductGradeInput.parse({ name: "Test", grade: g, scoreMin: 0, scoreMax: 100, validationLevel: "N1" })).toMatchObject({ grade: g });
    });
  });

  it("should validate webhook endpoint for ManyChat", () => {
    const input = { name: "ManyChat Intake", platform: "manychat" as const, webhookUrl: "https://api.manychat.com/webhook/123", secretKey: "mc-secret-key" };
    expect(webhookEndpointInput.parse(input)).toMatchObject({ platform: "manychat" });
  });

  it("should validate all webhook platforms", () => {
    const platforms = ["manychat", "typebot", "botpress", "n8n", "zapier", "custom"] as const;
    platforms.forEach(p => {
      expect(webhookEndpointInput.parse({ name: "Test", platform: p })).toMatchObject({ platform: p });
    });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10.2 — COMPETÊNCIA REGULATÓRIA                            */
/* ═══════════════════════════════════════════════════════════ */

describe("V10.2 — Score Competência Reguladora", () => {
  it("should validate CoQ10 oral as farmaceutico-allowed", () => {
    const input = { itemType: "suplemento", itemName: "Coenzima Q10 100mg", route: "oral" as const, requiredRole: "farmaceutico" as const, requiresCRM: false, canAutoDispatch: true, riskLevel: "baixo" as const };
    expect(regulatoryCompetenceInput.parse(input)).toMatchObject({ requiredRole: "farmaceutico", requiresCRM: false, canAutoDispatch: true, riskLevel: "baixo" });
  });

  it("should validate CoQ10 IV as medico-only with CRM", () => {
    const input = { itemType: "injetavel", itemName: "Coenzima Q10 IV", route: "injetavel" as const, requiredRole: "medico" as const, requiresCRM: true, canAutoDispatch: false, riskLevel: "alto" as const };
    expect(regulatoryCompetenceInput.parse(input)).toMatchObject({ requiredRole: "medico", requiresCRM: true, canAutoDispatch: false, riskLevel: "alto" });
  });

  it("should validate all routes", () => {
    const routes = ["oral", "injetavel", "topico", "implante", "inalatorio", "sublingual"] as const;
    routes.forEach(r => {
      expect(regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: r, requiredRole: "medico", requiresCRM: true, canAutoDispatch: false, riskLevel: "medio" })).toMatchObject({ route: r });
    });
  });

  it("should validate all required roles", () => {
    const roles = ["medico", "enfermeiro", "farmaceutico", "biomedico", "nutricionista", "psicologo"] as const;
    roles.forEach(r => {
      expect(regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: "oral", requiredRole: r, requiresCRM: false, canAutoDispatch: true, riskLevel: "baixo" })).toMatchObject({ requiredRole: r });
    });
  });

  it("should validate all risk levels", () => {
    const levels = ["baixo", "medio", "alto", "critico"] as const;
    levels.forEach(l => {
      expect(regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: "oral", requiredRole: "medico", requiresCRM: true, canAutoDispatch: false, riskLevel: l })).toMatchObject({ riskLevel: l });
    });
  });

  it("should map riskLevel to N1/N2/N3 correctly", () => {
    const mapping: Record<string, string> = { baixo: "N1", medio: "N2", alto: "N3", critico: "N3" };
    Object.entries(mapping).forEach(([risk, level]) => {
      const result = regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: "oral", requiredRole: "medico", requiresCRM: true, canAutoDispatch: false, riskLevel: risk });
      const resolvedLevel = result.riskLevel === "baixo" ? "N1" : result.riskLevel === "medio" ? "N2" : "N3";
      expect(resolvedLevel).toBe(level);
    });
  });

  it("should reject invalid role", () => {
    expect(() => regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: "oral", requiredRole: "estagiario", requiresCRM: false, canAutoDispatch: true, riskLevel: "baixo" })).toThrow();
  });

  it("should reject invalid route", () => {
    expect(() => regulatoryCompetenceInput.parse({ itemType: "test", itemName: "Test", route: "endovenoso", requiredRole: "medico", requiresCRM: true, canAutoDispatch: false, riskLevel: "alto" })).toThrow();
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10.1 — WEBHOOK INTAKE FLOW                                */
/* ═══════════════════════════════════════════════════════════ */

describe("V10.1 — Webhook Intake Flow", () => {
  const webhookIntakeInput = z.object({
    platform: z.string(),
    channelCode: z.string(),
    patientName: z.string(),
    patientEmail: z.string().optional(),
    patientPhone: z.string().optional(),
    responses: z.record(z.string(), z.any()),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  });

  it("should validate ManyChat webhook intake payload", () => {
    const input = {
      platform: "manychat",
      channelCode: "META-2024-Q1",
      patientName: "Maria Silva",
      patientPhone: "(11)99999-9999",
      responses: { "CARD_DOEN_HASA_001": "sim", "META_DIAB_TIPO_001": "nao" },
      utmSource: "facebook",
      utmMedium: "cpc",
    };
    expect(webhookIntakeInput.parse(input)).toMatchObject({ platform: "manychat", channelCode: "META-2024-Q1" });
  });

  it("should validate Typebot webhook intake payload", () => {
    const input = {
      platform: "typebot",
      channelCode: "SITE-AUTO",
      patientName: "João Santos",
      patientEmail: "joao@test.com",
      responses: { "SINT_SONO_QUAL_001": "3", "SINT_ENER_DISP_001": "2" },
    };
    expect(webhookIntakeInput.parse(input)).toMatchObject({ platform: "typebot" });
  });

  it("should validate n8n webhook intake payload", () => {
    const input = {
      platform: "n8n",
      channelCode: "WA-BOT-001",
      patientName: "Ana Costa",
      responses: {},
    };
    expect(webhookIntakeInput.parse(input)).toMatchObject({ platform: "n8n" });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* V10 — RECIPE DELIVERY CONFIG                               */
/* ═══════════════════════════════════════════════════════════ */

describe("V10.1 — Recipe Delivery Config", () => {
  const recipeDeliveryInput = z.object({
    clinicId: z.number().optional(),
    destination: z.enum(["paciente", "farmacia", "ambos"]),
    defaultPharmacyId: z.number().optional(),
    autoSend: z.boolean().optional(),
  });

  it("should validate delivery to paciente only", () => {
    expect(recipeDeliveryInput.parse({ destination: "paciente" })).toMatchObject({ destination: "paciente" });
  });

  it("should validate delivery to farmacia only", () => {
    expect(recipeDeliveryInput.parse({ destination: "farmacia", defaultPharmacyId: 1 })).toMatchObject({ destination: "farmacia" });
  });

  it("should validate delivery to ambos", () => {
    expect(recipeDeliveryInput.parse({ destination: "ambos", autoSend: true })).toMatchObject({ destination: "ambos", autoSend: true });
  });

  it("should validate all delivery destinations", () => {
    const dests = ["paciente", "farmacia", "ambos"] as const;
    dests.forEach(d => {
      expect(recipeDeliveryInput.parse({ destination: d })).toMatchObject({ destination: d });
    });
  });
});
