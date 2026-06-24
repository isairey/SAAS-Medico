import { pgTable, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Bandas — 4 faixas de conduta clínica baseadas no score.
 *
 * Bandas padrão:
 *   Verde  (0-25)   → Manutenção preventiva
 *   Amarela (26-50)  → Atenção moderada, exames básicos
 *   Laranja (51-75)  → Intervenção ativa, fórmula + exames
 *   Vermelha (76-100) → Urgência clínica, IM/EV + acompanhamento intensivo
 *
 * acoesMotor é JSONB com as ações sugeridas pelo motor:
 *   { exames: [...], formulas: [...], injetaveis: [...], implantes: [...],
 *     orientacoes: [...], encaminhamentos: [...] }
 *
 * nivelValidacao determina N1/N2/N3:
 *   N1 = auto (IA valida), N2 = semi (1 clique), N3 = manual (cascata completa)
 *
 * Integração com competência regulatória:
 *   Cada ação do motor tem um riskLevel que determina quem pode executar.
 */
export const padcomBandasTable = pgTable("padcom_bandas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  nome: varchar("nome", { length: 100 }).notNull(),
  cor: varchar("cor", { length: 20 }).notNull(),
  scoreMinimo: integer("score_minimo").notNull(),
  scoreMaximo: integer("score_maximo").notNull(),
  descricao: varchar("descricao", { length: 500 }),
  nivelValidacao: varchar("nivel_validacao", { length: 10 }).notNull().default("N3"),
  acoesMotor: jsonb("acoes_motor"),
  prioridade: integer("prioridade").notNull().default(1),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const insertPadcomBandaSchema = createInsertSchema(padcomBandasTable);
export const selectPadcomBandaSchema = createSelectSchema(padcomBandasTable);
