import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test",
    email: "admin@padcom.com",
    name: "Dr. Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("V2 Features - Scoring Engine", () => {
  it("should list scoring bands", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const bands = await caller.scoring.bands();
    expect(Array.isArray(bands)).toBe(true);
  });

  it("should list motor actions", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const actions = await caller.scoring.motorActions();
    expect(Array.isArray(actions)).toBe(true);
  });

  it("should create a motor action with valid data", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.scoring.createMotorAction({
      triggerCode: "TEST_TRIGGER",
      triggerCondition: "score < 3",
      actionType: "alerta",
      actionValue: "Solicitar avaliação urgente",
      priority: 5,
    });
    expect(result).toBeDefined();
  });

  it("should reject invalid action types", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.scoring.createMotorAction({
        triggerCode: "TEST",
        triggerCondition: "x",
        actionType: "invalid_type" as any,
        actionValue: "test",
        priority: 0,
      })
    ).rejects.toThrow();
  });
});

describe("V2 Features - Medication", () => {
  it("should create a medication with dosage matrix", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.medication.create({
      patientId: 1,
      name: "Levotiroxina",
      dosageUnit: "mcg",
      dosageValue: "50",
      morningQty: 1,
      afternoonQty: 0,
      nightQty: 0,
      associatedDisease: "Hipotireoidismo",
      notes: "Tomar em jejum",
    });
    expect(result).toBeDefined();
  });

  it("should require patient ID and name", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.medication.create({
        patientId: 0,
        name: "",
        dosageUnit: "mg",
      } as any)
    ).rejects.toThrow();
  });
});

describe("V2 Features - Clinical Flags", () => {
  it("should accept valid flag validation input", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Test schema validation - the mutation may succeed or fail on DB level
    // but the input schema should accept valid statuses
    try {
      await caller.clinicalFlag.validate({
        id: 1,
        status: "aprovado",
        notes: "Validado pelo médico",
      });
    } catch (e: any) {
      // DB-level errors are acceptable, schema errors are not
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should accept valid flag statuses", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Test that the validation schema accepts valid statuses
    const validStatuses = ["aprovado", "rejeitado"];
    for (const status of validStatuses) {
      // This tests the schema validation, not the DB
      try {
        await caller.clinicalFlag.validate({ id: 1, status: status as any });
      } catch (e: any) {
        // Expected to fail on DB level, not schema level
        expect(e.message).not.toContain("invalid_enum_value");
      }
    }
  });
});

describe("V2 Features - Funnel", () => {
  it("should return funnel stats as array", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.funnel.stats();
    expect(Array.isArray(stats)).toBe(true);
  });

  it("should require auth for funnel stats", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.funnel.stats()).rejects.toThrow();
  });
});

describe("V2 Features - Flow Config", () => {
  it("should list flow configurations", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const configs = await caller.flowConfig.list();
    expect(Array.isArray(configs)).toBe(true);
  });

  it("should accept valid flow config update input", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Test that the mutation accepts valid input without schema errors
    try {
      await caller.flowConfig.update({
        key: "PRE_TRIAGEM_ENFERMAGEM",
        value: "OFF",
      });
    } catch (e: any) {
      // DB-level errors are OK, schema validation errors are not
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should require auth for flow config", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.flowConfig.list()).rejects.toThrow();
  });
});

describe("V2 Features - Dashboard Enhanced", () => {
  it("should return patient timeline with all fields", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.dashboard.patientTimeline({ patientId: 1 });
    expect(result).toBeDefined();
    // patientTimeline returns an object with symptomData, examGroups, sessions, clinicalScore, flags, funnel, medications
    expect(result).toHaveProperty("symptomData");
    expect(result).toHaveProperty("examGroups");
    expect(result).toHaveProperty("sessions");
    expect(result).toHaveProperty("clinicalScore");
  });

  it("should return dashboard stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.dashboard.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalPatients).toBe("number");
    expect(typeof stats.activeAlerts).toBe("number");
    expect(typeof stats.openReports).toBe("number");
    expect(typeof stats.activeConsultants).toBe("number");
  });
});
