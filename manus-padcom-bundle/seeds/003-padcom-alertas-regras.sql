-- ============================================================
-- SEED: padcom_alertas_regras — Regras default de alerta automático
-- Disparadas automaticamente ao finalizar sessão baseado no score/banda
-- Idempotente: usa ON CONFLICT DO NOTHING
-- ============================================================

INSERT INTO padcom_alertas_regras (id, nome, condicao, severidade, mensagem_template, ativo)
VALUES
  (
    gen_random_uuid(),
    'Score crítico (banda vermelha)',
    '{"campo": "score_final", "operador": ">=", "valor": 76}'::jsonb,
    'critica',
    'URGENTE: Paciente {{paciente_nome}} atingiu score {{score_final}} (banda vermelha). Requer avaliação médica imediata e protocolo de urgência.',
    true
  ),
  (
    gen_random_uuid(),
    'Score elevado (banda laranja)',
    '{"campo": "score_final", "operador": ">=", "valor": 51}'::jsonb,
    'alta',
    'ATENÇÃO: Paciente {{paciente_nome}} atingiu score {{score_final}} (banda laranja). Agendar consulta de intervenção em até 15 dias.',
    true
  ),
  (
    gen_random_uuid(),
    'Módulo mental/sono crítico',
    '{"campo": "score_modulo_4", "operador": ">=", "valor": 70}'::jsonb,
    'alta',
    'SAÚDE MENTAL: Paciente {{paciente_nome}} apresentou score {{score_modulo_4}} no módulo Mental/Sono. Avaliar necessidade de encaminhamento psiquiátrico.',
    true
  ),
  (
    gen_random_uuid(),
    'Módulo digestivo crítico',
    '{"campo": "score_modulo_3", "operador": ">=", "valor": 70}'::jsonb,
    'media',
    'DIGESTIVO: Paciente {{paciente_nome}} apresentou score {{score_modulo_3}} no módulo Saúde Digestiva. Considerar painel de permeabilidade intestinal e microbioma.',
    true
  ),
  (
    gen_random_uuid(),
    'Abandono no módulo 1',
    '{"campo": "status", "operador": "==", "valor": "em_andamento", "campo_extra": "ultimo_modulo_visitado", "operador_extra": "==", "valor_extra": 1}'::jsonb,
    'baixa',
    'ABANDONO: Paciente {{paciente_nome}} abandonou a anamnese no módulo 1 (Hábitos). Considerar follow-up por WhatsApp ou consultora.',
    true
  ),
  (
    gen_random_uuid(),
    'Sessão sem validação há 48h',
    '{"campo": "status", "operador": "==", "valor": "finalizada", "campo_extra": "horas_sem_validacao", "operador_extra": ">=", "valor_extra": 48}'::jsonb,
    'media',
    'PENDENTE: Sessão do paciente {{paciente_nome}} finalizada há mais de 48h sem validação médica. Verificar fila de preceptor.',
    true
  ),
  (
    gen_random_uuid(),
    'Polifarmácia detectada',
    '{"campo": "resposta_modulo_5_q30", "operador": ">=", "valor": 4}'::jsonb,
    'alta',
    'POLIFARMÁCIA: Paciente {{paciente_nome}} reportou uso contínuo de múltiplos medicamentos (score {{resposta_modulo_5_q30}}). Avaliar interações medicamentosas antes de prescrever.',
    true
  ),
  (
    gen_random_uuid(),
    'Histórico familiar de risco',
    '{"campo": "resposta_modulo_5_q31", "operador": ">=", "valor": 4}'::jsonb,
    'media',
    'HISTÓRICO FAMILIAR: Paciente {{paciente_nome}} reportou histórico familiar significativo de doenças crônicas. Considerar painel genético e rastreio precoce.',
    true
  )
ON CONFLICT DO NOTHING;

-- Verificação
-- SELECT nome, severidade, ativo FROM padcom_alertas_regras ORDER BY severidade;
-- Esperado: 8 regras (2 critica/alta, 3 alta, 2 media, 1 baixa)
