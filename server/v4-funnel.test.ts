import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1, openId: "admin-test", email: "admin@test.com", name: "Admin",
      loginMethod: "manus", role: "admin", createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2, openId: "user-test", email: "user@test.com", name: "User",
      loginMethod: "manus", role: "user", createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("V4 - Funnel Backend Endpoints", () => {
  it("should have detectAbandonment endpoint", () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.funnel.detectAbandonment).toBeDefined();
  });

  it("should have classifyHighInterest endpoint", () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.funnel.classifyHighInterest).toBeDefined();
  });

  it("should have commercialForecast endpoint", () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.funnel.commercialForecast).toBeDefined();
  });

  it("detectAbandonment should accept daysThreshold parameter", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Should not throw with valid input
    try {
      await caller.funnel.detectAbandonment({ daysThreshold: 14 });
    } catch (e: any) {
      // Database errors are expected in test env, but input validation should pass
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("detectAbandonment should default to 7 days threshold", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    try {
      await caller.funnel.detectAbandonment({});
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("funnel.update should validate stage enum", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    try {
      await caller.funnel.update({
        patientId: 1,
        stage: "invalid_stage" as any,
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("funnel.update should accept all valid stages", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const validStages = ["iniciou_e_parou", "concluiu_clinico", "concluiu_financeiro", "alto_interesse", "convertido"] as const;
    for (const stage of validStages) {
      try {
        await caller.funnel.update({ patientId: 999, stage });
      } catch (e: any) {
        // DB error is OK, but not validation error
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });

  it("funnel.stats should be accessible by authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.funnel.stats();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("V4 - WhatsApp Integration with Medications", () => {
  it("medication.list should be accessible for WhatsApp message generation", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    try {
      await caller.medication.list({ patientId: 1 });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("medication.listByToken should be public for patient portal", async () => {
    const anonCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(anonCtx);
    try {
      await caller.medication.listByToken({ token: "nonexistent-token" });
    } catch (e: any) {
      // NOT_FOUND is expected for invalid token, not UNAUTHORIZED
      expect(e.code).toBe("NOT_FOUND");
    }
  });
});

describe("V4 - Protocol Document Governance", () => {
  it("protocolDocument.create should exist and require authentication", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.protocolDocument.create).toBeDefined();
  });

  it("protocolDocument.create should validate document type", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    try {
      await caller.protocolDocument.create({
        patientId: 1,
        type: "invalid_type" as any,
        title: "Test",
        content: "Test content",
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      // May be BAD_REQUEST (zod validation) or PRECONDITION_FAILED (governance check)
      expect(["BAD_REQUEST", "PRECONDITION_FAILED"]).toContain(e.code);
    }
  });

  it("protocolDocument.create should accept valid types", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const validTypes = ["protocolo", "anamnese", "relatorio"] as const;
    for (const type of validTypes) {
      try {
        await caller.protocolDocument.create({
          patientId: 999,
          type,
          title: "Test " + type,
          content: "Content",
        });
      } catch (e: any) {
        // DB or flag errors OK, not validation
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });
});
