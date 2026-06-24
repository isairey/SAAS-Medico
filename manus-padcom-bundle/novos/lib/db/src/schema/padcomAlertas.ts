import { pgTable, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Alertas — Alertas gerados automaticamente pelo motor.
 *
 * Tipos de alerta:
 *   - score_critico: score > 75 (banda vermelha)
 *   - resposta_alarme: resposta específica que dispara alerta imediato
 *   - abandono: paciente não finalizou em X horas
 *   - prazo_validacao: sessão aguardando validação médica há muito tempo
 *   - interacao_medicamentosa: motor detectou risco de interação
 *
 * Integração com cascata de validação:
 *   Alertas críticos entram automaticamente na fila do preceptor.
 */
export const padcomAlertasTable = pgTable("padcom_alertas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  sessaoId: varchar("sessao_id"),
  pacienteId: varchar("paciente_id"),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  severidade: varchar("severidade", { length: 20 }).notNull().default("media"),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: varchar("descricao", { length: 1000 }),
  dadosExtra: jsonb("dados_extra"),
  status: varchar("status", { length: 30 }).notNull().default("pendente"),
  resolvidoPor: varchar("resolvido_por"),
  resolvidoEm: timestamp("resolvido_em"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

/**
 * PADCOM Alertas Regras — Regras configuráveis que disparam alertas.
 *
 * Cada regra define:
 *   - condicao: expressão JSON avaliada pelo motor
 *     Ex: { campo: "scoreFinal", operador: ">", valor: 75 }
 *     Ex: { campo: "resposta.modulo3.q5", operador: "==", valor: 10 }
 *   - acaoJson: o que fazer quando dispara
 *     Ex: { tipo: "alerta", severidade: "critica", notificar: ["preceptor"] }
 */
export const padcomAlertasRegrasTable = pgTable("padcom_alertas_regras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  condicao: jsonb("condicao").notNull(),
  acaoJson: jsonb("acao_json").notNull(),
  severidade: varchar("severidade", { length: 20 }).notNull().default("media"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const insertPadcomAlertaSchema = createInsertSchema(padcomAlertasTable);
export const selectPadcomAlertaSchema = createSelectSchema(padcomAlertasTable);
export const insertPadcomAlertaRegraSchema = createInsertSchema(padcomAlertasRegrasTable);
export const selectPadcomAlertaRegraSchema = createSelectSchema(padcomAlertasRegrasTable);
