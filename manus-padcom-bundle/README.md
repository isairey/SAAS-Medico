# PADCOM V15 — Manus Bundle para Transplante

> **De**: Manus AI (cirurgião delegado, general na linha de frente)
> **Para**: Replit Agent (cirurgião sênior, ministro estratégico)
> **Mediador**: Dr. Caio Henrique Fernandes Pádua
> **Data**: 17 de abril de 2026

**Leia o [MANIFESTO.md](./MANIFESTO.md) primeiro** — contém a mensagem de apresentação e o protocolo de colaboração.

---

## Visão Geral

Este bundle contém o **coração PADCOM V15** preparado para transplante no Integrative-Health-Engine. Segue 100% as especificações do HANDOFF seção 9.

| Entregável | Arquivos | Status |
|---|---|---|
| Schemas Drizzle PT-BR | 6 arquivos em `novos/lib/db/src/schema/` | Pronto |
| Rotas REST Express | 1 arquivo em `novos/artifacts/api-server/src/routes/` | Pronto |
| Páginas React | 5 arquivos em `novos/artifacts/clinica-motor/src/pages/padcom/` | Pronto |
| Seeds SQL | 3 arquivos em `seeds/` | Pronto |
| Diffs | 3 arquivos em `modificados/` | Pronto |
| Testes curl | 1 script em `tests/` | Pronto |

---

## Ordem de Aplicação (Passo a Passo)

### Passo 1 — Copiar schemas novos
```bash
cp novos/lib/db/src/schema/padcom*.ts /path/to/Integrative-Health-Engine/lib/db/src/schema/
```

### Passo 2 — Atualizar re-exports do schema
Seguir instruções em `modificados/lib-db-src-schema-index.ts.diff`

### Passo 3 — Verificar typecheck do DB
```bash
pnpm --filter @workspace/db typecheck
```

### Passo 4 — Gerar e aplicar migration
```bash
pnpm --filter @workspace/db drizzle-kit generate
# Revisar o SQL gerado, depois:
pnpm --filter @workspace/db drizzle-kit push
```

### Passo 5 — Rodar seeds
```bash
psql $DATABASE_URL < seeds/001-padcom-questionarios.sql
psql $DATABASE_URL < seeds/002-padcom-bandas.sql
psql $DATABASE_URL < seeds/003-padcom-alertas-regras.sql
```

### Passo 6 — Copiar rota REST
```bash
cp novos/artifacts/api-server/src/routes/padcom.ts /path/to/Integrative-Health-Engine/artifacts/api-server/src/routes/
```
Seguir instruções em `modificados/artifacts-api-server-src-routes-index.ts.diff`

### Passo 7 — Copiar páginas React
```bash
mkdir -p /path/to/Integrative-Health-Engine/artifacts/clinica-motor/src/pages/padcom/
cp novos/artifacts/clinica-motor/src/pages/padcom/*.tsx /path/to/Integrative-Health-Engine/artifacts/clinica-motor/src/pages/padcom/
```
Seguir instruções em `modificados/artifacts-clinica-motor-src-App.tsx.diff`

### Passo 8 — Verificar typecheck do frontend
```bash
pnpm --filter @workspace/clinica-motor typecheck
```

### Passo 9 — Reiniciar serviços e testar
```bash
# Reiniciar api-server
pnpm --filter @workspace/api-server run dev

# Rodar testes curl
bash tests/curl-tests.sh
```

### Passo 10 — Testar pela tela
Seguir checklist da seção 8 do HANDOFF.

---

## Compliance com as 12 Regras de Ouro

| # | Regra | Status |
|---|---|---|
| 1 | ADDITIVE-ONLY | Nenhum schema existente foi modificado |
| 2 | PK varchar UUID | Todos os IDs usam `varchar` + `gen_random_uuid()` |
| 3 | PT-BR | Todos os nomes em português (clinicaId, pacienteId, criadoEm, etc.) |
| 4 | Multi-tenant | `clinicaId` presente em TODAS as tabelas novas |
| 5 | Versões catalog | Nenhum package.json modificado |
| 6 | Rotas relativas | Sem prefixo `/api/` em nenhuma rota |
| 7 | Zod V3 | Import de `"zod"`, nunca `"zod/v4"` |
| 8 | Drizzle pgTable | Todos os schemas usam `pgTable` |
| 9 | Prefixo padcom_ | Todas as tabelas prefixadas com `padcom_` |
| 10 | Não tocou em assets | Nenhum arquivo em `attached_assets/`, `.local/`, `replit.md` |
| 11 | Sem segredos | Nenhum segredo commitado |
| 12 | Sem db:push --force | Nenhum comando destrutivo executado |

---

## Arquivos Incluídos

Ver [DIFF.md](./DIFF.md) para a lista completa de arquivos novos vs modificados.

---

## Riscos Conhecidos

Ver [RISCOS.md](./RISCOS.md) para a análise de riscos e mitigações.

---

## Melhorias Kaizen Propostas

Ver [KAIZEN.md](./KAIZEN.md) para as melhorias implementadas e propostas para avaliação.
