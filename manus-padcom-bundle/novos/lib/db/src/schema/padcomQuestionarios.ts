import { pgTable, varchar, integer, timestamp, jsonb, boolean, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Questionários — Catálogo das 34 perguntas distribuídas em 5 módulos.
 *
 * Módulos:
 *   1 — Hábitos de Vida (7 perguntas)
 *   2 — Sintomas Gerais (8 perguntas)
 *   3 — Saúde Digestiva (6 perguntas)
 *   4 — Saúde Mental e Sono (7 perguntas)
 *   5 — Histórico e Medicamentos (6 perguntas)
 *
 * Regras:
 *   - Cada pergunta tem peso (peso) que influencia o score final
 *   - opcoes é um JSONB com as alternativas e seus valores numéricos
 *   - versao permite evolução do questionário sem perder histórico
 *   - clinicaId para multi-tenant
 */
export const padcomQuestionariosTable = pgTable("padcom_questionarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  modulo: integer("modulo").notNull(),
  ordem: integer("ordem").notNull(),
  pergunta: varchar("pergunta", { length: 500 }).notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 50 }).notNull().default("escala"),
  opcoes: jsonb("opcoes"),
  peso: integer("peso").notNull().default(1),
  versao: integer("versao").notNull().default(1),
  obrigatoria: boolean("obrigatoria").notNull().default(true),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const insertPadcomQuestionarioSchema = createInsertSchema(padcomQuestionariosTable);
export const selectPadcomQuestionarioSchema = createSelectSchema(padcomQuestionariosTable);
