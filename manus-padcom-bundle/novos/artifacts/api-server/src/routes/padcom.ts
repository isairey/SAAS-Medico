import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  padcomQuestionariosTable,
  insertPadcomQuestionarioSchema,
  padcomSessoesTable,
  insertPadcomSessaoSchema,
  padcomRespostasTable,
  insertPadcomRespostaSchema,
  padcomBandasTable,
  padcomAlertasTable,
  padcomAlertasRegrasTable,
  padcomAuditoriaTable,
} from "@workspace/db";
import { eq, asc, and, desc, sql, count, avg } from "drizzle-orm";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// QUESTIONÁRIOS — CRUD do catálogo de perguntas
// ═══════════════════════════════════════════════════════════════

router.get("/padcom-questionarios", async (req: Request, res: Response): Promise<void> => {
  const { clinicaId, modulo, versao, ativo } = req.query;
  let query = db.select().from(padcomQuestionariosTable);

  const conditions = [];
  if (clinicaId) conditions.push(eq(padcomQuestionariosTable.clinicaId, String(clinicaId)));
  if (modulo) conditions.push(eq(padcomQuestionariosTable.modulo, Number(modulo)));
  if (versao) conditions.push(eq(padcomQuestionariosTable.versao, Number(versao)));
  if (ativo !== undefined) conditions.push(eq(padcomQuestionariosTable.ativo, ativo === "true"));

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(asc(padcomQuestionariosTable.modulo), asc(padcomQuestionariosTable.ordem))
    : await query.orderBy(asc(padcomQuestionariosTable.modulo), asc(padcomQuestionariosTable.ordem));

  res.json(rows);
});

router.post("/padcom-questionarios", async (req: Request, res: Response): Promise<void> => {
  const parsed = insertPadcomQuestionarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [row] = await db.insert(padcomQuestionariosTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/padcom-questionarios/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = { ...req.body, atualizadoEm: new Date() };
  const [row] = await db.update(padcomQuestionariosTable)
    .set(updates)
    .where(eq(padcomQuestionariosTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Questionário não encontrado" }); return; }
  res.json(row);
});

router.delete("/padcom-questionarios/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const [row] = await db.update(padcomQuestionariosTable)
    .set({ ativo: false, atualizadoEm: new Date() })
    .where(eq(padcomQuestionariosTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Questionário não encontrado" }); return; }
  res.json(row);
});

// ═══════════════════════════════════════════════════════════════
// SESSÕES — Iniciar, responder, finalizar
// ═══════════════════════════════════════════════════════════════

router.post("/padcom-sessoes", async (req: Request, res: Response): Promise<void> => {
  const parsed = insertPadcomSessaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Contar total de perguntas ativas para esta versão
  const perguntas = await db.select({ total: count() })
    .from(padcomQuestionariosTable)
    .where(and(
      eq(padcomQuestionariosTable.ativo, true),
      parsed.data.clinicaId
        ? eq(padcomQuestionariosTable.clinicaId, parsed.data.clinicaId)
        : sql`true`
    ));

  const [row] = await db.insert(padcomSessoesTable).values({
    ...parsed.data,
    totalPerguntas: perguntas[0]?.total ?? 34,
  }).returning();

  // Auditoria
  await db.insert(padcomAuditoriaTable).values({
    clinicaId: row.clinicaId,
    usuarioId: row.pacienteId,
    papel: "paciente",
    acao: "criar",
    entidadeTipo: "sessao",
    entidadeId: row.id,
    dadosDepois: row,
  });

  res.status(201).json(row);
});

router.post("/padcom-sessoes/:id/responder", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = insertPadcomRespostaSchema.safeParse({ ...req.body, sessaoId: id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Buscar a pergunta para calcular score parcial
  const pergunta = parsed.data.questionarioId
    ? await db.select().from(padcomQuestionariosTable)
        .where(eq(padcomQuestionariosTable.id, parsed.data.questionarioId))
        .then(r => r[0])
    : null;

  const scoreParcial = pergunta && parsed.data.valorNumerico != null
    ? parsed.data.valorNumerico * (pergunta.peso ?? 1)
    : parsed.data.scoreParcial ?? 0;

  const [resposta] = await db.insert(padcomRespostasTable).values({
    ...parsed.data,
    scoreParcial,
  }).returning();

  // Atualizar sessão: incrementar respondidas + último módulo
  const respostasCount = await db.select({ total: count() })
    .from(padcomRespostasTable)
    .where(eq(padcomRespostasTable.sessaoId, id));

  await db.update(padcomSessoesTable).set({
    perguntasRespondidas: respostasCount[0]?.total ?? 0,
    ultimoModuloVisitado: parsed.data.modulo,
    ultimaPerguntaRespondida: parsed.data.ordem,
    atualizadoEm: new Date(),
  }).where(eq(padcomSessoesTable.id, id));

  res.status(201).json(resposta);
});

router.post("/padcom-sessoes/:id/finalizar", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Buscar todas as respostas da sessão
  const respostas = await db.select()
    .from(padcomRespostasTable)
    .where(eq(padcomRespostasTable.sessaoId, id))
    .orderBy(asc(padcomRespostasTable.modulo), asc(padcomRespostasTable.ordem));

  if (respostas.length === 0) {
    res.status(400).json({ error: "Sessão sem respostas" });
    return;
  }

  // Calcular score final (soma dos scores parciais, normalizado 0-100)
  const somaScores = respostas.reduce((acc, r) => acc + (r.scoreParcial ?? 0), 0);
  const maxPossivel = respostas.length * 10; // máximo teórico
  const scoreFinal = Math.round((somaScores / Math.max(maxPossivel, 1)) * 100);

  // Determinar banda
  const bandas = await db.select()
    .from(padcomBandasTable)
    .where(eq(padcomBandasTable.ativo, true))
    .orderBy(asc(padcomBandasTable.scoreMinimo));

  const bandaEncontrada = bandas.find(b =>
    scoreFinal >= b.scoreMinimo && scoreFinal <= b.scoreMaximo
  );

  // Criar snapshot imutável (Kaizen #2)
  const snapshot = {
    respostas: respostas.map(r => ({
      questionarioId: r.questionarioId,
      modulo: r.modulo,
      ordem: r.ordem,
      valorNumerico: r.valorNumerico,
      valorTexto: r.valorTexto,
      scoreParcial: r.scoreParcial,
      tempoRespostaMs: r.tempoRespostaMs,
    })),
    scoreFinal,
    banda: bandaEncontrada?.nome ?? "indefinida",
    finalizadoEm: new Date().toISOString(),
  };

  // Atualizar sessão
  const [sessao] = await db.update(padcomSessoesTable).set({
    status: "finalizada",
    scoreFinal,
    banda: bandaEncontrada?.nome ?? "indefinida",
    respostasSnapshot: snapshot,
    finalizadaEm: new Date(),
    atualizadoEm: new Date(),
  }).where(eq(padcomSessoesTable.id, id)).returning();

  // Avaliar regras de alerta
  const regras = await db.select()
    .from(padcomAlertasRegrasTable)
    .where(eq(padcomAlertasRegrasTable.ativo, true));

  for (const regra of regras) {
    const condicao = regra.condicao as any;
    let disparar = false;

    if (condicao?.campo === "scoreFinal") {
      const op = condicao.operador;
      const val = condicao.valor;
      if (op === ">" && scoreFinal > val) disparar = true;
      if (op === ">=" && scoreFinal >= val) disparar = true;
      if (op === "<" && scoreFinal < val) disparar = true;
      if (op === "==" && scoreFinal === val) disparar = true;
    }

    if (disparar) {
      await db.insert(padcomAlertasTable).values({
        clinicaId: sessao.clinicaId,
        sessaoId: id,
        pacienteId: sessao.pacienteId,
        tipo: "score_critico",
        severidade: regra.severidade,
        titulo: regra.nome,
        descricao: `Score ${scoreFinal} disparou regra: ${regra.nome}`,
        dadosExtra: { regra: regra.condicao, acao: regra.acaoJson },
      });
    }
  }

  // Auditoria
  await db.insert(padcomAuditoriaTable).values({
    clinicaId: sessao.clinicaId,
    usuarioId: sessao.pacienteId,
    papel: "sistema",
    acao: "finalizar",
    entidadeTipo: "sessao",
    entidadeId: id,
    dadosDepois: { scoreFinal, banda: bandaEncontrada?.nome },
  });

  res.json({
    sessao,
    banda: bandaEncontrada,
    alertasGerados: regras.filter(r => {
      const c = r.condicao as any;
      return c?.campo === "scoreFinal" && c?.operador === ">" && scoreFinal > c.valor;
    }).length,
  });
});

router.get("/padcom-sessoes/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const [sessao] = await db.select()
    .from(padcomSessoesTable)
    .where(eq(padcomSessoesTable.id, id));

  if (!sessao) { res.status(404).json({ error: "Sessão não encontrada" }); return; }

  const respostas = await db.select()
    .from(padcomRespostasTable)
    .where(eq(padcomRespostasTable.sessaoId, id))
    .orderBy(asc(padcomRespostasTable.modulo), asc(padcomRespostasTable.ordem));

  const alertas = await db.select()
    .from(padcomAlertasTable)
    .where(eq(padcomAlertasTable.sessaoId, id));

  res.json({ sessao, respostas, alertas });
});

// Listar sessões (admin) com filtros
router.get("/padcom-sessoes", async (req: Request, res: Response): Promise<void> => {
  const { clinicaId, status, banda, pacienteId, limit } = req.query;
  const conditions = [];
  if (clinicaId) conditions.push(eq(padcomSessoesTable.clinicaId, String(clinicaId)));
  if (status) conditions.push(eq(padcomSessoesTable.status, String(status)));
  if (banda) conditions.push(eq(padcomSessoesTable.banda, String(banda)));
  if (pacienteId) conditions.push(eq(padcomSessoesTable.pacienteId, String(pacienteId)));

  let query = db.select().from(padcomSessoesTable);
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;

  const rows = await query
    .orderBy(desc(padcomSessoesTable.criadoEm))
    .limit(Number(limit) || 100);

  res.json(rows);
});

// ═══════════════════════════════════════════════════════════════
// BANDAS — Config das 4 bandas de conduta
// ═══════════════════════════════════════════════════════════════

router.get("/padcom-bandas", async (req: Request, res: Response): Promise<void> => {
  const rows = await db.select()
    .from(padcomBandasTable)
    .where(eq(padcomBandasTable.ativo, true))
    .orderBy(asc(padcomBandasTable.scoreMinimo));
  res.json(rows);
});

router.post("/padcom-bandas", async (req: Request, res: Response): Promise<void> => {
  const parsed = insertPadcomBandaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [row] = await db.insert(padcomBandasTable).values(parsed.data).returning();
  res.status(201).json(row);
});

// ═══════════════════════════════════════════════════════════════
// ALERTAS — CRUD + resolução
// ═══════════════════════════════════════════════════════════════

router.get("/padcom-alertas", async (req: Request, res: Response): Promise<void> => {
  const { clinicaId, status, severidade } = req.query;
  const conditions = [];
  if (clinicaId) conditions.push(eq(padcomAlertasTable.clinicaId, String(clinicaId)));
  if (status) conditions.push(eq(padcomAlertasTable.status, String(status)));
  if (severidade) conditions.push(eq(padcomAlertasTable.severidade, String(severidade)));

  let query = db.select().from(padcomAlertasTable);
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;

  const rows = await query.orderBy(desc(padcomAlertasTable.criadoEm));
  res.json(rows);
});

router.patch("/padcom-alertas/:id/resolver", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { resolvidoPor } = req.body;
  const [row] = await db.update(padcomAlertasTable).set({
    status: "resolvido",
    resolvidoPor,
    resolvidoEm: new Date(),
    atualizadoEm: new Date(),
  }).where(eq(padcomAlertasTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Alerta não encontrado" }); return; }
  res.json(row);
});

// ═══════════════════════════════════════════════════════════════
// DASHBOARD — Métricas agregadas (Kaizen #3 — score server-side)
// ═══════════════════════════════════════════════════════════════

router.get("/padcom-dashboard", async (req: Request, res: Response): Promise<void> => {
  const { clinicaId } = req.query;

  const conditions = clinicaId
    ? eq(padcomSessoesTable.clinicaId, String(clinicaId))
    : sql`true`;

  // Total de sessões por status
  const porStatus = await db.select({
    status: padcomSessoesTable.status,
    total: count(),
  }).from(padcomSessoesTable)
    .where(conditions)
    .groupBy(padcomSessoesTable.status);

  // Distribuição por banda
  const porBanda = await db.select({
    banda: padcomSessoesTable.banda,
    total: count(),
    scoreMedia: avg(padcomSessoesTable.scoreFinal),
  }).from(padcomSessoesTable)
    .where(and(conditions, eq(padcomSessoesTable.status, "finalizada")))
    .groupBy(padcomSessoesTable.banda);

  // Alertas pendentes
  const alertasPendentes = await db.select({ total: count() })
    .from(padcomAlertasTable)
    .where(and(
      clinicaId ? eq(padcomAlertasTable.clinicaId, String(clinicaId)) : sql`true`,
      eq(padcomAlertasTable.status, "pendente")
    ));

  // Telemetria de abandono (Kaizen #7)
  const abandonos = await db.select({
    ultimoModulo: padcomSessoesTable.ultimoModuloVisitado,
    total: count(),
  }).from(padcomSessoesTable)
    .where(and(conditions, eq(padcomSessoesTable.status, "em_andamento")))
    .groupBy(padcomSessoesTable.ultimoModuloVisitado);

  res.json({
    porStatus,
    porBanda,
    alertasPendentes: alertasPendentes[0]?.total ?? 0,
    abandonos,
  });
});

// ═══════════════════════════════════════════════════════════════
// AUDITORIA — Consulta de logs LGPD
// ═══════════════════════════════════════════════════════════════

router.get("/padcom-auditoria", async (req: Request, res: Response): Promise<void> => {
  const { clinicaId, entidadeTipo, acao, limit } = req.query;
  const conditions = [];
  if (clinicaId) conditions.push(eq(padcomAuditoriaTable.clinicaId, String(clinicaId)));
  if (entidadeTipo) conditions.push(eq(padcomAuditoriaTable.entidadeTipo, String(entidadeTipo)));
  if (acao) conditions.push(eq(padcomAuditoriaTable.acao, String(acao)));

  let query = db.select().from(padcomAuditoriaTable);
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;

  const rows = await query
    .orderBy(desc(padcomAuditoriaTable.criadoEm))
    .limit(Number(limit) || 50);

  res.json(rows);
});

export default router;
