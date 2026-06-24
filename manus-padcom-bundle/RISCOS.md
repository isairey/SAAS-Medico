# RISCOS — Análise de Riscos e Mitigações

> PADCOM V15 — Manus Bundle
> Data: 17/04/2026

---

## Riscos Identificados

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | FK lógica com `pacientes` — pacienteId pode referenciar ID inexistente | Média | Baixo | FK lógica sem `references()`. Validação na rota antes de criar sessão. Replit pode adicionar FK real após confirmar formato do ID |
| R2 | `routes/index.ts` mal-mergeado — rota não responde (404) | Baixa | Alto | Diff fornecido com instruções passo a passo. Testar com `curl-tests.sh` imediatamente após aplicar |
| R3 | `App.tsx` com import duplicado — build quebra | Baixa | Alto | Diff incremental, não reescrita. Verificar com `typecheck` antes de reiniciar |
| R4 | Zod V4 import vazado | Muito Baixa | Alto | Revisado: todos os imports usam `import { z } from "zod"` (V3). Nenhum import de `"zod/v4"` |
| R5 | Tipo de ID incompatível com `pacientes` existente | Média | Alto | Todos os IDs são `varchar` com `gen_random_uuid()`. Se `pacientes` usar formato diferente, ajustar `padcom_sessoes.pacienteId` |
| R6 | `clinicaId` nullable pode causar vazamento entre clínicas | Baixa | Alto | Nullable inicialmente (conforme HANDOFF). Replit pode adicionar `NOT NULL` + default após validar multi-tenant |
| R7 | localStorage `pawards:padcom:draft` conflita com outra feature | Muito Baixa | Baixo | Prefixo específico `pawards:padcom:` conforme solicitado no HANDOFF |
| R8 | Cores hardcoded no frontend | Muito Baixa | Baixo | Todas as cores usam tokens HSL `--pawards-cyan`, `--pawards-bg`, etc. Bandas usam cores semânticas fixas (verde/amarela/laranja/vermelha) |
| R9 | Auth/RLS não implementado nas rotas PADCOM | Alta | Médio | Documentado como limitação conhecida. Rotas estão abertas. Replit deve adicionar middleware de auth conforme padrão do projeto |
| R10 | Recharts pode ter conflito de versão | Baixa | Médio | Recharts já é dependência do projeto (`catalog:`). Não adicionamos versão fixa |
| R11 | Score calculado em memória pode ser lento com muitos pacientes | Baixa | Baixo | Score é calculado por sessão individual (34 perguntas). Para dashboard agregado, considerar view materializada no futuro (Kaizen) |
| R12 | Seeds SQL podem falhar se tabelas não existirem ainda | Média | Baixo | Seeds usam `ON CONFLICT DO NOTHING`. Executar APÓS `drizzle-kit push` |

---

## Limitações Conhecidas

| Limitação | Descrição | Plano |
|---|---|---|
| Sem autenticação | Rotas PADCOM não verificam sessão/token do usuário | Replit adiciona middleware de auth existente |
| Sem RLS (Row Level Security) | Queries não filtram por clinicaId automaticamente | Replit pode adicionar middleware ou WHERE clause global |
| Sem rate limiting | Rotas POST sem proteção contra spam | Replit pode adicionar rate-limit middleware existente |
| Sem validação 6Q | Botão "Enviar para 6Q" é placeholder — não integra com anamnese 6Q existente | Replit implementa integração com rota de anamnese existente |
| Sem notificação push | Alertas são criados no banco mas não disparam push | Integrar com sistema de notificação existente (agentes virtuais) |
| Sem export PDF | Sessão não gera PDF para prontuário | Integrar com lib PDF existente no mockup-sandbox |

---

## Plano de Contingência

Se algo quebrar durante o transplante:

1. **Build falha**: Verificar que imports usam `@workspace/db` e não paths relativos
2. **404 nas rotas**: Verificar que `routes/index.ts` tem `router.use(padcomRouter)` sem prefixo `/api/`
3. **Tela em branco**: Verificar que `App.tsx` tem as rotas na ordem correta (dashboard antes de :sessaoId)
4. **Seed falha**: Verificar que migration foi aplicada antes dos seeds
5. **Conflito de tipos**: Rodar `pnpm --filter @workspace/db typecheck` isoladamente

Em caso de falha irrecuperável: **reverter branch** e reportar ao Manus com o log de erro.
