import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "dr@padcom.com",
      name: "Dr. Teste",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── ROUTER STRUCTURE ─────────────────────────────────────────
describe("PADCOM GLOBAL - Router Structure", () => {
  it("should have all 12 required routers registered", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.auth).toBeDefined();
    expect(caller.patient).toBeDefined();
    expect(caller.consultant).toBeDefined();
    expect(caller.question).toBeDefined();
    expect(caller.anamnesis).toBeDefined();
    expect(caller.prescription).toBeDefined();
    expect(caller.dailyReport).toBeDefined();
    expect(caller.prescriptionReport).toBeDefined();
    expect(caller.alert).toBeDefined();
    expect(caller.exam).toBeDefined();
    expect(caller.followUp).toBeDefined();
    expect(caller.dashboard).toBeDefined();
  });

  it("should have alert.rules sub-router for configurable rules", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.alert.rules).toBeDefined();
    expect(caller.alert.rules.list).toBeDefined();
    expect(caller.alert.rules.create).toBeDefined();
    expect(caller.alert.rules.update).toBeDefined();
  });

  it("should have dashboard.patientTimeline endpoint for longitudinal data", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.dashboard.patientTimeline).toBeDefined();
    expect(caller.dashboard.stats).toBeDefined();
    expect(caller.dashboard.auditLog).toBeDefined();
  });
});

// ─── AUTHENTICATION ───────────────────────────────────────────
describe("PADCOM GLOBAL - Authentication", () => {
  it("should return user from auth.me for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Dr. Teste");
    expect(result?.role).toBe("admin");
  });

  it("should return null from auth.me for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("should handle logout correctly", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      ...createMockContext(),
      res: {
        clearCookie: (name: string, options: any) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBe(1);
  });
});

// ─── PROTECTED vs PUBLIC ROUTES ───────────────────────────────
describe("PADCOM GLOBAL - Protected vs Public Routes", () => {
  it("should allow getByToken without authentication (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.patient.getByToken({ token: "test-token-123" });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("should allow prescriptionReport.create without authentication (public for patient portal)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.prescriptionReport.create({
        token: "test-token",
        prescriptionId: 1,
        reportType: "reacao_adversa",
        severity: "leve",
        description: "Queimação ao usar a fórmula",
      });
    } catch (e: any) {
      // Should fail with NOT_FOUND (no patient with that token), not UNAUTHORIZED
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("should reject patient.list without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.patient.list()).rejects.toThrow();
  });

  it("should reject dashboard.stats without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });

  it("should reject alert.list without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.alert.list()).rejects.toThrow();
  });

  it("should reject question.create for non-admin users", async () => {
    const caller = appRouter.createCaller(createMockContext("user"));
    await expect(
      caller.question.create({
        questionText: "Test",
        section: "Test",
        fieldType: "text",
        category: "integrativa",
      })
    ).rejects.toThrow();
  });

  it("should reject consultant.create for non-admin users", async () => {
    const caller = appRouter.createCaller(createMockContext("user"));
    await expect(
      caller.consultant.create({
        name: "Test Consultant",
        role: "enfermeira",
        email: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("should reject alert.rules.create for non-admin users", async () => {
    const caller = appRouter.createCaller(createMockContext("user"));
    await expect(
      caller.alert.rules.create({
        name: "Test Rule",
        source: "exam",
        condition: "GGT > 50",
        alertCategory: "Exame Alterado",
      })
    ).rejects.toThrow();
  });
});

// ─── PATIENT VALIDATION ───────────────────────────────────────
describe("PADCOM GLOBAL - Patient Validation", () => {
  it("should reject patient creation with empty name", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.patient.create({ name: "" })
    ).rejects.toThrow();
  });

  it("should validate patient get requires numeric id", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.patient.get({ id: NaN })
    ).rejects.toBeDefined();
  });
});

// ─── QUESTION VALIDATION (3 categories) ───────────────────────
describe("PADCOM GLOBAL - Question Validation", () => {
  it("should validate question creation requires text and section", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.question.create({
        questionText: "",
        section: "",
        fieldType: "text",
        category: "integrativa",
      })
    ).rejects.toThrow();
  });

  it("should accept all three question categories: integrativa, estetica, relato_diario", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const categories = ["integrativa", "estetica", "relato_diario"] as const;
    for (const category of categories) {
      try {
        await caller.question.create({
          questionText: `Pergunta de ${category}`,
          section: "Teste",
          fieldType: "text",
          category,
        });
      } catch (e: any) {
        // DB error is expected, but input validation should pass
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });

  it("should reject invalid question category", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.question.create({
        questionText: "Test",
        section: "Test",
        fieldType: "text",
        category: "invalid_category" as any,
      })
    ).rejects.toThrow();
  });

  it("should accept all valid field types", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const fieldTypes = ["text", "number", "scale", "select", "multiselect", "checkbox", "date", "textarea"] as const;
    for (const fieldType of fieldTypes) {
      try {
        await caller.question.create({
          questionText: `Pergunta tipo ${fieldType}`,
          section: "Teste",
          fieldType,
          category: "integrativa",
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

// ─── DAILY REPORT VALIDATION ──────────────────────────────────
describe("PADCOM GLOBAL - Daily Report Validation", () => {
  it("should reject invalid period value", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.dailyReport.create({
        patientId: 1,
        reportDate: "2026-04-17",
        period: "invalid" as any,
        sleep: "5",
        energy: "5",
      })
    ).rejects.toThrow();
  });

  it("should accept all valid period values: manha, tarde, noite", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const periods = ["manha", "tarde", "noite"] as const;
    for (const period of periods) {
      try {
        await caller.dailyReport.create({
          patientId: 1,
          reportDate: "2026-04-17",
          period,
          sleep: "7",
          energy: "8",
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

// ─── PRESCRIPTION REPORT & AUTO-ALERT ─────────────────────────
describe("PADCOM GLOBAL - Prescription Report & Auto-Alert", () => {
  it("should validate prescription report requires description", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.prescriptionReport.create({
        prescriptionId: 1,
        patientId: 1,
        reportType: "reacao_adversa",
        severity: "leve",
        description: "",
      })
    ).rejects.toThrow();
  });

  it("should accept all valid report types", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const types = ["reacao_adversa", "melhora", "sem_efeito", "duvida", "outro"] as const;
    for (const reportType of types) {
      try {
        await caller.prescriptionReport.create({
          prescriptionId: 1,
          patientId: 1,
          reportType,
          description: `Relato de ${reportType}`,
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });

  it("should accept all severity levels", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const severities = ["leve", "moderada", "grave"] as const;
    for (const severity of severities) {
      try {
        await caller.prescriptionReport.create({
          prescriptionId: 1,
          patientId: 1,
          reportType: "reacao_adversa",
          severity,
          description: `Reação ${severity}`,
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

// ─── ALERT VALIDATION ─────────────────────────────────────────
describe("PADCOM GLOBAL - Alert Validation", () => {
  it("should validate alert update requires valid status", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.alert.update({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("should accept all valid alert statuses", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const statuses = ["ativo", "em_analise", "resolvido", "descartado"] as const;
    for (const status of statuses) {
      try {
        await caller.alert.update({ id: 999, status });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });

  it("should accept alert rule creation with valid fields", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      await caller.alert.rules.create({
        name: "GGT Elevado",
        source: "exam",
        condition: "GGT > 50",
        alertCategory: "Exame Alterado",
        alertPriority: "alta",
      });
    } catch (e: any) {
      // DB error expected, but input validation should pass
      expect(e.message).not.toContain("invalid_enum_value");
    }
  });

  it("should accept valid alert rule creation with priority", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const priorities = ["baixa", "moderada", "alta", "critica"] as const;
    for (const alertPriority of priorities) {
      try {
        await caller.alert.rules.create({
          name: `Regra ${alertPriority}`,
          source: "exam",
          condition: "GGT > 50",
          alertCategory: "Exame Alterado",
          alertPriority,
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

// ─── EXAM VALIDATION ──────────────────────────────────────────
describe("PADCOM GLOBAL - Exam Validation", () => {
  it("should validate exam creation requires non-empty examName", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.exam.create({
        patientId: 1,
        examName: "",
        examDate: "2026-04-17",
      })
    ).rejects.toThrow();
  });
});

// ─── FOLLOW-UP SESSION VALIDATION ─────────────────────────────
describe("PADCOM GLOBAL - Follow-Up Session Validation", () => {
  it("should validate follow-up session type enum", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.followUp.create({
        patientId: 1,
        sessionDate: "2026-04-17",
        sessionType: "invalid_type" as any,
      })
    ).rejects.toThrow();
  });

  it("should accept valid session types: presencial, online", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const types = ["presencial", "online"] as const;
    for (const sessionType of types) {
      try {
        await caller.followUp.create({
          patientId: 1,
          sessionDate: "2026-04-17",
          sessionType,
          clinicalScore: "75",
          notes: "Sessão de teste",
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

// ─── ANAMNESIS SESSION VALIDATION ─────────────────────────────
describe("PADCOM GLOBAL - Anamnesis Session Validation", () => {
  it("should validate anamnesis session category", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.anamnesis.createSession({
        patientId: 1,
        category: "invalid" as any,
        conductedByType: "medico",
      })
    ).rejects.toThrow();
  });

  it("should accept valid anamnesis categories: integrativa, estetica", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const categories = ["integrativa", "estetica"] as const;
    for (const category of categories) {
      try {
        await caller.anamnesis.createSession({
          patientId: 1,
          category,
          conductedByType: "medico",
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });

  it("should validate conducted by type", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.anamnesis.createSession({
        patientId: 1,
        category: "integrativa",
        conductedByType: "invalid" as any,
      })
    ).rejects.toThrow();
  });
});

// ─── CONSULTANT VALIDATION ────────────────────────────────────
describe("PADCOM GLOBAL - Consultant Validation", () => {
  it("should validate consultant role enum", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.consultant.create({
        name: "Test",
        role: "invalid_role" as any,
        email: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("should accept valid consultant roles", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const roles = ["enfermeira", "biomedica", "nutricionista", "esteticista", "outro"] as const;
    for (const role of roles) {
      try {
        await caller.consultant.create({
          name: `Consultora ${role}`,
          role,
          email: `${role}@test.com`,
        });
      } catch (e: any) {
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});
