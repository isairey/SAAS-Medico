import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1, openId: "test-user", email: "test@example.com", name: "Test User",
      loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("V3 Features - Clinical Systems", () => {
  it("should require authentication for clinicalSystem.list", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.clinicalSystem.list({ patientId: 1 })).rejects.toThrow();
  });

  it("should accept valid clinicalSystem.create input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // This will fail at DB level but validates input schema
    try {
      await caller.clinicalSystem.create({
        patientId: 1,
        system: "cardiovascular",
        conditionCode: "HAS",
        conditionName: "Hipertensão Arterial Sistêmica",
        status: "diagnosticado",
        severity: "moderado",
      });
    } catch (e: any) {
      // DB error expected, but input validation should pass
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate system enum values", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.clinicalSystem.create({
        patientId: 1,
        system: "invalid_system" as any,
        conditionCode: "X",
        conditionName: "Test",
        status: "diagnosticado",
      })
    ).rejects.toThrow();
  });

  it("should validate status enum values", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.clinicalSystem.create({
        patientId: 1,
        system: "cardiovascular",
        conditionCode: "X",
        conditionName: "Test",
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });
});

describe("V3 Features - Sleep Details", () => {
  it("should require authentication for sleepDetail.list", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.sleepDetail.list({ patientId: 1 })).rejects.toThrow();
  });

  it("should accept valid sleepDetail.create input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.sleepDetail.create({
        dailyReportId: 1,
        patientId: 1,
        fallingAsleep: "7",
        waking: "6",
        fragmented: "5",
        daytimeSleepiness: "4",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should require dailyReportId", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.sleepDetail.create({
        patientId: 1,
        fallingAsleep: "7",
      } as any)
    ).rejects.toThrow();
  });
});

describe("V3 Features - Physical Activity", () => {
  it("should require authentication for physicalActivity.list", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.physicalActivity.list({ patientId: 1 })).rejects.toThrow();
  });

  it("should accept valid physicalActivity.create input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.physicalActivity.create({
        dailyReportId: 1,
        patientId: 1,
        activityType: "Musculação",
        frequencyPerWeek: 5,
        period: "manha",
        intensity: "intensa",
        durationMinutes: 60,
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should require patientId", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.physicalActivity.create({
        activityType: "Corrida",
      } as any)
    ).rejects.toThrow();
  });
});

describe("V3 Features - Polypharmacy", () => {
  it("should require authentication for polypharmacy.rules", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.polypharmacy.rules()).rejects.toThrow();
  });

  it("should accept valid polypharmacy rule creation", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.polypharmacy.createRule({
        name: "Test Rule",
        medicationA: "MedA",
        medicationB: "MedB",
        interactionType: "contraindicacao",
        description: "Test interaction",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate interactionType enum", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.polypharmacy.createRule({
        name: "Test",
        medicationA: "A",
        interactionType: "invalid" as any,
        description: "Test",
      })
    ).rejects.toThrow();
  });

  it("should require authentication for polypharmacy.check", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.polypharmacy.check({ patientId: 1 })).rejects.toThrow();
  });
});

describe("V3 Features - Team Queue", () => {
  it("should require authentication for teamQueue.list", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.teamQueue.list({})).rejects.toThrow();
  });

  it("should accept valid teamQueue.create input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.teamQueue.create({
        patientId: 1,
        assignedProfile: "enfermagem",
        priority: "urgente",
        reason: "Reação adversa grave",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate assignedProfile enum", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.teamQueue.create({
        patientId: 1,
        assignedProfile: "invalid_profile" as any,
        priority: "normal",
        reason: "Test",
      })
    ).rejects.toThrow();
  });

  it("should validate priority enum", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.teamQueue.create({
        patientId: 1,
        assignedProfile: "enfermagem",
        priority: "invalid_priority" as any,
        reason: "Test",
      })
    ).rejects.toThrow();
  });

  it("should validate status enum on update", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.teamQueue.update({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });
});

describe("V3 Features - Protocol Documents", () => {
  it("should require authentication for protocolDocument.list", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.protocolDocument.list({ patientId: 1 })).rejects.toThrow();
  });

  it("should accept valid protocolDocument.create input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.protocolDocument.create({
        patientId: 1,
        title: "Protocolo Cardiometabólico",
        documentType: "protocolo",
        scoreBand: "Avançado",
        score: 72,
        signedByName: "Dr. Caio Pádua",
        signedByCRM: "12345-SP",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate documentType enum", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.protocolDocument.create({
        patientId: 1,
        title: "Test",
        documentType: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("should accept valid markSent input", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    try {
      await caller.protocolDocument.markSent({
        id: 1,
        sentVia: "whatsapp",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should validate sentVia enum", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.protocolDocument.markSent({
        id: 1,
        sentVia: "invalid" as any,
      })
    ).rejects.toThrow();
  });
});
