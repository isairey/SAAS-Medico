# DIFF — Arquivos Novos vs Modificados

> PADCOM V15 — Manus Bundle
> Data: 17/04/2026

---

## Arquivos NOVOS (14 arquivos — copiar diretamente)

| # | Caminho | Descrição |
|---|---|---|
| 1 | `lib/db/src/schema/padcomQuestionarios.ts` | Schema: catálogo de 34 perguntas em 5 módulos |
| 2 | `lib/db/src/schema/padcomSessoes.ts` | Schema: sessão por paciente com score e banda |
| 3 | `lib/db/src/schema/padcomRespostas.ts` | Schema: resposta individual de cada pergunta |
| 4 | `lib/db/src/schema/padcomBandas.ts` | Schema: 4 bandas de conduta + ações do motor |
| 5 | `lib/db/src/schema/padcomAlertas.ts` | Schema: alertas automáticos + regras de alerta |
| 6 | `lib/db/src/schema/padcomAuditoria.ts` | Schema: log de auditoria LGPD |
| 7 | `artifacts/api-server/src/routes/padcom.ts` | Rotas REST: CRUD completo + motor scoring |
| 8 | `artifacts/clinica-motor/src/pages/padcom/paciente.tsx` | UI: fluxo paciente mobile-first |
| 9 | `artifacts/clinica-motor/src/pages/padcom/concluido.tsx` | UI: tela de conclusão + próximos passos |
| 10 | `artifacts/clinica-motor/src/pages/padcom/admin.tsx` | UI: fila de sessões com chips por banda |
| 11 | `artifacts/clinica-motor/src/pages/padcom/admin-detalhe.tsx` | UI: detalhe da sessão + ações motor |
| 12 | `artifacts/clinica-motor/src/pages/padcom/admin-dashboard.tsx` | UI: Recharts distribuição + funil + abandono |
| 13 | `seeds/001-padcom-questionarios.sql` | Seed: 34 perguntas |
| 14 | `seeds/002-padcom-bandas.sql` | Seed: 4 bandas de conduta |
| 15 | `seeds/003-padcom-alertas-regras.sql` | Seed: 8 regras de alerta default |

## Arquivos MODIFICADOS (3 arquivos — aplicar diff incremental)

| # | Caminho | Modificação |
|---|---|---|
| 1 | `lib/db/src/schema/index.ts` | Adicionar 6 linhas de re-export dos schemas PADCOM |
| 2 | `artifacts/api-server/src/routes/index.ts` | Adicionar 1 import + 1 router.use |
| 3 | `artifacts/clinica-motor/src/App.tsx` | Adicionar 5 imports + 5 rotas |

**Total de linhas adicionadas em arquivos existentes**: ~17 linhas

**Nenhum arquivo existente foi removido ou alterado** (ADDITIVE-ONLY).

---

## Verificação de Não-Colisão (Regra 4.8)

Nenhum nome de tabela PADCOM colide com as 138+ tabelas existentes:

| Tabela nova | Colide com existente? |
|---|---|
| `padcom_questionarios` | Não |
| `padcom_sessoes` | Não (existe `sessoes` mas sem prefixo `padcom_`) |
| `padcom_respostas` | Não |
| `padcom_bandas` | Não |
| `padcom_alertas` | Não (existe `alertas_notificacao` mas nome diferente) |
| `padcom_alertas_regras` | Não |
| `padcom_auditoria` | Não (existe `auditoria_cascata` mas nome diferente) |

Nenhuma rota PADCOM colide com as 66 rotas existentes:

| Rota nova | Colide com existente? |
|---|---|
| `/padcom-questionarios` | Não |
| `/padcom-sessoes` | Não |
| `/padcom-bandas` | Não |
| `/padcom-dashboard` | Não (existe `/dashboard` mas sem prefixo) |
| `/padcom-alertas` | Não |
| `/padcom-alertas-regras` | Não |
| `/padcom-auditoria` | Não |
