import { pgTable, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PADCOM Sessões — Uma sessão por paciente por tentativa de anamnese.
 *
 * Fluxo:
 *   1. Paciente inicia → status = "em_andamento"
 *   2. Responde perguntas → scoreParcial atualizado em tempo real
 *   3. Finaliza → status = "finalizada", scoreFinal calculado, banda determinada
 *   4. Médico valida → status = "validada"
 *
 * Kaizen #2 — Snapshot imutável:
 *   respostasSnapshot armazena cópia JSON de todas as respostas no momento
 *   da finalização. Se as perguntas mudarem depois, o snapshot preserva o contexto.
 *
 * Kaizen #7 — Telemetria de abandono:
 *   ultimoModuloVisitado + ultimaPerguntaRespondida rastreiam onde o paciente
 *   parou, permitindo análise de abandono por módulo.
 */
export const padcomSessoesTable = pgTable("padcom_sessoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicaId: varchar("clinica_id"),
  pacienteId: varchar("paciente_id").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("em_andamento"),
  scoreFinal: integer("score_final"),
  banda: varchar("banda", { length: 30 }),
  versaoQuestionario: integer("versao_questionario").notNull().default(1),
  respostasSnapshot: jsonb("respostas_snapshot"),
  ultimoModuloVisitado: integer("ultimo_modulo_visitado").default(1),
  ultimaPerguntaRespondida: integer("ultima_pergunta_respondida").default(0),
  totalPerguntas: integer("total_perguntas").default(34),
  perguntasRespondidas: integer("perguntas_respondidas").default(0),
  tempoTotalSegundos: integer("tempo_total_segundos"),
  origemCanal: varchar("origem_canal", { length: 50 }),
  dispositivoInfo: jsonb("dispositivo_info"),
  anonimizado: boolean("anonimizado").notNull().default(false),
  iniciadaEm: timestamp("iniciada_em").notNull().defaultNow(),
  finalizadaEm: timestamp("finalizada_em"),
  validadaEm: timestamp("validada_em"),
  validadaPor: varchar("validada_por"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const insertPadcomSessaoSchema = createInsertSchema(padcomSessoesTable);
export const selectPadcomSessaoSchema = createSelectSchema(padcomSessoesTable);
