import { describe, expect, it, vi } from "vitest";

// We test the scoring engine by mocking the db module
vi.mock("./db", () => ({
  listScoringWeights: vi.fn().mockResolvedValue([
    { questionCode: "CARD_DOEN_HASA_001", axis: "cardiovascular", weight: 3.5, maxRawPoints: 10 },
    { questionCode: "META_DOEN_DIAB_001", axis: "metabolico", weight: 4.0, maxRawPoints: 10 },
    { questionCode: "SONO_QUAL_001", axis: "sono", weight: 2.0, maxRawPoints: 10 },
    { questionCode: "ENDO_DOEN_HASH_001", axis: "endocrino", weight: 3.0, maxRawPoints: 10 },
  ]),
  listScoringBands: vi.fn().mockResolvedValue([
    { name: "Básico", minScore: 0, maxScore: 20, color: "#22c55e", description: "Baixa complexidade", actions: ["Consulta padrão"] },
    { name: "Intermediário", minScore: 21, maxScore: 50, color: "#eab308", description: "Complexidade moderada", actions: ["Painel básico"] },
    { name: "Avançado", minScore: 51, maxScore: 80, color: "#f97316", description: "Alta complexidade", actions: ["Painel completo"] },
    { name: "Full", minScore: 81, maxScore: 100, color: "#ef4444", description: "Muito alta complexidade", actions: ["Protocolo intensivo"] },
  ]),
  listMotorActions: vi.fn().mockResolvedValue([
    { triggerCode: "CARD_DOEN_HASA", actionType: "exame", actionValue: "Painel cardiometabólico" },
    { triggerCode: "META_DOEN_DIAB", actionType: "exame", actionValue: "Glicemia + HbA1c" },
  ]),
  getResponses: vi.fn(),
  listQuestions: vi.fn(),
}));

import { calculateScore, type ScoreResult } from "./scoring-engine";

describe("Scoring Engine V16", () => {
  // ─── BLOCK SCORES ──────────────────────────────────────────
  describe("Block Scores", () => {
    it("should calculate scores per clinical block", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_HASA_001", fieldType: "checkbox", weight: "3.5", scaleMax: 10, block: "CARDIO", step: 1 },
        { id: 2, code: "META_DOEN_DIAB_001", fieldType: "checkbox", weight: "4.0", scaleMax: 10, block: "META", step: 1 },
        { id: 3, code: "SONO_QUAL_001", fieldType: "scale", weight: "2.0", scaleMax: 10, block: "SONO", step: 2 },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_HASA_001", answerText: "sim" },
        { questionId: 2, code: "META_DOEN_DIAB_001", answerText: "nao" },
        { questionId: 3, code: "SONO_QUAL_001", answerNumber: "7" },
      ];

      const result = await calculateScore(responses, questions);

      expect(result.blockScores).toBeDefined();
      expect(result.blockScores.length).toBeGreaterThan(0);

      const cardioBlock = result.blockScores.find(b => b.block === "Cardiovascular");
      expect(cardioBlock).toBeDefined();
      expect(cardioBlock!.score).toBe(100); // sim = full points

      const sonoBlock = result.blockScores.find(b => b.block === "Sono");
      expect(sonoBlock).toBeDefined();
      expect(sonoBlock!.score).toBe(70); // 7/10 = 70%
    });

    it("should derive block from code when block field is missing", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_HASA_001", fieldType: "checkbox", weight: "3.5", scaleMax: 10, block: null, step: null },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_HASA_001", answerText: "sim" },
      ];

      const result = await calculateScore(responses, questions);
      const cardioBlock = result.blockScores.find(b => b.block === "Cardiovascular");
      expect(cardioBlock).toBeDefined();
    });
  });

  // ─── STEP MULTIPLIERS ──────────────────────────────────────
  describe("Step Multipliers", () => {
    it("should apply higher multiplier to clinical steps (1-3) vs preference/financial (4-5)", async () => {
      // Step 2 (Sintomas) has multiplier 1.5, Step 5 (Financeiro) has multiplier 0.5
      const questions = [
        { id: 1, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "SINT", step: 2 },
        { id: 2, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "FIN", step: 5 },
      ];
      const responses = [
        { questionId: 1, answerNumber: "8" },
        { questionId: 2, answerNumber: "8" },
      ];

      const result = await calculateScore(responses, questions);

      // Step 2: 8 * 1 * 1.5 = 12, max = 10 * 1 * 1.5 = 15
      // Step 5: 8 * 1 * 0.5 = 4, max = 10 * 1 * 0.5 = 5
      // Total: 16 / 20 = 80%
      expect(result.normalizedScore).toBe(80);
    });

    it("should default to multiplier 1.0 when step is null", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "GERAL", step: null },
      ];
      const responses = [
        { questionId: 1, answerNumber: "5" },
      ];

      const result = await calculateScore(responses, questions);
      // 5 * 1 * 1.0 = 5, max = 10 * 1 * 1.0 = 10 → 50%
      expect(result.normalizedScore).toBe(50);
    });
  });

  // ─── COMPLEXITY CALCULATION ────────────────────────────────
  describe("Complexity Calculation", () => {
    it("should return 'baixa' complexity when 0-1 blocks affected", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_HASA_001", fieldType: "checkbox", weight: "1", scaleMax: 10, block: "CARDIO", step: 1 },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_HASA_001", answerText: "nao" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.complexityLevel).toBe("baixa");
    });

    it("should return 'muito_alta' when 4+ clinical blocks affected", async () => {
      const questions = [
        { id: 1, code: "CARD_X", fieldType: "scale", weight: "1", scaleMax: 10, block: "CARDIO", step: 1 },
        { id: 2, code: "META_X", fieldType: "scale", weight: "1", scaleMax: 10, block: "META", step: 1 },
        { id: 3, code: "ENDO_X", fieldType: "scale", weight: "1", scaleMax: 10, block: "ENDO", step: 1 },
        { id: 4, code: "NEUR_X", fieldType: "scale", weight: "1", scaleMax: 10, block: "NEURO", step: 2 },
      ];
      const responses = [
        { questionId: 1, answerNumber: "8" },
        { questionId: 2, answerNumber: "7" },
        { questionId: 3, answerNumber: "6" },
        { questionId: 4, answerNumber: "9" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.complexityLevel).toBe("muito_alta");
      expect(result.complexityReason).toContain("4 sistemas");
    });

    it("should return 'muito_alta' when score >= 80 even with few blocks", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "CARDIO", step: 2 },
      ];
      const responses = [
        { questionId: 1, answerNumber: "9" },
      ];

      const result = await calculateScore(responses, questions);
      // 9/10 = 90%, which is >= 80 → muito_alta
      expect(result.complexityLevel).toBe("muito_alta");
    });
  });

  // ─── CLINICAL FLAGS ────────────────────────────────────────
  describe("Clinical Flags V16", () => {
    it("should detect critical conditions (infarto, AVC)", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_INFA_001", fieldType: "checkbox", weight: "5", scaleMax: 10, block: "CARDIO", step: 1 },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_INFA_001", answerText: "sim" },
      ];

      const result = await calculateScore(responses, questions);
      const validationFlags = result.flags.filter(f => f.type === "validation");
      expect(validationFlags.length).toBeGreaterThan(0);
      expect(validationFlags[0].description).toContain("infarto");
    });

    it("should flag high scale values (>= 80% of max)", async () => {
      const questions = [
        { id: 1, code: "SONO_QUAL_001", fieldType: "scale", weight: "2", scaleMax: 10, block: "SONO", step: 2 },
      ];
      const responses = [
        { questionId: 1, code: "SONO_QUAL_001", answerNumber: "9" },
      ];

      const result = await calculateScore(responses, questions);
      const infoFlags = result.flags.filter(f => f.type === "info");
      expect(infoFlags.length).toBeGreaterThan(0);
      expect(infoFlags[0].description).toContain("Valor alto");
    });

    it("should detect polypharmacy when 5+ medication codes are positive", async () => {
      const questions = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1, code: `MEDI_${i}`, fieldType: "checkbox" as const, weight: "1", scaleMax: 10, block: "META", step: 3,
      }));
      const responses = questions.map(q => ({
        questionId: q.id, code: q.code, answerText: "sim",
      }));

      const result = await calculateScore(responses, questions);
      const polyFlag = result.flags.find(f => f.code === "POLIFARMACIA");
      expect(polyFlag).toBeDefined();
      expect(polyFlag!.type).toBe("warning");
    });
  });

  // ─── MOTOR ACTIONS ─────────────────────────────────────────
  describe("Motor Actions", () => {
    it("should trigger motor actions for positive responses matching trigger codes", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_HASA_001", fieldType: "checkbox", weight: "3.5", scaleMax: 10, block: "CARDIO", step: 1 },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_HASA_001", answerText: "sim" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.motorActions.length).toBeGreaterThan(0);
      expect(result.motorActions[0].actionValue).toContain("cardiometabólico");
    });

    it("should not trigger motor actions for negative responses", async () => {
      const questions = [
        { id: 1, code: "CARD_DOEN_HASA_001", fieldType: "checkbox", weight: "3.5", scaleMax: 10, block: "CARDIO", step: 1 },
      ];
      const responses = [
        { questionId: 1, code: "CARD_DOEN_HASA_001", answerText: "nao" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.motorActions.length).toBe(0);
    });
  });

  // ─── BAND DETERMINATION ────────────────────────────────────
  describe("Band Determination", () => {
    it("should return correct band for score in Básico range (0-20)", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "GERAL", step: null },
      ];
      const responses = [
        { questionId: 1, answerNumber: "1" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.band?.name).toBe("Básico");
    });

    it("should return correct band for score in Avançado range (51-80)", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "scale", weight: "1", scaleMax: 10, block: "GERAL", step: null },
      ];
      const responses = [
        { questionId: 1, answerNumber: "7" },
      ];

      const result = await calculateScore(responses, questions);
      expect(result.band?.name).toBe("Avançado");
    });
  });

  // ─── RAW POINTS EXTRACTION ─────────────────────────────────
  describe("Raw Points Extraction", () => {
    it("should extract points from select fields using severity map", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "select", weight: "1", scaleMax: 10, block: "GERAL", step: null, options: ["nenhum", "leve", "moderado", "grave"] },
      ];
      const responses = [
        { questionId: 1, answerText: "grave" },
      ];

      const result = await calculateScore(responses, questions);
      // "grave" = 10 points, max = 10 → 100%
      expect(result.normalizedScore).toBe(100);
    });

    it("should extract points from multiselect fields proportionally", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "multiselect", weight: "1", scaleMax: 10, block: "GERAL", step: null, options: ["A", "B", "C", "D", "E"] },
      ];
      const responses = [
        { questionId: 1, answerJson: ["A", "B"] },
      ];

      const result = await calculateScore(responses, questions);
      // 2 items out of 5 → 2 * (10/5) = 4 points, max = 10 → 40%
      expect(result.normalizedScore).toBe(40);
    });

    it("should give 5 points for filled text fields, 0 for empty", async () => {
      const questions = [
        { id: 1, code: null, fieldType: "text", weight: "1", scaleMax: 10, block: "GERAL", step: null },
      ];
      const responses = [
        { questionId: 1, answerText: "Queixa principal: dor de cabeça" },
      ];

      const result = await calculateScore(responses, questions);
      // 5/10 = 50%
      expect(result.normalizedScore).toBe(50);
    });
  });
});
