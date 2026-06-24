/**
 * PADCOM V15 — Seed das 34 perguntas semânticas
 * 5 módulos com códigos, blocos clínicos, pesos e microtextos
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// ─── MÓDULO 1: Dados + Clínico Básico (9 perguntas) ─────────
const modulo1 = [
  { code: "DADOS_NOME_001", question: "Qual é o seu nome completo?", fieldType: "text", category: "integrativa", block: "dados_pessoais", step: 1, weight: "0", clinicalGoal: "Identificação do paciente", commercialGoal: "Personalização do atendimento", helper: "Nome conforme documento oficial", technicalName: "Identificação civil" },
  { code: "DADOS_IDAD_002", question: "Qual a sua idade?", fieldType: "number", category: "integrativa", block: "dados_pessoais", step: 1, weight: "1", scaleMax: 120, clinicalGoal: "Estratificação etária", commercialGoal: "Segmentação por faixa etária", helper: "Idade em anos completos", technicalName: "Idade cronológica" },
  { code: "DADOS_SEXO_003", question: "Qual o seu sexo biológico?", fieldType: "select", category: "integrativa", block: "dados_pessoais", step: 1, weight: "1", options: JSON.stringify(["Masculino", "Feminino", "Intersexo"]), clinicalGoal: "Determinação de protocolos por sexo", commercialGoal: "Personalização hormonal", helper: "Sexo conforme nascimento", technicalName: "Sexo biológico" },
  { code: "CARD_DOEN_HASA_001", question: "Você tem diagnóstico de hipertensão arterial (pressão alta)?", fieldType: "checkbox", category: "integrativa", block: "cardiovascular", step: 1, weight: "3", clinicalGoal: "Rastreio de HAS para painel cardiometabólico", commercialGoal: "Indicação de protocolo cardiovascular", helper: "Pressão sistólica ≥140 ou diastólica ≥90 mmHg", technicalName: "Hipertensão Arterial Sistêmica (HAS)" },
  { code: "CARD_DOEN_INFA_002", question: "Já teve infarto do miocárdio?", fieldType: "checkbox", category: "integrativa", block: "cardiovascular", step: 1, weight: "5", clinicalGoal: "Flag de validação obrigatória — alto risco cardiovascular", commercialGoal: "Caso complexo — protocolo avançado", helper: "Infarto agudo do miocárdio (IAM) prévio", technicalName: "Infarto Agudo do Miocárdio" },
  { code: "CARD_DOEN_AVCI_003", question: "Já teve AVC (derrame)?", fieldType: "checkbox", category: "integrativa", block: "cardiovascular", step: 1, weight: "5", clinicalGoal: "Flag de validação obrigatória — risco neurológico", commercialGoal: "Caso complexo — protocolo avançado", helper: "Acidente Vascular Cerebral prévio", technicalName: "Acidente Vascular Cerebral (AVC)" },
  { code: "META_DOEN_DIAB_001", question: "Você tem diagnóstico de diabetes?", fieldType: "select", category: "integrativa", block: "metabolico", step: 1, weight: "3", options: JSON.stringify(["Não", "Diabetes Tipo 1", "Diabetes Tipo 2", "Pré-diabetes", "Diabetes Gestacional"]), clinicalGoal: "Rastreio metabólico — glicemia e insulina", commercialGoal: "Indicação de protocolo metabólico", helper: "Tipo de diabetes diagnosticado", technicalName: "Diabetes Mellitus" },
  { code: "META_DOEN_DISL_002", question: "Tem colesterol ou triglicerídeos elevados?", fieldType: "checkbox", category: "integrativa", block: "metabolico", step: 1, weight: "2", clinicalGoal: "Rastreio de dislipidemia", commercialGoal: "Indicação de painel lipídico", helper: "Colesterol total >200 ou triglicerídeos >150", technicalName: "Dislipidemia" },
  { code: "ENDO_DOEN_TIRO_001", question: "Tem algum problema de tireoide?", fieldType: "select", category: "integrativa", block: "endocrino", step: 1, weight: "2", options: JSON.stringify(["Não", "Hipotireoidismo", "Hipertireoidismo", "Hashimoto", "Nódulos", "Outro"]), clinicalGoal: "Rastreio endócrino — painel tireoidiano", commercialGoal: "Indicação de protocolo endócrino", helper: "Diagnóstico tireoidiano prévio", technicalName: "Disfunção Tireoidiana" },
];

// ─── MÓDULO 2: Sintomas Funcionais (6 perguntas) ─────────────
const modulo2 = [
  { code: "SINT_SONO_001", question: "Como você avalia a qualidade do seu sono? (0 = péssimo, 10 = excelente)", fieldType: "scale", category: "integrativa", block: "sono", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Avaliação de qualidade do sono", commercialGoal: "Indicação de protocolo de sono", helper: "Considere facilidade para dormir, manutenção e sensação ao acordar", technicalName: "Índice de Qualidade do Sono" },
  { code: "SINT_ENER_002", question: "Como está seu nível de energia ao longo do dia? (0 = sem energia, 10 = energia plena)", fieldType: "scale", category: "integrativa", block: "energia", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Avaliação de fadiga e disposição", commercialGoal: "Indicação de protocolo energético", helper: "Considere sua disposição geral para atividades diárias", technicalName: "Nível de Energia Percebido" },
  { code: "SINT_FOCO_003", question: "Como está sua capacidade de foco e concentração? (0 = muito ruim, 10 = excelente)", fieldType: "scale", category: "integrativa", block: "cognitivo", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Avaliação cognitiva funcional", commercialGoal: "Indicação de protocolo cognitivo", helper: "Considere trabalho, leitura e atividades que exigem atenção", technicalName: "Capacidade de Concentração" },
  { code: "SINT_LIBI_004", question: "Como está sua libido (desejo sexual)? (0 = ausente, 10 = muito alta)", fieldType: "scale", category: "integrativa", block: "hormonal", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Avaliação hormonal funcional", commercialGoal: "Indicação de protocolo hormonal", helper: "Considere frequência de desejo e satisfação", technicalName: "Índice de Libido" },
  { code: "SINT_HUMO_005", question: "Como está seu humor geral? (0 = muito deprimido, 10 = muito bem)", fieldType: "scale", category: "integrativa", block: "humor", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Rastreio de humor e saúde mental", commercialGoal: "Indicação de protocolo de humor", helper: "Considere irritabilidade, tristeza, ansiedade", technicalName: "Índice de Humor" },
  { code: "SINT_DIGE_006", question: "Como está seu funcionamento intestinal? (0 = muito ruim, 10 = excelente)", fieldType: "scale", category: "integrativa", block: "digestivo", step: 2, weight: "2", scaleMax: 10, clinicalGoal: "Avaliação digestiva funcional", commercialGoal: "Indicação de protocolo digestivo", helper: "Considere regularidade, desconforto, inchaço", technicalName: "Função Intestinal" },
];

// ─── MÓDULO 3: Cirurgias, Medicamentos, Atividade (9 perguntas) ─
const modulo3 = [
  { code: "CIRU_HIST_001", question: "Já realizou alguma cirurgia? Quais?", fieldType: "textarea", category: "integrativa", block: "cirurgico", step: 3, weight: "1", clinicalGoal: "Histórico cirúrgico para avaliação de risco", commercialGoal: "Complexidade do caso", helper: "Liste todas as cirurgias realizadas com ano aproximado", technicalName: "Histórico Cirúrgico" },
  { code: "MEDI_CONT_001", question: "Usa algum medicamento de uso contínuo?", fieldType: "checkbox", category: "integrativa", block: "medicamentos", step: 3, weight: "2", clinicalGoal: "Flag de interações medicamentosas", commercialGoal: "Complexidade farmacológica", helper: "Medicamentos tomados diariamente", technicalName: "Medicação de Uso Contínuo" },
  { code: "MEDI_LIST_002", question: "Liste seus medicamentos atuais (nome, dose, horário)", fieldType: "textarea", category: "integrativa", block: "medicamentos", step: 3, weight: "1", clinicalGoal: "Mapeamento farmacológico completo", commercialGoal: "Base para prescrição personalizada", helper: "Ex: Losartana 50mg manhã, Metformina 850mg almoço/jantar", technicalName: "Lista de Medicamentos" },
  { code: "MEDI_SUPL_003", question: "Usa algum suplemento ou fitoterápico?", fieldType: "textarea", category: "integrativa", block: "medicamentos", step: 3, weight: "1", clinicalGoal: "Mapeamento de suplementação atual", commercialGoal: "Oportunidade de otimização", helper: "Ex: Vitamina D 2000UI, Ômega 3, Ashwagandha", technicalName: "Suplementação Atual" },
  { code: "ALER_HIST_001", question: "Tem alguma alergia conhecida?", fieldType: "textarea", category: "integrativa", block: "alergias", step: 3, weight: "2", clinicalGoal: "Segurança na prescrição", commercialGoal: "Personalização segura", helper: "Medicamentos, alimentos, substâncias", technicalName: "Histórico de Alergias" },
  { code: "ATIV_FREQ_001", question: "Pratica atividade física regularmente?", fieldType: "select", category: "integrativa", block: "atividade_fisica", step: 3, weight: "2", options: JSON.stringify(["Não pratico", "1-2x por semana", "3-4x por semana", "5+ vezes por semana", "Diariamente"]), clinicalGoal: "Avaliação de nível de atividade", commercialGoal: "Indicação de protocolo de performance", helper: "Considere exercícios planejados, não atividades do dia a dia", technicalName: "Frequência de Atividade Física" },
  { code: "ATIV_TIPO_002", question: "Que tipo de atividade física pratica?", fieldType: "multiselect", category: "integrativa", block: "atividade_fisica", step: 3, weight: "1", options: JSON.stringify(["Musculação", "Corrida", "Caminhada", "Natação", "Yoga/Pilates", "Funcional", "Artes marciais", "Ciclismo", "Outro"]), clinicalGoal: "Perfil de atividade para prescrição", commercialGoal: "Personalização de protocolo", helper: "Selecione todas que se aplicam", technicalName: "Modalidades de Exercício" },
  { code: "TABA_HIST_001", question: "É fumante ou ex-fumante?", fieldType: "select", category: "integrativa", block: "habitos", step: 3, weight: "2", options: JSON.stringify(["Nunca fumei", "Ex-fumante (parei há mais de 1 ano)", "Ex-fumante (parei há menos de 1 ano)", "Fumante ocasional", "Fumante diário"]), clinicalGoal: "Rastreio de risco pulmonar e cardiovascular", commercialGoal: "Complexidade do caso", helper: "Considere cigarros, charutos, narguilé, vape", technicalName: "Tabagismo" },
  { code: "ALCO_HIST_001", question: "Consome bebidas alcoólicas?", fieldType: "select", category: "integrativa", block: "habitos", step: 3, weight: "1", options: JSON.stringify(["Não consumo", "Socialmente (1-2x mês)", "Moderado (1-2x semana)", "Frequente (3+ vezes semana)", "Diariamente"]), clinicalGoal: "Rastreio de hepatotoxicidade", commercialGoal: "Indicação de painel hepático", helper: "Considere frequência e quantidade", technicalName: "Consumo de Álcool" },
];

// ─── MÓDULO 4: Preferências Terapêuticas (7 perguntas) ───────
const modulo4 = [
  { code: "PREF_OBJE_001", question: "Qual seu principal objetivo com o tratamento?", fieldType: "multiselect", category: "integrativa", block: "preferencias", step: 4, weight: "1", options: JSON.stringify(["Emagrecimento", "Ganho de massa muscular", "Melhora do sono", "Mais energia", "Equilíbrio hormonal", "Saúde cardiovascular", "Longevidade", "Performance esportiva", "Saúde mental", "Outro"]), clinicalGoal: "Alinhamento de expectativas clínicas", commercialGoal: "Direcionamento de protocolo e upsell", helper: "Selecione até 3 objetivos principais", technicalName: "Objetivos Terapêuticos" },
  { code: "PREF_EXPE_002", question: "Já fez algum tratamento de medicina integrativa antes?", fieldType: "select", category: "integrativa", block: "preferencias", step: 4, weight: "1", options: JSON.stringify(["Nunca", "Sim, uma vez", "Sim, algumas vezes", "Sim, faço acompanhamento regular"]), clinicalGoal: "Nível de familiaridade com abordagem integrativa", commercialGoal: "Maturidade do lead", helper: "Considere tratamentos com foco em saúde integrativa", technicalName: "Experiência Prévia" },
  { code: "PREF_HORI_003", question: "Qual horizonte de tempo você imagina para o tratamento?", fieldType: "select", category: "integrativa", block: "preferencias", step: 4, weight: "1", options: JSON.stringify(["Consulta pontual", "3 meses", "6 meses", "1 ano", "Acompanhamento contínuo"]), clinicalGoal: "Planejamento de follow-up", commercialGoal: "Previsão de LTV e recorrência", helper: "Quanto tempo pretende se dedicar ao tratamento", technicalName: "Horizonte Terapêutico" },
  { code: "PREF_MODA_004", question: "Prefere consulta presencial ou online?", fieldType: "select", category: "integrativa", block: "preferencias", step: 4, weight: "0", options: JSON.stringify(["Presencial", "Online", "Ambos"]), clinicalGoal: "Logística de atendimento", commercialGoal: "Capacidade de atendimento", helper: "Considere sua disponibilidade e localização", technicalName: "Modalidade de Atendimento" },
  { code: "PREF_VIAS_005", question: "Tem preferência por alguma via de administração?", fieldType: "multiselect", category: "integrativa", block: "preferencias", step: 4, weight: "0", options: JSON.stringify(["Oral (cápsulas/comprimidos)", "Sublingual", "Transdérmico (cremes/géis)", "Injetável", "Sem preferência"]), clinicalGoal: "Personalização da via de administração", commercialGoal: "Direcionamento de fórmulas", helper: "Algumas substâncias funcionam melhor por vias específicas", technicalName: "Preferência de Via" },
  { code: "PREF_REST_006", question: "Tem alguma restrição alimentar?", fieldType: "multiselect", category: "integrativa", block: "preferencias", step: 4, weight: "1", options: JSON.stringify(["Nenhuma", "Vegetariano", "Vegano", "Intolerância à lactose", "Intolerância ao glúten", "Alergia alimentar", "Low carb", "Outro"]), clinicalGoal: "Adequação de suplementação e fórmulas", commercialGoal: "Personalização nutricional", helper: "Selecione todas que se aplicam", technicalName: "Restrições Alimentares" },
  { code: "PREF_EXAM_007", question: "Possui exames recentes (últimos 6 meses)?", fieldType: "select", category: "integrativa", block: "preferencias", step: 4, weight: "1", options: JSON.stringify(["Não tenho exames recentes", "Sim, tenho hemograma", "Sim, tenho painel completo", "Sim, posso enviar"]), clinicalGoal: "Disponibilidade de dados laboratoriais", commercialGoal: "Redução de custo inicial para o paciente", helper: "Exames de sangue, imagem ou outros", technicalName: "Exames Disponíveis" },
];

// ─── MÓDULO 5: Financeiro (3 perguntas) ──────────────────────
const modulo5 = [
  { code: "FINA_INVE_001", question: "Qual faixa de investimento mensal você considera para seu tratamento?", fieldType: "select", category: "integrativa", block: "financeiro", step: 5, weight: "0", options: JSON.stringify(["Até R$ 500", "R$ 500 a R$ 1.000", "R$ 1.000 a R$ 2.000", "R$ 2.000 a R$ 5.000", "Acima de R$ 5.000"]), clinicalGoal: "Adequação de protocolo ao orçamento", commercialGoal: "Segmentação por ticket — Básico/Intermediário/Avançado/Full", helper: "Considere consultas, exames e fórmulas mensais", technicalName: "Faixa de Investimento" },
  { code: "FINA_PLAN_002", question: "Possui plano de saúde?", fieldType: "select", category: "integrativa", block: "financeiro", step: 5, weight: "0", options: JSON.stringify(["Não", "Sim, básico", "Sim, intermediário", "Sim, completo"]), clinicalGoal: "Cobertura de exames pelo plano", commercialGoal: "Redução de barreira financeira", helper: "Alguns exames podem ser cobertos pelo plano", technicalName: "Plano de Saúde" },
  { code: "FINA_COMO_003", question: "Como ficou sabendo do nosso atendimento?", fieldType: "select", category: "integrativa", block: "financeiro", step: 5, weight: "0", options: JSON.stringify(["Instagram", "Google", "Indicação de amigo/familiar", "Indicação médica", "YouTube", "TikTok", "Outro"]), clinicalGoal: "Não aplicável", commercialGoal: "Rastreio de canal de aquisição", helper: "Nos ajuda a melhorar nosso atendimento", technicalName: "Canal de Aquisição" },
];

const allQuestions = [...modulo1, ...modulo2, ...modulo3, ...modulo4, ...modulo5];

console.log(`Inserindo ${allQuestions.length} perguntas semânticas V15...`);

let inserted = 0;
for (const q of allQuestions) {
  try {
    await conn.execute(
      `INSERT INTO anamnesis_questions 
       (questionText, fieldType, category, isRequired, sortOrder, section, code, block, step, clinicalGoal, commercialGoal, helper, technicalName, weight, scaleMax, options)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       questionText=VALUES(questionText), block=VALUES(block), step=VALUES(step), 
       clinicalGoal=VALUES(clinicalGoal), commercialGoal=VALUES(commercialGoal),
       helper=VALUES(helper), technicalName=VALUES(technicalName), weight=VALUES(weight)`,
      [
        q.question, q.fieldType, q.category, inserted + 1,
        q.block, q.code, q.block, q.step,
        q.clinicalGoal, q.commercialGoal, q.helper, q.technicalName,
        q.weight, q.scaleMax ?? null, q.options ?? null,
      ]
    );
    inserted++;
    console.log(`  ✓ ${q.code}: ${q.question.slice(0, 50)}...`);
  } catch (err) {
    console.error(`  ✗ ${q.code}: ${err.message}`);
  }
}

console.log(`\n${inserted}/${allQuestions.length} perguntas inseridas com sucesso.`);

// ─── SEED SCORING WEIGHTS ────────────────────────────────────
console.log("\nInserindo pesos de scoring...");
const scoringWeights = [
  { questionCode: "CARD_DOEN_HASA_001", axis: "cardiovascular", weight: 3, maxRawPoints: 10 },
  { questionCode: "CARD_DOEN_INFA_002", axis: "cardiovascular", weight: 5, maxRawPoints: 10 },
  { questionCode: "CARD_DOEN_AVCI_003", axis: "cardiovascular", weight: 5, maxRawPoints: 10 },
  { questionCode: "META_DOEN_DIAB_001", axis: "metabolico", weight: 3, maxRawPoints: 10 },
  { questionCode: "META_DOEN_DISL_002", axis: "metabolico", weight: 2, maxRawPoints: 10 },
  { questionCode: "ENDO_DOEN_TIRO_001", axis: "endocrino", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_SONO_001", axis: "sono", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_ENER_002", axis: "energia", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_FOCO_003", axis: "cognitivo", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_LIBI_004", axis: "hormonal", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_HUMO_005", axis: "humor", weight: 2, maxRawPoints: 10 },
  { questionCode: "SINT_DIGE_006", axis: "digestivo", weight: 2, maxRawPoints: 10 },
  { questionCode: "MEDI_CONT_001", axis: "medicamentos", weight: 2, maxRawPoints: 10 },
  { questionCode: "ATIV_FREQ_001", axis: "atividade_fisica", weight: 2, maxRawPoints: 10 },
  { questionCode: "TABA_HIST_001", axis: "habitos", weight: 2, maxRawPoints: 10 },
  { questionCode: "ALCO_HIST_001", axis: "habitos", weight: 1, maxRawPoints: 10 },
];

let swInserted = 0;
for (const sw of scoringWeights) {
  try {
    await conn.execute(
      `INSERT INTO scoring_weights (questionCode, axis, weight, maxRawPoints) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE axis=VALUES(axis), weight=VALUES(weight), maxRawPoints=VALUES(maxRawPoints)`,
      [sw.questionCode, sw.axis, sw.weight, sw.maxRawPoints]
    );
    swInserted++;
  } catch (err) {
    console.error(`  ✗ ${sw.questionCode}: ${err.message}`);
  }
}
console.log(`${swInserted}/${scoringWeights.length} pesos inseridos.`);

// ─── SEED MOTOR ACTIONS ──────────────────────────────────────
console.log("\nInserindo ações do motor...");
const motorActions = [
  { triggerCode: "CARD_DOEN_HASA", condition: "resposta = sim", actionType: "exame", actionValue: "Solicitar painel cardiometabólico completo", priority: 8 },
  { triggerCode: "CARD_DOEN_INFA", condition: "resposta = sim", actionType: "encaminhamento", actionValue: "Encaminhar para avaliação cardiológica urgente", priority: 10 },
  { triggerCode: "CARD_DOEN_AVCI", condition: "resposta = sim", actionType: "encaminhamento", actionValue: "Encaminhar para avaliação neurológica", priority: 10 },
  { triggerCode: "META_DOEN_DIAB", condition: "resposta != Não", actionType: "exame", actionValue: "Solicitar glicemia jejum, HbA1c, insulina basal", priority: 8 },
  { triggerCode: "META_DOEN_DISL", condition: "resposta = sim", actionType: "exame", actionValue: "Solicitar perfil lipídico completo", priority: 6 },
  { triggerCode: "ENDO_DOEN_TIRO", condition: "resposta != Não", actionType: "exame", actionValue: "Solicitar TSH, T4L, T3L, anti-TPO", priority: 7 },
  { triggerCode: "SINT_SONO", condition: "score < 5", actionType: "formula", actionValue: "Considerar protocolo de sono (melatonina, magnésio, L-teanina)", priority: 5 },
  { triggerCode: "SINT_ENER", condition: "score < 5", actionType: "formula", actionValue: "Considerar protocolo energético (CoQ10, B12, ferro)", priority: 5 },
  { triggerCode: "SINT_LIBI", condition: "score < 5", actionType: "exame", actionValue: "Solicitar painel hormonal (testosterona, DHEA, estradiol)", priority: 6 },
  { triggerCode: "MEDI_CONT", condition: "resposta = sim", actionType: "alerta", actionValue: "Verificar interações medicamentosas antes de prescrever", priority: 9 },
];

let maInserted = 0;
for (const ma of motorActions) {
  try {
    await conn.execute(
      `INSERT INTO motor_actions (triggerCode, triggerCondition, actionType, actionValue, priority) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE triggerCondition=VALUES(triggerCondition), actionValue=VALUES(actionValue)`,
      [ma.triggerCode, ma.condition, ma.actionType, ma.actionValue, ma.priority]
    );
    maInserted++;
  } catch (err) {
    console.error(`  ✗ ${ma.triggerCode}: ${err.message}`);
  }
}
console.log(`${maInserted}/${motorActions.length} ações inseridas.`);

await conn.end();
console.log("\n✅ Seed V15 completo!");
