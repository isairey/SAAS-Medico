-- ============================================================
-- SEED: padcom_bandas — 4 bandas de conduta clínica
-- Cada banda define: faixa de score, cor, conduta e ações do motor
-- Idempotente: usa ON CONFLICT DO NOTHING
-- ============================================================

INSERT INTO padcom_bandas (id, nome, cor, score_min, score_max, descricao, acoes_motor, ordem, ativo)
VALUES
  (
    gen_random_uuid(),
    'Verde — Manutenção',
    'verde',
    0, 25,
    'Paciente com baixo risco. Perfil de manutenção e prevenção. Conduta conservadora com suplementação oral básica e orientações de estilo de vida.',
    '{"exames": ["hemograma_completo", "vitamina_d", "b12", "ferritina", "tsh"], "formula_sempre": ["coq10_100mg_oral", "vitamina_d3_10000ui", "omega3_1g", "magnesio_quelado_200mg"], "injetaveis": [], "implantes": [], "orientacoes": ["manter_atividade_fisica", "dieta_anti_inflamatoria", "sono_7h_minimo"], "retorno_dias": 90, "prioridade": "baixa", "validacao_nivel": "N1"}'::jsonb,
    1, true
  ),
  (
    gen_random_uuid(),
    'Amarela — Atenção',
    'amarela',
    26, 50,
    'Paciente com risco moderado. Sinais de desequilíbrio funcional. Conduta com suplementação oral reforçada + considerar intramuscular.',
    '{"exames": ["hemograma_completo", "vitamina_d", "b12", "ferritina", "tsh", "pcr_ultrassensivel", "homocisteina", "insulina_basal", "cortisol_salivar"], "formula_sempre": ["coq10_200mg_oral", "vitamina_d3_10000ui", "omega3_2g", "magnesio_quelado_400mg", "zinco_quelado_30mg", "complexo_b_metilado"], "injetaveis": ["vitamina_b12_im_semanal"], "implantes": [], "orientacoes": ["dieta_anti_inflamatoria_rigorosa", "atividade_fisica_4x_semana", "sono_higiene", "reducao_alcool"], "retorno_dias": 60, "prioridade": "media", "validacao_nivel": "N2"}'::jsonb,
    2, true
  ),
  (
    gen_random_uuid(),
    'Laranja — Intervenção',
    'laranja',
    51, 75,
    'Paciente com risco elevado. Múltiplos sintomas e desequilíbrios. Conduta agressiva com suplementação oral + IM/EV obrigatório.',
    '{"exames": ["painel_completo_integrativo", "cortisol_curva", "dhea_sulfato", "testosterona_total_livre", "estradiol", "progesterona", "igf1", "vitamina_d", "b12", "ferritina", "zinco_serico", "selenio", "cobre_serico", "pcr_us", "homocisteina", "insulina_basal", "hba1c"], "formula_sempre": ["coq10_300mg_oral", "vitamina_d3_10000ui", "omega3_3g", "magnesio_quelado_600mg", "zinco_quelado_50mg", "complexo_b_metilado_forte", "glutationa_500mg_oral", "curcumina_1g", "resveratrol_500mg"], "injetaveis": ["vitamina_c_ev_15g_semanal", "glutationa_ev_600mg_semanal", "vitamina_b12_im_semanal", "complexo_b_im_semanal"], "implantes": [], "orientacoes": ["dieta_eliminacao_30dias", "jejum_intermitente_supervisionado", "atividade_fisica_personalizada", "terapia_sono", "manejo_estresse_obrigatorio"], "retorno_dias": 15, "prioridade": "alta", "validacao_nivel": "N3"}'::jsonb,
    3, true
  ),
  (
    gen_random_uuid(),
    'Vermelha — Urgência',
    'vermelha',
    76, 100,
    'Paciente com risco crítico. Quadro complexo com múltiplas comorbidades. Conduta de urgência com protocolo completo IM/EV + implantes quando indicado.',
    '{"exames": ["painel_completo_integrativo", "painel_hormonal_completo", "painel_autoimune", "cortisol_curva", "dhea_sulfato", "melatonina_salivar", "microbioma_intestinal", "permeabilidade_intestinal", "metais_pesados_urina_24h", "estresse_oxidativo", "telomeros"], "formula_sempre": ["coq10_400mg_oral", "vitamina_d3_10000ui", "omega3_4g", "magnesio_quelado_800mg", "zinco_quelado_50mg", "complexo_b_metilado_forte", "glutationa_1g_oral", "curcumina_2g", "resveratrol_1g", "nad_plus_250mg", "pqq_20mg", "astaxantina_12mg"], "injetaveis": ["vitamina_c_ev_25g_2x_semana", "glutationa_ev_1200mg_2x_semana", "nad_ev_250mg_semanal", "vitamina_b12_im_2x_semana", "complexo_b_im_2x_semana", "ferro_ev_se_indicado"], "implantes": ["gestrinona_implante_se_indicado", "testosterona_implante_se_indicado"], "orientacoes": ["protocolo_detox_supervisionado", "dieta_eliminacao_60dias", "atividade_fisica_com_personal", "psicoterapia_obrigatoria", "sono_monitorado", "reducao_exposicao_toxica"], "retorno_dias": 7, "prioridade": "critica", "validacao_nivel": "N3"}'::jsonb,
    4, true
  )
ON CONFLICT DO NOTHING;

-- Verificação
-- SELECT nome, cor, score_min, score_max, ordem FROM padcom_bandas ORDER BY ordem;
-- Esperado: 4 bandas (verde 0-25, amarela 26-50, laranja 51-75, vermelha 76-100)
