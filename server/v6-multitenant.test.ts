import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";

// Mock DB module
vi.mock("./db", () => ({
  listPatients: vi.fn().mockResolvedValue([]),
  listConsultants: vi.fn().mockResolvedValue([]),
  listQuestions: vi.fn().mockResolvedValue([]),
  listAlerts: vi.fn().mockResolvedValue([]),
  listPrescriptions: vi.fn().mockResolvedValue([]),
  listDailyReports: vi.fn().mockResolvedValue([]),
  getPatientByToken: vi.fn().mockResolvedValue(null),
  getClinicBySlug: vi.fn().mockResolvedValue(null),
  listClinics: vi.fn().mockResolvedValue([]),
  logAudit: vi.fn().mockResolvedValue(undefined),
  createPatient: vi.fn().mockResolvedValue(1),
  createConsultant: vi.fn().mockResolvedValue(1),
  createQuestion: vi.fn().mockResolvedValue(1),
  createAlert: vi.fn().mockResolvedValue(1),
  createPrescription: vi.fn().mockResolvedValue(1),
  createDailyReport: vi.fn().mockResolvedValue(1),
  savePrescriptionComponents: vi.fn().mockResolvedValue(undefined),
  listScoringWeights: vi.fn().mockResolvedValue([]),
  listScoringBands: vi.fn().mockResolvedValue([]),
  listMotorActions: vi.fn().mockResolvedValue([]),
  getResponses: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ totalPatients: 0, activeAlerts: 0, openReports: 0, activeConsultants: 0, pendingFlags: 0, activePrescriptions: 0, totalMedications: 0, funnelStats: [] }),
}));

const db = await import("./db");

function createAuthContext(role: "admin" | "user" = "admin") {
  return {
    user: { id: 1, openId: "test-open-id", name: "Test Admin", role, email: "test@test.com" },
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

const adminCaller = appRouter.createCaller(createAuthContext("admin"));
const userCaller = appRouter.createCaller(createAuthContext("user"));
const publicCaller = appRouter.createCaller({ user: null, req: {} as any, res: { clearCookie: vi.fn() } as any });

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── ROUTER-LEVEL SCOPING: clinicId propagation in list endpoints ───

describe("V6 Multi-Tenancy - Patient Router clinicId", () => {
  it("patient.list passes clinicId to db.listPatients", async () => {
    await adminCaller.patient.list({ clinicId: 42 });
    expect(db.listPatients).toHaveBeenCalledWith(undefined, 42);
  });

  it("patient.list without clinicId passes undefined", async () => {
    await adminCaller.patient.list();
    expect(db.listPatients).toHaveBeenCalledWith(undefined, undefined);
  });

  it("patient.create passes clinicId to db.createPatient", async () => {
    await adminCaller.patient.create({ name: "Test", clinicId: 7 });
    expect(db.createPatient).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test", clinicId: 7 })
    );
  });

  it("patient.create without clinicId does not include it", async () => {
    await adminCaller.patient.create({ name: "Test" });
    const call = (db.createPatient as any).mock.calls[0][0];
    expect(call.clinicId).toBeUndefined();
  });
});

describe("V6 Multi-Tenancy - Consultant Router clinicId", () => {
  it("consultant.list passes clinicId to db.listConsultants", async () => {
    await adminCaller.consultant.list({ clinicId: 10 });
    expect(db.listConsultants).toHaveBeenCalledWith(10);
  });

  it("consultant.list without clinicId passes undefined", async () => {
    await adminCaller.consultant.list();
    expect(db.listConsultants).toHaveBeenCalledWith(undefined);
  });

  it("consultant.create passes clinicId to db.createConsultant", async () => {
    await adminCaller.consultant.create({ name: "Nurse", role: "enfermeira", clinicId: 5 });
    expect(db.createConsultant).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nurse", role: "enfermeira", clinicId: 5 })
    );
  });
});

describe("V6 Multi-Tenancy - Question Router clinicId", () => {
  it("question.list passes clinicId to db.listQuestions", async () => {
    await adminCaller.question.list({ category: "integrativa", clinicId: 3 });
    expect(db.listQuestions).toHaveBeenCalledWith("integrativa", 3);
  });

  it("question.list without clinicId passes undefined", async () => {
    await adminCaller.question.list({ category: "estetica" });
    expect(db.listQuestions).toHaveBeenCalledWith("estetica", undefined);
  });

  it("question.listPublic passes clinicId to db.listQuestions", async () => {
    await publicCaller.question.listPublic({ category: "integrativa", clinicId: 8 });
    expect(db.listQuestions).toHaveBeenCalledWith("integrativa", 8);
  });

  it("question.create passes clinicId to db.createQuestion", async () => {
    await adminCaller.question.create({
      category: "integrativa", section: "Geral", questionText: "Test?",
      fieldType: "text", clinicId: 12,
    });
    expect(db.createQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: 12 })
    );
  });

  it("question.create without clinicId does not include it", async () => {
    await adminCaller.question.create({
      category: "integrativa", section: "Geral", questionText: "Test?", fieldType: "text",
    });
    const call = (db.createQuestion as any).mock.calls[0][0];
    expect(call.clinicId).toBeUndefined();
  });
});

describe("V6 Multi-Tenancy - Prescription Router clinicId", () => {
  it("prescription.list passes clinicId to db.listPrescriptions", async () => {
    await adminCaller.prescription.list({ patientId: 1, clinicId: 4 });
    expect(db.listPrescriptions).toHaveBeenCalledWith(1, 4);
  });

  it("prescription.list without clinicId passes undefined", async () => {
    await adminCaller.prescription.list({ patientId: 1 });
    expect(db.listPrescriptions).toHaveBeenCalledWith(1, undefined);
  });

  it("prescription.create passes clinicId to db.createPrescription", async () => {
    await adminCaller.prescription.create({
      patientId: 1, code: "RX001", name: "Formula A", clinicId: 6,
    });
    expect(db.createPrescription).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: 6 })
    );
  });
});

describe("V6 Multi-Tenancy - DailyReport Router clinicId", () => {
  it("dailyReport.list passes clinicId to db.listDailyReports", async () => {
    await adminCaller.dailyReport.list({ patientId: 1, clinicId: 9 });
    expect(db.listDailyReports).toHaveBeenCalledWith(1, undefined, 9);
  });

  it("dailyReport.list without clinicId passes undefined", async () => {
    await adminCaller.dailyReport.list({ patientId: 1 });
    expect(db.listDailyReports).toHaveBeenCalledWith(1, undefined, undefined);
  });

  it("dailyReport.create passes clinicId to db.createDailyReport", async () => {
    (db.getPatientByToken as any).mockResolvedValueOnce({ id: 99 });
    await publicCaller.dailyReport.create({
      token: "abc", reportDate: "2026-01-01", period: "manha", clinicId: 15,
    });
    expect(db.createDailyReport).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: 15, patientId: 99 })
    );
  });
});

describe("V6 Multi-Tenancy - Alert Router clinicId", () => {
  it("alert.list passes clinicId to db.listAlerts", async () => {
    await adminCaller.alert.list({ patientId: 1, clinicId: 20 });
    expect(db.listAlerts).toHaveBeenCalledWith(1, 20);
  });

  it("alert.list without clinicId passes undefined", async () => {
    await adminCaller.alert.list({ patientId: 5 });
    expect(db.listAlerts).toHaveBeenCalledWith(5, undefined);
  });

  it("alert.list with only clinicId (no patientId)", async () => {
    await adminCaller.alert.list({ clinicId: 33 });
    expect(db.listAlerts).toHaveBeenCalledWith(undefined, 33);
  });
});

// ─── CLINIC ROUTER ───

describe("V6 Multi-Tenancy - Clinic Router", () => {
  it("clinic.getBySlug is public and returns NOT_FOUND for unknown slug", async () => {
    try {
      await publicCaller.clinic.getBySlug({ slug: "nonexistent" });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("NOT_FOUND");
    }
  });

  it("clinic.list requires admin", async () => {
    await expect(userCaller.clinic.list()).rejects.toThrow();
  });

  it("clinic.list works for admin", async () => {
    const result = await adminCaller.clinic.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("clinic.create requires admin", async () => {
    await expect(
      userCaller.clinic.create({ slug: "test-clinic", name: "Test Clinic" })
    ).rejects.toThrow();
  });

  it("clinic.create validates slug format (no uppercase/spaces)", async () => {
    await expect(
      adminCaller.clinic.create({ slug: "INVALID SLUG!", name: "Test" })
    ).rejects.toThrow();
  });

  it("clinic.create validates slug min length", async () => {
    await expect(
      adminCaller.clinic.create({ slug: "ab", name: "Test" })
    ).rejects.toThrow();
  });
});

// ─── AUTH GATES ───

describe("V6 Multi-Tenancy - Auth Gates", () => {
  it("question.listPublic is accessible without auth", async () => {
    const result = await publicCaller.question.listPublic({ category: "integrativa" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("alert.list is protected", async () => {
    await expect(publicCaller.alert.list({})).rejects.toThrow();
  });

  it("prescription.list is protected", async () => {
    await expect(publicCaller.prescription.list({ patientId: 1 })).rejects.toThrow();
  });

  it("dailyReport.list is protected", async () => {
    await expect(publicCaller.dailyReport.list({ patientId: 1 })).rejects.toThrow();
  });
});
