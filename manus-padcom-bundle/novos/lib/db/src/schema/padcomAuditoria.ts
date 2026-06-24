import { pgTable, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Auditoria — Log LGPD de todas as ações no sistema PADCOM.
 *
 * Registra:
 *   - Quem fez (usuarioId, papel)
 *   - O que fez (acao: criar, editar, visualizar, excluir, validar, exportar)
 *   - Em que entidade (entidadeTipo + entidadeId)
 *   - Dados antes e depois (para rollback e compliance)
 *   - IP e dispositivo (para auditoria de segurança)
 *
 * Kaizen #10 — Anonimização LGPD:
 *   Campo anonimizado permite marcar registros que foram sanitizados
 *   a pedido do titular dos dados (Art. 18 LGPD).
 *
 * Integração com cascata de validação:
 *   Cada etapa da cascata gera um registro de auditoria com certificado digital.
 */
export const padcomAuditoriaTable = pgTable("padcom_auditoria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  usuarioId: varchar("usuario_id"),
  papel: varchar("papel", { length: 50 }),
  acao: varchar("acao", { length: 50 }).notNull(),
  entidadeTipo: varchar("entidade_tipo", { length: 50 }).notNull(),
  entidadeId: varchar("entidade_id"),
  dadosAntes: jsonb("dados_antes"),
  dadosDepois: jsonb("dados_depois"),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  certificadoDigital: varchar("certificado_digital", { length: 200 }),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertPadcomAuditoriaSchema = createInsertSchema(padcomAuditoriaTable);
export const selectPadcomAuditoriaSchema = createSelectSchema(padcomAuditoriaTable);
