# KAIZEN — Melhorias Contínuas

> PADCOM V15 — Manus Bundle
> Filosofia: 改善 (Kaizen) — melhoria contínua, passo a passo, com humildade
> Data: 17/04/2026

---

## Melhorias JÁ Implementadas neste Bundle

Estas melhorias foram sugeridas na seção 11 do HANDOFF e implementadas com respeito ao escopo original.

| # | Melhoria | Origem | Implementação |
|---|---|---|---|
| K1 | Versionar questionário | HANDOFF Kaizen #1 | Campo `versao` (integer, default 1) em `padcom_questionarios`. Permite evoluir perguntas sem perder histórico |
| K2 | Snapshot imutável da sessão | HANDOFF Kaizen #2 | Campo `respostasSnapshot` (JSONB) em `padcom_sessoes`. Ao finalizar, grava cópia das respostas + perguntas da época. Resposta de hoje não muda se pergunta mudar amanhã |
| K3 | Score server-side | HANDOFF Kaizen #3 | Rota `/padcom-sessoes/:id/finalizar` calcula score no servidor (soma ponderada de respostas × peso da pergunta). Não depende do frontend |
| K4 | Telemetria de abandono | HANDOFF Kaizen #7 | Campo `ultimoModuloVisitado` em `padcom_sessoes`. Dashboard mostra gráfico de abandono por módulo. Identifica onde pacientes desistem |
| K5 | Anonimização LGPD | HANDOFF Kaizen #10 | Campo `dadosAnonimizados` (boolean) em `padcom_auditoria`. Permite marcar registros como anonimizados para compliance |
| K6 | Dashboard analítico completo | Entregável 3 | Recharts com 4 visualizações: distribuição por banda (pizza), funil de conversão (barras), telemetria de abandono (barras), score médio por banda (progress bars) |

---

## Melhorias PROPOSTAS para Avaliação do Dr. Replit

Estas melhorias foram identificadas durante a análise do código matriz e do modelo de negócio. **Não foram implementadas** — aguardam aprovação.

### Prioridade Alta (impacto direto em vendas)

| # | Melhoria | Descrição | Esforço | Benefício |
|---|---|---|---|---|
| P1 | **Score Competência Reguladora** | Classificar cada item terapêutico por quem pode prescrever (médico, enfermeiro, farmacêutico). Determina automaticamente se prescrição precisa de CRM ou pode ser auto-dispensada. Impacto direto: CoQ10 oral pode ser prescrita por farmacêutico → automação N1 → centenas de receitas/dia sem gargalo médico | Médio | Muito Alto |
| P2 | **Cascata de Validação N1/N2/N3** | N1 (auto): score baixo + item simples → IA valida → despacha farmácia. N2 (semi): score médio → 1 clique do consultor. N3 (manual): score alto → cascata completa enfermeira→médico→preceptor. Toggle configurável por clínica | Alto | Muito Alto |
| P3 | **6 Braços de Entrada Rastreáveis** | E1: Tráfego pago (UTM). E2: Consultora interna. E3: Site autoatendimento. E4: Vendedor externo (link personalizado). E5: Referral de paciente. E6: WhatsApp Bot. Cada braço rastreável no dashboard de governança com métricas de conversão | Alto | Alto |
| P4 | **Dispatcher Automático Farmácia** | Motor que pega prescrição validada N1 → monta pedido → despacha para farmácia parceira automaticamente. Roteamento inteligente por proximidade/capacidade/preço. Status: pendente→enviado→aceito→manipulação→pronto→entregue. Comissão automática | Alto | Muito Alto |

### Prioridade Média (qualidade e governança)

| # | Melhoria | Descrição | Esforço | Benefício |
|---|---|---|---|---|
| P5 | **Dashboard de Governança Global** | Visão consolidada de TODAS as entradas por canal com contadores em tempo real. Filtros por canal/período/status/clínica. Métricas de conversão. Ranking de canais por ROI. Visão de auditor independente | Alto | Alto |
| P6 | **Certificado Digital na Cascata** | Cada etapa da validação registra certificado digital do profissional. Enfermeira fez anamnese → selo dela. Médico validou → selo CRM dele. Preceptor aprovou → selo final. Rastreabilidade completa para LGPD e CRM | Médio | Alto |
| P7 | **Webhook para Automação** | Endpoints de webhook para ManyChat, Typebot, Botpress, n8n. Recebe lead de chatbot → cria sessão PADCOM → retorna link de anamnese. Permite escalar captação via tráfego pago sem intervenção humana | Baixo | Alto |
| P8 | **Export PDF da Sessão** | Gerar PDF com todas as respostas, score, banda, ações do motor. Anexar ao prontuário eletrônico. Usar lib PDF já existente no mockup-sandbox | Médio | Médio |

### Prioridade Baixa (futuro)

| # | Melhoria | Descrição | Esforço | Benefício |
|---|---|---|---|---|
| P9 | **i18n preparado** | Mesmo que só PT-BR por ora, preparar estrutura de tradução para expansão LATAM | Baixo | Baixo |
| P10 | **Rate limit nas rotas POST** | Prevenção de spam nas rotas públicas (paciente) | Baixo | Médio |
| P11 | **OpenTelemetry tracing** | Observabilidade do motor de scoring para debugging em produção | Médio | Baixo |
| P12 | **View materializada para dashboard** | Pré-calcular agregações do dashboard em SQL para performance em escala (1000+ sessões) | Médio | Médio |
| P13 | **Modo offline PWA** | Paciente pode responder anamnese offline (Service Worker + IndexedDB) e sincronizar quando voltar online | Alto | Médio |

---

## Nota do Manus

Dr. Replit, todas as melhorias P1-P13 já estão **conceitualizadas e documentadas** no workspace paralelo (padcom-saas). Os schemas, routers e páginas existem como protótipos funcionais. Se você aprovar qualquer uma delas, posso adaptar ao formato pgTable/REST/React do Integrative-Health-Engine e entregar no mesmo formato deste bundle.

Estou à disposição para qualquer ajuste. A decisão é sua e do Dr. Caio.

---

*"Kaizen não é sobre grandes revoluções. É sobre pequenas melhorias diárias que, somadas, transformam o sistema."*
