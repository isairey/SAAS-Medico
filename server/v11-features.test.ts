import { describe, it, expect } from "vitest";
import * as schema from "../drizzle/schema";

// ═══════════════════════════════════════════════════════════
// V11 — TESTES: Agendamentos, Notificações, Trello, Exportação, PWA
// ═══════════════════════════════════════════════════════════

describe("V11 — Appointments (Agendamentos)", () => {
  it("appointments table has required columns", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("id");
    expect(cols).toContain("patientId");
    expect(cols).toContain("clinicId");
    expect(cols).toContain("scheduledAt");
    expect(cols).toContain("status");
    expect(cols).toContain("type");
  });

  it("appointments have multi-tenant clinicId", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("clinicId");
  });

  it("appointments have professional assignment", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("professionalId");
    expect(cols).toContain("professionalName");
  });

  it("appointments have duration and notes", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("durationMinutes");
    expect(cols).toContain("notes");
  });

  it("appointments support external calendar integration", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("externalCalendarId");
    expect(cols).toContain("externalCalendarProvider");
  });

  it("appointments support recurrence", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("isRecurring");
    expect(cols).toContain("recurrenceRule");
    expect(cols).toContain("parentAppointmentId");
  });

  it("appointments support reminders", () => {
    const cols = Object.keys(schema.appointments);
    expect(cols).toContain("reminderSentAt");
    expect(cols).toContain("reminderType");
  });
});

describe("V11 — Notifications (internalNotifications)", () => {
  it("internalNotifications table has required columns", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("id");
    expect(cols).toContain("recipientId");
    expect(cols).toContain("recipientType");
    expect(cols).toContain("title");
    expect(cols).toContain("content");
    expect(cols).toContain("type");
  });

  it("internalNotifications have multi-tenant clinicId", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("clinicId");
  });

  it("internalNotifications have entity reference for linking", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("entityType");
    expect(cols).toContain("entityId");
  });

  it("internalNotifications have read status tracking", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("isRead");
    expect(cols).toContain("readAt");
  });

  it("internalNotifications have priority levels", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("priority");
  });

  it("internalNotifications have channel support", () => {
    const cols = Object.keys(schema.internalNotifications);
    expect(cols).toContain("channel");
    expect(cols).toContain("sentAt");
  });
});

describe("V11 — Trello Integration", () => {
  it("trelloCards table has required columns", () => {
    const cols = Object.keys(schema.trelloCards);
    expect(cols).toContain("id");
    expect(cols).toContain("clinicId");
    expect(cols).toContain("entityType");
    expect(cols).toContain("entityId");
    expect(cols).toContain("trelloBoardId");
    expect(cols).toContain("trelloListId");
    expect(cols).toContain("trelloCardId");
  });

  it("trelloCards have sync status", () => {
    const cols = Object.keys(schema.trelloCards);
    expect(cols).toContain("syncStatus");
    expect(cols).toContain("lastSyncAt");
  });

  it("trelloCards have card content fields", () => {
    const cols = Object.keys(schema.trelloCards);
    expect(cols).toContain("cardTitle");
    expect(cols).toContain("cardDescription");
  });

  it("trelloCards have due date and labels", () => {
    const cols = Object.keys(schema.trelloCards);
    expect(cols).toContain("dueDate");
    expect(cols).toContain("labels");
  });
});

describe("V11 — PWA Sync Queue", () => {
  it("pwaSyncQueue table has required columns", () => {
    const cols = Object.keys(schema.pwaSyncQueue);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("patientId");
    expect(cols).toContain("operationType");
    expect(cols).toContain("payload");
    expect(cols).toContain("status");
  });

  it("pwaSyncQueue tracks sync attempts", () => {
    const cols = Object.keys(schema.pwaSyncQueue);
    expect(cols).toContain("syncAttempts");
    expect(cols).toContain("lastSyncError");
  });

  it("pwaSyncQueue has device tracking", () => {
    const cols = Object.keys(schema.pwaSyncQueue);
    expect(cols).toContain("deviceId");
    expect(cols).toContain("offlineCreatedAt");
  });
});

describe("V11 — Export Router Schema Validation", () => {
  it("patients table has fields needed for CSV export", () => {
    const cols = Object.keys(schema.patients);
    expect(cols).toContain("name");
    expect(cols).toContain("email");
    expect(cols).toContain("phone");
    expect(cols).toContain("cpf");
    expect(cols).toContain("birthDate");
    expect(cols).toContain("sex");
  });

  it("entry_leads table has fields needed for leads export", () => {
    const cols = Object.keys(schema.entryLeads);
    expect(cols).toContain("name");
    expect(cols).toContain("email");
    expect(cols).toContain("phone");
    expect(cols).toContain("channelId");
    expect(cols).toContain("status");
    expect(cols).toContain("utmSource");
  });

  it("prescription_dispatches has fields needed for dispatch export", () => {
    const cols = Object.keys(schema.prescriptionDispatches);
    expect(cols).toContain("prescriptionId");
    expect(cols).toContain("pharmacyId");
    expect(cols).toContain("status");
    expect(cols).toContain("totalValue");
    expect(cols).toContain("commissionValue");
  });
});

describe("V11 — Cross-feature Integration", () => {
  it("all V11 tables have createdAt timestamp", () => {
    const tables = [
      schema.appointments,
      schema.internalNotifications,
      schema.trelloCards,
      schema.pwaSyncQueue,
    ];
    tables.forEach((table) => {
      expect(Object.keys(table)).toContain("createdAt");
    });
  });

  it("multi-tenant V11 tables have clinicId", () => {
    const tables = [
      schema.appointments,
      schema.internalNotifications,
      schema.trelloCards,
    ];
    tables.forEach((table) => {
      expect(Object.keys(table)).toContain("clinicId");
    });
  });

  it("all V11 tables have auto-increment id", () => {
    const tables = [
      schema.appointments,
      schema.internalNotifications,
      schema.trelloCards,
      schema.pwaSyncQueue,
    ];
    tables.forEach((table) => {
      expect(Object.keys(table)).toContain("id");
    });
  });
});
