-- ============================================================
-- SEED: padcom_questionarios — 34 perguntas em 5 módulos
-- PADCOM V15 — Anamnese Integrativa Estruturada
-- Idempotente: usa ON CONFLICT DO NOTHING
-- ============================================================

-- MÓDULO 1 — HÁBITOS DE VIDA E ALIMENTAÇÃO (7 perguntas)
INSERT INTO padcom_questionarios (id, modulo, ordem, pergunta, tipo_resposta, peso, versao, ativo)
VALUES
  (gen_random_uuid(), 1, 1, 'Com que frequência você consome alimentos ultraprocessados (embutidos, salgadinhos, refrigerantes)?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 1, 2, 'Quantos litros de água você consome por dia?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 1, 3, 'Você pratica atividade física regularmente (mínimo 3x/semana, 30min)?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 1, 4, 'Você consome frutas, verduras e legumes diariamente?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 1, 5, 'Você faz uso de bebida alcoólica? Com que frequência?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 1, 6, 'Você é fumante ou ex-fumante?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 1, 7, 'Quantas refeições você faz por dia (incluindo lanches)?', 'escala_1_5', 2, 1, true)
ON CONFLICT DO NOTHING;

-- MÓDULO 2 — SINTOMAS GERAIS E QUEIXAS PRINCIPAIS (7 perguntas)
INSERT INTO padcom_questionarios (id, modulo, ordem, pergunta, tipo_resposta, peso, versao, ativo)
VALUES
  (gen_random_uuid(), 2, 8, 'Você sente fadiga ou cansaço excessivo durante o dia?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 2, 9, 'Você tem dores de cabeça frequentes (mais de 2x/semana)?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 2, 10, 'Você sente dores musculares ou articulares sem causa aparente?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 2, 11, 'Você tem queda de cabelo, unhas fracas ou pele ressecada?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 2, 12, 'Você apresenta inchaço nas pernas, mãos ou rosto?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 2, 13, 'Você tem infecções recorrentes (gripes, sinusites, cistites)?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 2, 14, 'Você sente formigamento ou dormência em extremidades?', 'escala_1_5', 3, 1, true)
ON CONFLICT DO NOTHING;

-- MÓDULO 3 — SAÚDE DIGESTIVA E INTESTINAL (7 perguntas)
INSERT INTO padcom_questionarios (id, modulo, ordem, pergunta, tipo_resposta, peso, versao, ativo)
VALUES
  (gen_random_uuid(), 3, 15, 'Você tem constipação (intestino preso) frequente?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 3, 16, 'Você apresenta distensão abdominal (barriga inchada) após refeições?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 3, 17, 'Você tem refluxo gastroesofágico ou azia frequente?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 3, 18, 'Você sente gases excessivos?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 3, 19, 'Você já foi diagnosticado com intolerância alimentar (lactose, glúten, etc.)?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 3, 20, 'Você faz uso de antiácidos, laxantes ou probióticos?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 3, 21, 'Você tem episódios de diarreia frequente?', 'escala_1_5', 3, 1, true)
ON CONFLICT DO NOTHING;

-- MÓDULO 4 — SAÚDE MENTAL, SONO E ESTRESSE (7 perguntas)
INSERT INTO padcom_questionarios (id, modulo, ordem, pergunta, tipo_resposta, peso, versao, ativo)
VALUES
  (gen_random_uuid(), 4, 22, 'Você tem dificuldade para dormir ou acorda durante a noite?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 4, 23, 'Quantas horas de sono você dorme por noite em média?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 4, 24, 'Você se sente ansioso(a) com frequência?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 4, 25, 'Você tem episódios de tristeza profunda ou desânimo persistente?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 4, 26, 'Você tem dificuldade de concentração ou memória?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 4, 27, 'Você faz uso de medicamentos para ansiedade, depressão ou insônia?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 4, 28, 'Você pratica alguma atividade de relaxamento (meditação, yoga, respiração)?', 'escala_1_5', 2, 1, true)
ON CONFLICT DO NOTHING;

-- MÓDULO 5 — HISTÓRICO CLÍNICO E FAMILIAR (6 perguntas)
INSERT INTO padcom_questionarios (id, modulo, ordem, pergunta, tipo_resposta, peso, versao, ativo)
VALUES
  (gen_random_uuid(), 5, 29, 'Você tem diagnóstico de doença crônica (diabetes, hipertensão, tireoide, etc.)?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 5, 30, 'Você faz uso contínuo de algum medicamento? Quais?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 5, 31, 'Há histórico familiar de câncer, diabetes, doenças cardíacas ou autoimunes?', 'escala_1_5', 4, 1, true),
  (gen_random_uuid(), 5, 32, 'Você já fez cirurgias? Quais e quando?', 'escala_1_5', 2, 1, true),
  (gen_random_uuid(), 5, 33, 'Você tem alergias conhecidas (medicamentos, alimentos, substâncias)?', 'escala_1_5', 3, 1, true),
  (gen_random_uuid(), 5, 34, 'Você faz acompanhamento médico regular (check-up anual)?', 'escala_1_5', 2, 1, true)
ON CONFLICT DO NOTHING;

-- Verificação
-- SELECT modulo, count(*) FROM padcom_questionarios GROUP BY modulo ORDER BY modulo;
-- Esperado: M1=7, M2=7, M3=7, M4=7, M5=6 = 34 total
