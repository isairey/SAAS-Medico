/**
 * PADCOM Scoring Engine V16
 * 
 * Calcula score clínico 0-100 a partir das respostas da anamnese,
 * determina faixa de conduta, dispara flags clínicas e ações do motor.
 * 
 * V16 upgrades:
 * - Score por bloco clínico (CARDIO, META, ENDO, DIGEST, NEURO, SONO, ATIV)
 * - Ponderação por step (etapas 1-5 com multiplicadores configuráveis)
 * - Cálculo de complexidade clínica (quantos blocos afetados)
 * - Detecção de valores altos em escalas
 */
import * as db from "./db";

// ─── TYPES ────────────────────────────────────────────────────
export interface BlockScore {
  block: string;
  score: number;       // 0-100 normalized
  rawPoints: number;
  maxPoints: number;
  questionCount: number;
}

export interface ScoreResult {
  totalScore: number;
  normalizedScore: number; // 0-100
  band: { name: string; minScore: number; maxScore: number; color: string; description: string; actions: string[] } | null;
  axisScores: Record<string, number>;
  blockScores: BlockScore[];
  complexityLevel: "baixa" | "media" | "alta" | "muito_alta";
  complexityReason: string;
  flags: Array<{ code: string; type: "validation" | "warning" | "info"; description: string }>;
  motorActions: Array<{ actionType: string; actionValue: string; triggerCode: string }>;
}

// Step multipliers: clinical steps (1-3) weigh more than preference/financial (4-5)
const STEP_MULTIPLIERS: Record<number, number> = {
  1: 1.3,  // Dados + Clínico Básico
  2: 1.5,  // Sintomas Funcionais (most clinically relevant)
  3: 1.2,  // Cirurgias + Medicamentos
  4: 0.8,  // Preferências Terapêuticas
  5: 0.5,  // Financeiro
};

// Block display names
const BLOCK_NAMES: Record<string, string> = {
  CARDIO: "Cardiovascular", META: "Metabólico", ENDO: "Endócrino",
  DIGEST: "Digestivo", NEURO: "Neuro/Humor", SONO: "Sono",
  ATIV: "Atividade Física", GERAL: "Geral", PREF: "Preferências",
  FIN: "Financeiro", SINT: "Sintomas",
};

// ─── SCORE CALCULATION ────────────────────────────────────────
export async function calculateScore(
  responses: Array<{ questionId: number; code?: string; answerText?: string; answerNumber?: string; answerJson?: any }>,
  questions: Array<{ id: number; code?: string | null; fieldType: string; weight?: string | null; scaleMax?: number | null; options?: any; block?: string | null; step?: number | null }>
): Promise<ScoreResult> {
  const weights = await db.listScoringWeights();
  const bands = await db.listScoringBands();

  // Build lookup: questionCode -> weight info
  const weightMap = new Map<string, { axis: string; weight: number; maxRaw: number }>();
  weights.forEach(w => {
    weightMap.set(w.questionCode, { axis: w.axis, weight: Number(w.weight), maxRaw: w.maxRawPoints });
  });

  // Accumulators
  let totalRawPoints = 0;
  let totalMaxPoints = 0;
  const axisRaw: Record<string, number> = {};
  const axisMax: Record<string, number> = {};
  const blockRaw: Record<string, number> = {};
  const blockMax: Record<string, number> = {};
  const blockCount: Record<string, number> = {};

  for (const resp of responses) {
    const q = questions.find(q => q.id === resp.questionId);
    if (!q) continue;

    const code = resp.code || q.code;
    const rawPoints = extractRawPoints(resp, q);
    
    // Weight from scoring_weights table, fallback to question weight
    const wInfo = code ? weightMap.get(code) : null;
    const questionWeight = q.weight ? Number(q.weight) : 1;
    const weight = wInfo?.weight ?? questionWeight;
    const maxRaw = wInfo?.maxRaw ?? (q.scaleMax ?? 10);
    const axis = wInfo?.axis ?? "geral";

    // V16: Apply step multiplier
    const stepMult = q.step ? (STEP_MULTIPLIERS[q.step] ?? 1) : 1;
    const effectiveWeight = weight * stepMult;

    const weightedPoints = rawPoints * effectiveWeight;
    const weightedMax = maxRaw * effectiveWeight;

    totalRawPoints += weightedPoints;
    totalMaxPoints += weightedMax;

    // Axis accumulation
    axisRaw[axis] = (axisRaw[axis] ?? 0) + weightedPoints;
    axisMax[axis] = (axisMax[axis] ?? 0) + weightedMax;

    // V16: Block accumulation
    const block = q.block ?? (code ? deriveBlockFromCode(code) : "GERAL");
    blockRaw[block] = (blockRaw[block] ?? 0) + weightedPoints;
    blockMax[block] = (blockMax[block] ?? 0) + weightedMax;
    blockCount[block] = (blockCount[block] ?? 0) + 1;
  }

  // Normalize to 0-100
  const normalizedScore = totalMaxPoints > 0 ? Math.round((totalRawPoints / totalMaxPoints) * 100) : 0;

  // Axis scores normalized
  const axisScores: Record<string, number> = {};
  for (const axis of Object.keys(axisRaw)) {
    axisScores[axis] = axisMax[axis] > 0 ? Math.round((axisRaw[axis] / axisMax[axis]) * 100) : 0;
  }

  // V16: Block scores
  const blockScores: BlockScore[] = Object.keys(blockRaw).map(block => ({
    block: BLOCK_NAMES[block] ?? block,
    score: blockMax[block] > 0 ? Math.round((blockRaw[block] / blockMax[block]) * 100) : 0,
    rawPoints: Math.round(blockRaw[block] * 100) / 100,
    maxPoints: Math.round(blockMax[block] * 100) / 100,
    questionCount: blockCount[block] ?? 0,
  })).sort((a, b) => b.score - a.score);

  // V16: Complexity calculation
  const clinicalBlocks = ["CARDIO", "META", "ENDO", "DIGEST", "NEURO", "SONO"];
  const affectedBlocks = clinicalBlocks.filter(b => {
    const score = blockMax[b] > 0 ? (blockRaw[b] / blockMax[b]) * 100 : 0;
    return score >= 30; // Block is "affected" if score >= 30%
  });
  const { complexityLevel, complexityReason } = calculateComplexity(affectedBlocks, normalizedScore);

  // Determine band
  const band = bands.find(b => normalizedScore >= b.minScore && normalizedScore <= b.maxScore);
  const bandResult = band ? {
    name: band.name,
    minScore: band.minScore,
    maxScore: band.maxScore,
    color: band.color ?? "#666",
    description: band.description ?? "",
    actions: Array.isArray(band.actions) ? band.actions as string[] : [],
  } : null;

  // Check for clinical flags
  const flags = detectClinicalFlags(responses, questions);

  // Get motor actions for triggered codes
  const triggeredCodes = responses
    .filter(r => {
      const q = questions.find(q => q.id === r.questionId);
      return q?.code && (r.answerText === "sim" || r.answerText === "true" || (r.answerNumber && parseFloat(r.answerNumber) >= 7));
    })
    .map(r => {
      const q = questions.find(q => q.id === r.questionId);
      return q?.code;
    })
    .filter(Boolean) as string[];

  const allActions = await db.listMotorActions();
  const matchedActions = allActions
    .filter(a => triggeredCodes.some(code => code.startsWith(a.triggerCode) || a.triggerCode === code))
    .map(a => ({ actionType: a.actionType, actionValue: a.actionValue, triggerCode: a.triggerCode }));

  return {
    totalScore: totalRawPoints,
    normalizedScore,
    band: bandResult,
    axisScores,
    blockScores,
    complexityLevel,
    complexityReason,
    flags,
    motorActions: matchedActions,
  };
}

// ─── DERIVE BLOCK FROM CODE ──────────────────────────────────
function deriveBlockFromCode(code: string): string {
  const prefix = code.split("_")[0];
  const blockMap: Record<string, string> = {
    CARD: "CARDIO", META: "META", ENDO: "ENDO", DIGE: "DIGEST",
    NEUR: "NEURO", SONO: "SONO", ATIV: "ATIV", SINT: "SINT",
    PREF: "PREF", FIN: "FIN", MEDI: "META",
  };
  return blockMap[prefix] ?? "GERAL";
}

// ─── COMPLEXITY CALCULATION ──────────────────────────────────
function calculateComplexity(
  affectedBlocks: string[],
  normalizedScore: number
): { complexityLevel: "baixa" | "media" | "alta" | "muito_alta"; complexityReason: string } {
  const count = affectedBlocks.length;
  if (count >= 4 || normalizedScore >= 80) {
    return {
      complexityLevel: "muito_alta",
      complexityReason: `${count} sistemas clínicos afetados (${affectedBlocks.join(", ")}), score ${normalizedScore}%`,
    };
  }
  if (count >= 3 || normalizedScore >= 60) {
    return {
      complexityLevel: "alta",
      complexityReason: `${count} sistemas clínicos afetados, score ${normalizedScore}%`,
    };
  }
  if (count >= 2 || normalizedScore >= 35) {
    return {
      complexityLevel: "media",
      complexityReason: `${count} sistema(s) clínico(s) afetado(s), score ${normalizedScore}%`,
    };
  }
  return {
    complexityLevel: "baixa",
    complexityReason: `${count} sistema(s) clínico(s) afetado(s), score ${normalizedScore}%`,
  };
}

// ─── RAW POINTS EXTRACTION ────────────────────────────────────
function extractRawPoints(
  resp: { answerText?: string; answerNumber?: string; answerJson?: any },
  q: { fieldType: string; scaleMax?: number | null; options?: any }
): number {
  switch (q.fieldType) {
    case "scale":
    case "number":
      return resp.answerNumber ? parseFloat(resp.answerNumber) : 0;

    case "checkbox":
      if (resp.answerText === "sim" || resp.answerText === "true") return q.scaleMax ?? 10;
      return 0;

    case "select": {
      const severityMap: Record<string, number> = {
        "nenhum": 0, "nenhuma": 0, "nunca": 0, "nao": 0,
        "leve": 2, "pouco": 2, "raramente": 2,
        "moderado": 5, "moderada": 5, "as_vezes": 5, "medio": 5,
        "intenso": 8, "intensa": 8, "frequente": 8, "muito": 8,
        "grave": 10, "extremo": 10, "sempre": 10, "sim": 10,
      };
      const answer = (resp.answerText ?? "").toLowerCase().replace(/\s+/g, "_");
      return severityMap[answer] ?? 0;
    }

    case "multiselect": {
      const items = resp.answerJson ? (Array.isArray(resp.answerJson) ? resp.answerJson : []) : [];
      const maxItems = q.options ? (Array.isArray(q.options) ? q.options.length : 5) : 5;
      return Math.min(items.length * (10 / maxItems), 10);
    }

    case "text":
    case "textarea":
      return resp.answerText && resp.answerText.trim().length > 0 ? 5 : 0;

    default:
      return 0;
  }
}

// ─── CLINICAL FLAG DETECTION ──────────────────────────────────
function detectClinicalFlags(
  responses: Array<{ questionId: number; code?: string; answerText?: string; answerNumber?: string; answerJson?: any }>,
  questions: Array<{ id: number; code?: string | null; fieldType: string; scaleMax?: number | null }>
): Array<{ code: string; type: "validation" | "warning" | "info"; description: string }> {
  const flags: Array<{ code: string; type: "validation" | "warning" | "info"; description: string }> = [];

  const criticalCodes: Record<string, { type: "validation" | "warning"; desc: string }> = {
    "CARD_DOEN_INFA": { type: "validation", desc: "Historico de infarto — requer validacao medica obrigatoria" },
    "CARD_DOEN_AVCI": { type: "validation", desc: "Historico de AVC — requer validacao medica obrigatoria" },
    "ONCO": { type: "validation", desc: "Historico oncologico — requer validacao medica obrigatoria" },
    "GEST": { type: "validation", desc: "Gestante — requer validacao medica obrigatoria" },
    "META_DOEN_DIAB": { type: "warning", desc: "Diabetes — monitoramento intensivo recomendado" },
    "CARD_DOEN_HASA": { type: "warning", desc: "Hipertensao arterial — monitoramento cardiometabolico" },
    "ENDO_DOEN_HASH": { type: "warning", desc: "Hashimoto — painel tireoidiano obrigatorio" },
    "MEDI_CONT": { type: "warning", desc: "Medicamentos de uso continuo — verificar interacoes" },
  };

  for (const resp of responses) {
    const q = questions.find(q => q.id === resp.questionId);
    if (!q?.code) continue;

    const isPositive = resp.answerText === "sim" || resp.answerText === "true" ||
      (resp.answerNumber && parseFloat(resp.answerNumber) > 0);

    if (!isPositive) continue;

    for (const [prefix, flagInfo] of Object.entries(criticalCodes)) {
      if (q.code.startsWith(prefix)) {
        flags.push({ code: q.code, type: flagInfo.type, description: flagInfo.desc });
      }
    }

    // V16: High scale values trigger info flags
    if (q.fieldType === "scale" && resp.answerNumber) {
      const val = parseFloat(resp.answerNumber);
      const max = q.scaleMax ?? 10;
      if (val >= max * 0.8) {
        flags.push({ code: q.code, type: "info", description: `Valor alto em ${q.code}: ${val}/${max}` });
      }
    }
  }

  // Polypharmacy check
  const medResponses = responses.filter(r => {
    const q = questions.find(q => q.id === r.questionId);
    return q?.code?.startsWith("MEDI_") && (r.answerText === "sim" || r.answerText === "true");
  });
  if (medResponses.length >= 5) {
    flags.push({ code: "POLIFARMACIA", type: "warning", description: `Polifarmacia detectada (${medResponses.length} medicamentos) — requer revisao` });
  }

  return flags;
}

// ─// ─── SCORE CALCULATION FROM SESSION ───────────────────────
export async function calculateScoreFromSession(sessionId: number, clinicId?: number): Promise<ScoreResult | null> {
  const responses = await db.getResponses(sessionId);
  if (!responses || responses.length === 0) return null;

  // If clinicId not provided, try to resolve from session's patient
  let resolvedClinicId = clinicId;
  if (!resolvedClinicId) {
    const database = await db.getDb();
    if (database) {
      const { anamnesisSessions } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [session] = await database.select().from(anamnesisSessions).where(eq(anamnesisSessions.id, sessionId)).limit(1);
      if (session?.patientId) {
        const patient = await db.getPatient(session.patientId);
        resolvedClinicId = patient?.clinicId ?? undefined;
      }
    }
  }

  const questions = await db.listQuestions(undefined, resolvedClinicId);
  if (!questions || questions.length === 0) {
    // Fallback to global questions if clinic-scoped returns empty
    const globalQuestions = await db.listQuestions();
    if (!globalQuestions || globalQuestions.length === 0) return null;
    return calculateScoreWithQuestions(responses, globalQuestions);
  }

  return calculateScoreWithQuestions(responses, questions);
}

async function calculateScoreWithQuestions(
  responses: Awaited<ReturnType<typeof db.getResponses>>,
  questions: Awaited<ReturnType<typeof db.listQuestions>>
): Promise<ScoreResult> {
  const mappedResponses = responses.map(r => ({
    questionId: r.questionId,
    code: (questions.find(q => q.id === r.questionId) as any)?.code ?? undefined,
    answerText: r.answerText ?? undefined,
    answerNumber: r.answerNumber ? String(r.answerNumber) : undefined,
    answerJson: r.answerJson,
  }));

  return calculateScore(mappedResponses, questions as any);
}
