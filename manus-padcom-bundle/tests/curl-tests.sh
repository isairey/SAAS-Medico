#!/bin/bash
# ============================================================
# PADCOM V15 — Testes de Rota via curl
# Executar com: bash tests/curl-tests.sh
# Pré-requisito: api-server rodando em localhost:8080
# ============================================================

BASE="http://localhost:8080/api"
PASS=0
FAIL=0
TOTAL=0

verde="\033[0;32m"
vermelho="\033[0;31m"
reset="\033[0m"

test_endpoint() {
  local method=$1
  local url=$2
  local body=$3
  local expected_status=$4
  local desc=$5
  TOTAL=$((TOTAL + 1))

  if [ "$method" = "GET" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$url")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$body" "$BASE$url")
  fi

  if [ "$status" = "$expected_status" ]; then
    echo -e "${verde}✓ PASS${reset} [$method $url] → $status ($desc)"
    PASS=$((PASS + 1))
  else
    echo -e "${vermelho}✗ FAIL${reset} [$method $url] → $status (esperado $expected_status) ($desc)"
    FAIL=$((FAIL + 1))
  fi
}

echo "════════════════════════════════════════════════════"
echo "  PADCOM V15 — Testes de Rota"
echo "  Base: $BASE"
echo "════════════════════════════════════════════════════"
echo ""

# ── QUESTIONÁRIOS ──
echo "── Questionários ──"
test_endpoint "GET" "/padcom-questionarios" "" "200" "Listar questionários (pode ser vazio)"
test_endpoint "POST" "/padcom-questionarios" '{"modulo":1,"ordem":99,"pergunta":"Teste curl","tipo_resposta":"escala_1_5","peso":1}' "201" "Criar questionário de teste"

# ── BANDAS ──
echo ""
echo "── Bandas ──"
test_endpoint "GET" "/padcom-bandas" "" "200" "Listar bandas de conduta"

# ── SESSÕES ──
echo ""
echo "── Sessões ──"
test_endpoint "POST" "/padcom-sessoes" '{"pacienteId":"test-paciente-001"}' "201" "Iniciar sessão nova"

# Capturar ID da sessão criada para testes subsequentes
SESSAO_ID=$(curl -s -X POST -H "Content-Type: application/json" -d '{"pacienteId":"test-paciente-002"}' "$BASE/padcom-sessoes" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SESSAO_ID" ]; then
  echo "  → Sessão criada: $SESSAO_ID"

  test_endpoint "GET" "/padcom-sessoes/$SESSAO_ID" "" "200" "Buscar sessão por ID"

  # ── RESPOSTAS ──
  echo ""
  echo "── Respostas ──"
  test_endpoint "POST" "/padcom-sessoes/$SESSAO_ID/responder" '{"questionarioId":"q-test-001","respostaJson":{"valor":3},"scoreParcial":15}' "201" "Salvar resposta individual"

  # ── FINALIZAR ──
  echo ""
  echo "── Finalizar ──"
  test_endpoint "POST" "/padcom-sessoes/$SESSAO_ID/finalizar" '{}' "200" "Finalizar sessão (computa banda + alertas)"

  # Verificar que sessão foi finalizada
  test_endpoint "GET" "/padcom-sessoes/$SESSAO_ID" "" "200" "Verificar sessão finalizada"
else
  echo -e "${vermelho}  ⚠ Não conseguiu criar sessão — testes de resposta/finalizar pulados${reset}"
  FAIL=$((FAIL + 3))
  TOTAL=$((TOTAL + 3))
fi

# ── DASHBOARD ──
echo ""
echo "── Dashboard ──"
test_endpoint "GET" "/padcom-dashboard" "" "200" "Dashboard agregado (stats)"

# ── AUDITORIA ──
echo ""
echo "── Auditoria ──"
test_endpoint "GET" "/padcom-auditoria" "" "200" "Listar log de auditoria"

# ── ALERTAS ──
echo ""
echo "── Alertas ──"
test_endpoint "GET" "/padcom-alertas" "" "200" "Listar alertas gerados"
test_endpoint "GET" "/padcom-alertas-regras" "" "200" "Listar regras de alerta"

# ── VALIDAÇÃO DE ERRO ──
echo ""
echo "── Validação de Erro ──"
test_endpoint "POST" "/padcom-sessoes" '{}' "400" "Sessão sem pacienteId → 400"
test_endpoint "POST" "/padcom-questionarios" '{}' "400" "Questionário sem campos obrigatórios → 400"
test_endpoint "GET" "/padcom-sessoes/id-inexistente-xyz" "" "404" "Sessão inexistente → 404"

# ── RESULTADO ──
echo ""
echo "════════════════════════════════════════════════════"
echo "  RESULTADO: $PASS/$TOTAL passaram"
if [ $FAIL -gt 0 ]; then
  echo -e "  ${vermelho}$FAIL teste(s) falharam${reset}"
else
  echo -e "  ${verde}Todos os testes passaram!${reset}"
fi
echo "════════════════════════════════════════════════════"

# Limpar dados de teste (opcional)
# curl -s -X DELETE "$BASE/padcom-questionarios/teste" > /dev/null 2>&1

exit $FAIL
