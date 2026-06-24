import { pgTable, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Respostas — Resposta individual de cada pergunta numa sessão.
 *
 * Cada resposta armazena:
 *   - valorNumerico: valor numérico da opção escolhida (0-10)
 *   - valorTexto: texto livre quando tipo = "texto_livre"
 *   - valorJson: dados estruturados para perguntas complexas
 *   - scoreParcial: contribuição desta resposta ao score total
 *   - tempoRespostaMs: milissegundos que o paciente levou para responder
 *     (Kaizen #7 — telemetria de engajamento)
 */
export const padcomRespostasTable = pgTable("padcom_respostas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  sessaoId: varchar("sessao_id").notNull(),
  questionarioId: varchar("questionario_id").notNull(),
  modulo: integer("modulo").notNull(),
  ordem: integer("ordem").notNull(),
  valorNumerico: integer("valor_numerico"),
  valorTexto: varchar("valor_texto", { length: 1000 }),
  valorJson: jsonb("valor_json"),
  scoreParcial: integer("score_parcial"),
  tempoRespostaMs: integer("tempo_resposta_ms"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const insertPadcomRespostaSchema = createInsertSchema(padcomRespostasTable);
export const selectPadcomRespostaSchema = createSelectSchema(padcomRespostasTable);
