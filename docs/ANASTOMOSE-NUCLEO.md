# Relatório de Anastomose: PADCOM SAAS ↔ Núcleo (Integrative Health Engine)

**Data:** 17/04/2026  
**Objetivo:** Mapear todas as conexões, aliases e pontos de transplante entre o PADCOM SAAS (órgão artificial) e o Núcleo PAWARDS (corpo hígido).

---

## 1. Validação de Acesso ao Código Matriz

| Item | Status |
|------|--------|
| Repositório GitHub | Clonado com sucesso (253 MB, 3836 objetos) |
| URL | `https://github.com/caio-padua/Integrative-Health-Engine.git` |
| Estrutura | Monorepo pnpm workspaces |
| Tabelas no Núcleo | **144 tabelas** PostgreSQL (pgTable) |
| Tabelas no PADCOM SAAS | **29 tabelas** MySQL (mysqlTable) |
| Rotas no Núcleo | **67 arquivos** de rotas Express |
| Frontend Núcleo | React + Vite + Tailwind + shadcn/ui + Wouter |
| Frontend PADCOM SAAS | React + Vite + Tailwind 4 + shadcn/ui + Wouter + tRPC |

---

## 2. Arquitetura Comparada

### Núcleo (Integrative Health Engine)

| Camada | Tecnologia | Localização |
|--------|-----------|-------------|
| DB Schema | Drizzle ORM + PostgreSQL | `lib/db/src/schema/*.ts` |
| Validação | Zod v4 + drizzle-zod | `lib/api-zod/src/generated/` |
| API Client | Orval (OpenAPI-first) | `lib/api-client-react/` |
| Backend | Express 5 + REST | `artifacts/api-server/src/routes/` |
| Frontend | React 19 + Vite + Wouter | `artifacts/clinica-motor/src/` |
| Multi-unit | `useClinic()` + `?unidadeId` | Context-based filtering |

### PADCOM SAAS

| Camada | Tecnologia | Localização |
|--------|-----------|-------------|
| DB Schema | Drizzle ORM + MySQL/TiDB | `drizzle/schema.ts` |
| Validação | Zod (inline no tRPC) | `server/routers.ts` |
| API | tRPC 11 (procedures) | `server/routers.ts` |
| Frontend | React 19 + Vite + Wouter | `client/src/pages/` |
| Multi-tenant | `clinicId` em todas as tabelas | Schema-level filtering |

---

## 3. Mapeamento de Nomenclatura (Aliases de Anastomose)

### 3.1 Entidades Principais

| PADCOM SAAS (EN) | Núcleo (PT-BR) | Tipo de Ligação | Notas |
|-------------------|-----------------|-----------------|-------|
| `patients` | `pacientes` | **Aço** (estrutural) | Campo `clinicId` → `unidade_id` |
| `consultants` | `usuarios` (escopo=consultor_campo) | **Concreto** (funcional) | Núcleo usa perfis/escopos, não tabela separada |
| `clinics` | `unidades` + `consultorias` | **Hidráulica** (hierárquica) | Clinic = Unidade; ClinicGroup = Consultoria |
| `anamnesis_questions` | `questionario_master` (catálogo) | **Vaso sanguíneo** | Núcleo usa catálogo unificado |
| `anamnesis_sessions` | `anamneses` | **Aço** | Status: pendente/em_andamento/concluida/validada |
| `anamnesis_responses` | `anamneses.respostas_clincias` (JSONB) | **PVC** (adaptação) | Núcleo armazena em JSONB, SAAS em tabela relacional |
| `prescriptions` | `tratamentos` | **Concreto** | Núcleo tem modelo financeiro completo |
| `prescription_components` | `tratamento_itens` | **Concreto** | Tipo expandido no núcleo |
| `daily_reports` | `questionario_respostas` | **PVC** | Núcleo usa questionário genérico |
| `alerts` | `alertas_notificacao` | **Vaso sanguíneo** | Núcleo tem canais: SISTEMA/WHATSAPP/EMAIL |
| `alert_rules` | `regras_motor` | **Aço** | Núcleo usa segmento + palavra-chave |
| `exams` | `exames_base` + `exames_evolucao` | **Hidráulica** | Núcleo separa base de evolução |
| `follow_up_sessions` | `followups` | **Aço** | Estrutura similar |
| `scoring_weights` | Motor Clínico (sugestões) | **Vaso sanguíneo** | Núcleo usa motor de sugestões, não scoring numérico |
| `scoring_bands` | Não existe equivalente direto | **Novo órgão** | SAAS contribui com scoring quantitativo |
| `clinical_flags` | `sinais_semanticos` (array em anamneses) | **PVC** | Núcleo usa array de strings |
| `funnel_status` | `comercial` + `comercialConfig` | **Hidráulica** | Núcleo tem motor comercial completo |
| `medications` | `substancias` + catálogo (formulas/injetaveis/etc) | **Concreto** | Núcleo tem catálogo unificado |
| `motor_actions` | `sugestoes_clinicas` | **Aço** | Núcleo: tipo + prioridade + validação |
| `team_queue` | `filas_operacionais` | **Vaso sanguíneo** | Núcleo tem SLA + semáforo |
| `protocol_documents` | `protocolos` + `protocolos_master` | **Concreto** | Núcleo tem fases e ações |
| `audit_log` | `eventos_clinicos` | **Aço** | Núcleo: tipo enum expandido |
| `users` | `usuarios` | **Aço** | Núcleo: perfil + escopo + permissões booleanas |

### 3.2 Campos Críticos de Anastomose

| Campo PADCOM SAAS | Campo Núcleo | Transformação Necessária |
|--------------------|-------------|--------------------------|
| `clinicId` (INT) | `unidade_id` (INT) | Alias direto |
| `patient.token` (VARCHAR) | `paciente.senha_portal` | SAAS usa token público; Núcleo usa senha bcrypt |
| `patient.cpf` | `paciente.cpf` | Idêntico |
| `consultant.role` (enum) | `usuario.perfil` + `usuario.escopo` | **NUNCA usar "role"** no núcleo (regra do usuário) |
| `question.category` (enum) | Catálogo por tipo (exame/formula/etc) | Mapear categorias |
| `question.code` (VARCHAR) | `codigo_padcom` / `codigo_semantico` | Usar sistema B1 B2 B3 B4 SEQ |
| `prescription.status` | `tratamento.status` | Enums diferentes |
| `alert.severity` | `alerta.tipo` | Mapear severidade → tipo |
| `scoring_weights.*` | Motor de regras semântico | Transplante como módulo novo |

---

## 4. Regras de Nomenclatura do Núcleo (OBRIGATÓRIAS)

Estas regras **NUNCA** podem ser violadas no transplante:

1. **Nomes completos e semânticos** — nunca abreviar (`auditoria_cascata`, não `aud_cascata`)
2. **Campo `perfil`** — NUNCA usar `role` (confusão com routing)
3. **Prefixos booleanos** — `pode_` (permissão), `nunca_` (restrição permanente), `requer_` (condição obrigatória)
4. **Timestamps** — sempre `criado_em` e `atualizado_em` com timezone
5. **Auditabilidade** — campos `origem`, `versao_schema`, `arquivado_em` em novos schemas
6. **Tabelas existentes** — NUNCA dropar, apenas adicionar colunas
7. **Nomes antigos** — referenciar em comentários quando renomear

---

## 5. Pontos de Anastomose Seguros (Ligações em Aço)

Estas conexões podem ser feitas com segurança total:

| Ponto | PADCOM SAAS | Núcleo | Ação |
|-------|-------------|--------|------|
| Pacientes | `patients` | `pacientes` | Alias de campos + adicionar `unidade_id` |
| Sessões | `anamnesis_sessions` | `anamneses` | Mapear status + adicionar `sinais_semanticos` |
| Follow-up | `follow_up_sessions` | `followups` | Estrutura compatível |
| Auditoria | `audit_log` | `eventos_clinicos` | Expandir tipo enum |
| Motor | `motor_actions` | `sugestoes_clinicas` | Mapear tipo + prioridade |

---

## 6. Pontos de Anastomose com Adaptação (Ligações em PVC/Hidráulica)

Estas conexões requerem camada de adaptação:

| Ponto | Desafio | Solução Proposta |
|-------|---------|------------------|
| Respostas de anamnese | SAAS: tabela relacional; Núcleo: JSONB | Criar adapter que serializa/deserializa |
| Scoring Engine | SAAS: scoring numérico quantitativo; Núcleo: motor semântico qualitativo | **Módulo novo** — SAAS contribui scoring como camada complementar |
| Multi-tenant | SAAS: `clinicId` em cada tabela; Núcleo: `unidade_id` via FK | Renomear campo no transplante |
| Alertas | SAAS: severity-based; Núcleo: tipo + canal + SLA | Expandir modelo de alertas |
| Catálogo | SAAS: `medications` genérico; Núcleo: 5 catálogos separados | Mapear por tipo para catálogo correto |
| Portal paciente | SAAS: token público; Núcleo: CPF + data nascimento + senha bcrypt | Adicionar autenticação dupla |

---

## 7. Contribuições Únicas do PADCOM SAAS (Órgãos Novos)

Funcionalidades que o PADCOM SAAS traz e que **não existem** no Núcleo:

| Funcionalidade | Valor | Integração |
|----------------|-------|------------|
| **Scoring Engine V15** | Pontuação quantitativa por sistemas clínicos (sono, atividade, polifarmácia) | Módulo complementar ao motor semântico |
| **Scoring Bands** | Faixas de complexidade (Básico/Intermediário/Avançado/Full) com protocolos associados | Nova tabela no núcleo |
| **Clinical Flags automáticas** | Detecção automática de flags por resposta de anamnese | Enriquecer `sinais_semanticos` |
| **Daily Reports estruturados** | Relatos diários do paciente com scoring integrado | Complementar `questionario_respostas` |
| **Prescription Reports** | Relatórios de prescrição com auto-alertas | Enriquecer `tratamentos` |
| **Flow Config** | Configuração de fluxo por clínica | Complementar `fluxos_aprovacoes` |
| **Polypharmacy Rules** | Regras de polifarmácia com interações | Novo módulo de segurança farmacológica |

---

## 8. Riscos de Quebra no Transplante

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Campo `role` no PADCOM SAAS | **CRÍTICO** | Renomear para `perfil` antes do transplante |
| MySQL vs PostgreSQL | **ALTO** | Adaptar tipos (mysqlEnum → text enum, mysqlTable → pgTable) |
| tRPC vs Express REST | **ALTO** | Criar camada adapter tRPC → REST ou migrar procedures para routes |
| Nomes em inglês vs português | **ALTO** | Criar dicionário de aliases completo |
| JSONB vs tabelas relacionais | **MÉDIO** | Adapter de serialização bidirecional |
| Timestamps sem timezone | **MÉDIO** | Adicionar `withTimezone: true` em todos os campos |
| Ausência de `origem`/`versao_schema` | **MÉDIO** | Adicionar campos de auditabilidade |

---

## 9. Plano de Transplante (Ordem de Execução)

### Fase 1 — Preparação (Sem tocar no Núcleo)
1. Renomear `role` → `perfil` em todo o PADCOM SAAS
2. Traduzir nomes de tabelas EN → PT-BR
3. Adicionar campos de auditabilidade (`origem`, `versao_schema`, `arquivado_em`)
4. Converter timestamps para `withTimezone: true`
5. Criar dicionário de aliases definitivo

### Fase 2 — Adaptadores (Camada de Interface)
1. Criar adapter tRPC → Express REST
2. Criar adapter MySQL → PostgreSQL (tipos)
3. Criar serializer respostas relacional ↔ JSONB
4. Criar mapper clinicId ↔ unidadeId

### Fase 3 — Transplante (Enxerto no Núcleo)
1. Adicionar tabelas novas (scoring_bands, scoring_weights, clinical_flags expandido)
2. Adicionar colunas novas em tabelas existentes (NUNCA dropar)
3. Criar rotas Express equivalentes às procedures tRPC
4. Integrar scoring engine como módulo do motor clínico
5. Conectar alertas do SAAS ao sistema de notificações do núcleo

### Fase 4 — Validação (Testes de Anastomose)
1. Testes semânticos de nomenclatura
2. Testes de integridade referencial
3. Testes de fluxo end-to-end
4. Testes de isolamento multi-unidade

---

## 10. Dicionário de Aliases Completo

| PADCOM SAAS (EN) | Núcleo (PT-BR) | Tipo |
|-------------------|-----------------|------|
| `patients` | `pacientes` | Tabela |
| `consultants` | `usuarios` (escopo=consultor_campo) | Tabela/Filtro |
| `clinics` | `unidades` | Tabela |
| `anamnesis_questions` | `questionario_master` | Tabela |
| `anamnesis_sessions` | `anamneses` | Tabela |
| `anamnesis_responses` | `anamneses.respostas_clincias` | Campo JSONB |
| `prescriptions` | `tratamentos` | Tabela |
| `prescription_components` | `tratamento_itens` | Tabela |
| `daily_reports` | `questionario_respostas` | Tabela |
| `alerts` | `alertas_notificacao` | Tabela |
| `alert_rules` | `regras_motor` | Tabela |
| `exams` | `exames_base` | Tabela |
| `follow_up_sessions` | `followups` | Tabela |
| `motor_actions` | `sugestoes_clinicas` | Tabela |
| `team_queue` | `filas_operacionais` | Tabela |
| `protocol_documents` | `protocolos` | Tabela |
| `audit_log` | `eventos_clinicos` | Tabela |
| `users` | `usuarios` | Tabela |
| `clinical_flags` | `sinais_semanticos` | Campo Array |
| `funnel_status` | `comercial` | Tabela |
| `medications` | `substancias` | Tabela |
| `clinicId` | `unidade_id` | Campo FK |
| `role` | `perfil` | Campo Enum |
| `token` | `senha_portal` | Campo Auth |
| `createdAt` | `criado_em` | Campo Timestamp |
| `updatedAt` | `atualizado_em` | Campo Timestamp |
| `scoring_weights` | (novo) `pesos_pontuacao` | Tabela Nova |
| `scoring_bands` | (novo) `faixas_pontuacao` | Tabela Nova |
| `sleep_details` | (novo) `detalhes_sono` | Tabela Nova |
| `physical_activity_details` | (novo) `detalhes_atividade_fisica` | Tabela Nova |
| `polypharmacy_rules` | (novo) `regras_polifarmacia` | Tabela Nova |
| `flow_config` | (novo) `configuracao_fluxo` | Tabela Nova |
| `clinical_systems` | (novo) `sistemas_clinicos` | Tabela Nova |
