import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Clock, FileText,
  Beaker, Pill, Syringe, Activity, Shield, Download
} from "lucide-react";

interface SessaoDetalhe {
  sessao: {
    id: string;
    pacienteId: string;
    status: string;
    scoreFinal: number | null;
    banda: string | null;
    versaoQuestionario: number;
    respostasSnapshot: any;
    ultimoModuloVisitado: number;
    perguntasRespondidas: number;
    totalPerguntas: number;
    tempoTotalSegundos: number | null;
    origemCanal: string | null;
    dispositivoInfo: any;
    iniciadaEm: string;
    finalizadaEm: string | null;
    validadaEm: string | null;
    validadaPor: string | null;
  };
  respostas: Array<{
    id: string;
    modulo: number;
    ordem: number;
    valorNumerico: number | null;
    valorTexto: string | null;
    scoreParcial: number | null;
    tempoRespostaMs: number | null;
  }>;
  alertas: Array<{
    id: string;
    tipo: string;
    severidade: string;
    titulo: string;
    descricao: string;
    status: string;
  }>;
}

const BANDAS_CORES: Record<string, string> = {
  verde: "from-emerald-500 to-teal-600",
  amarela: "from-amber-500 to-yellow-600",
  laranja: "from-orange-500 to-red-500",
  vermelha: "from-red-500 to-rose-600",
};

const MODULOS_NOMES: Record<number, string> = {
  1: "Hábitos de Vida",
  2: "Sintomas Gerais",
  3: "Saúde Digestiva",
  4: "Saúde Mental e Sono",
  5: "Histórico e Medicamentos",
};

export default function PadcomAdminDetalhe() {
  const { sessaoId } = useParams<{ sessaoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SessaoDetalhe>({
    queryKey: ["padcom-sessao", sessaoId],
    queryFn: async () => {
      const r = await fetch(`/api/padcom-sessoes/${sessaoId}`);
      if (!r.ok) throw new Error("Sessão não encontrada");
      return r.json();
    },
    enabled: !!sessaoId,
  });

  const validar = useMutation({
    mutationFn: async () => {
      // Em produção, usar o ID do médico logado
      const r = await fetch(`/api/padcom-sessoes/${sessaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "validada", validadaEm: new Date().toISOString() }),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["padcom-sessao", sessaoId] });
    },
  });

  if (isLoading || !data) {
    return (
      <Layout>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const { sessao, respostas, alertas } = data;
  const bandaCor = sessao.banda ? BANDAS_CORES[sessao.banda] : "from-slate-500 to-slate-600";

  // Agrupar respostas por módulo
  const respostasPorModulo: Record<number, typeof respostas> = {};
  for (const r of respostas) {
    if (!respostasPorModulo[r.modulo]) respostasPorModulo[r.modulo] = [];
    respostasPorModulo[r.modulo].push(r);
  }

  // Score por módulo
  const scorePorModulo = Object.entries(respostasPorModulo).map(([mod, resps]) => ({
    modulo: Number(mod),
    nome: MODULOS_NOMES[Number(mod)] ?? `Módulo ${mod}`,
    score: resps.reduce((acc, r) => acc + (r.scoreParcial ?? 0), 0),
    maxPossivel: resps.length * 10,
    respostas: resps.length,
  }));

  // Ações do motor baseadas na banda
  const acoesMotor = getAcoesMotor(sessao.banda, sessao.scoreFinal);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/padcom-admin")}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              Sessão de {sessao.pacienteId}
            </h1>
            <p className="text-sm text-slate-400">
              Iniciada em {new Date(sessao.iniciadaEm).toLocaleString("pt-BR")}
              {sessao.origemCanal && ` — Canal: ${sessao.origemCanal}`}
            </p>
          </div>
          {sessao.status === "finalizada" && (
            <button
              onClick={() => validar.mutate()}
              disabled={validar.isPending}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Validar e Enviar para 6Q
            </button>
          )}
        </div>

        {/* Score card principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl bg-gradient-to-r ${bandaCor} p-6 text-white shadow-2xl`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 font-medium">Score Final</p>
              <p className="text-5xl font-black mt-1">{sessao.scoreFinal ?? "—"}</p>
              <p className="text-lg font-semibold mt-2 capitalize">
                Banda {sessao.banda ?? "indefinida"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <FileText className="w-4 h-4" />
                {sessao.perguntasRespondidas}/{sessao.totalPerguntas} respostas
              </div>
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Clock className="w-4 h-4" />
                {sessao.status === "validada" ? "Validada" : sessao.status === "finalizada" ? "Aguardando validação" : "Em andamento"}
              </div>
              {sessao.validadaPor && (
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Shield className="w-4 h-4" />
                  Validado por {sessao.validadaPor}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Score por módulo */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Score por Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {scorePorModulo.map(mod => {
              const pct = mod.maxPossivel > 0 ? (mod.score / mod.maxPossivel) * 100 : 0;
              return (
                <div key={mod.modulo} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Módulo {mod.modulo}</p>
                  <p className="text-sm font-medium text-white mb-2">{mod.nome}</p>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${pct > 75 ? "bg-red-400" : pct > 50 ? "bg-orange-400" : pct > 25 ? "bg-amber-400" : "bg-emerald-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">{mod.score}/{mod.maxPossivel} ({Math.round(pct)}%)</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ações do Motor */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            <Activity className="w-5 h-5 inline mr-2 text-cyan-400" />
            Ações Sugeridas pelo Motor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {acoesMotor.map((acao, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl border p-4 ${acao.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {acao.icone}
                  <span className="font-medium text-sm text-white">{acao.categoria}</span>
                </div>
                <ul className="space-y-1">
                  {acao.itens.map((item, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-slate-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              <AlertTriangle className="w-5 h-5 inline mr-2 text-amber-400" />
              Alertas ({alertas.length})
            </h2>
            <div className="space-y-2">
              {alertas.map(alerta => (
                <div
                  key={alerta.id}
                  className={`rounded-xl border px-4 py-3 ${
                    alerta.severidade === "critica" ? "border-red-500/30 bg-red-500/10"
                    : alerta.severidade === "alta" ? "border-orange-500/30 bg-orange-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                  }`}
                >
                  <p className="font-medium text-sm text-white">{alerta.titulo}</p>
                  <p className="text-xs text-slate-400 mt-1">{alerta.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Respostas detalhadas */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            <FileText className="w-5 h-5 inline mr-2 text-slate-400" />
            Todas as Respostas
          </h2>
          {Object.entries(respostasPorModulo).map(([mod, resps]) => (
            <div key={mod} className="mb-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Módulo {mod} — {MODULOS_NOMES[Number(mod)]}
              </h3>
              <div className="space-y-1">
                {resps.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2 text-sm">
                    <span className="text-slate-500 w-8">Q{r.ordem}</span>
                    <div className="flex-1">
                      <span className="text-white">
                        {r.valorNumerico != null ? `${r.valorNumerico}/10` : r.valorTexto ?? "—"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Score: {r.scoreParcial ?? 0}
                    </span>
                    {r.tempoRespostaMs && (
                      <span className="text-xs text-slate-600">
                        {(r.tempoRespostaMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

// Motor de ações sugeridas baseado na banda
function getAcoesMotor(banda: string | null, score: number | null) {
  const acoes = [];

  // Exames sempre sugeridos
  acoes.push({
    categoria: "Exames Laboratoriais",
    icone: <Beaker className="w-4 h-4 text-blue-400" />,
    bg: "border-blue-500/30 bg-blue-500/5",
    itens: banda === "vermelha" || banda === "laranja"
      ? ["Hemograma completo", "PCR ultrassensível", "Vitamina D (25-OH)", "Vitamina B12", "TSH + T4L", "Insulina basal", "Cortisol matinal", "Homocisteína"]
      : banda === "amarela"
      ? ["Hemograma completo", "Vitamina D (25-OH)", "Vitamina B12", "TSH", "Glicemia jejum"]
      : ["Hemograma completo", "Vitamina D (25-OH)", "Glicemia jejum"],
  });

  // Fórmula sempre
  acoes.push({
    categoria: "Fórmula Magistral",
    icone: <Pill className="w-4 h-4 text-emerald-400" />,
    bg: "border-emerald-500/30 bg-emerald-500/5",
    itens: banda === "vermelha" || banda === "laranja"
      ? ["Vitamina D3 10.000UI/dia", "Ômega-3 EPA/DHA 3g/dia", "Magnésio quelado 400mg", "CoQ10 200mg", "Zinco quelado 30mg", "Complexo B metilado"]
      : banda === "amarela"
      ? ["Vitamina D3 5.000UI/dia", "Ômega-3 EPA/DHA 2g/dia", "Magnésio quelado 300mg", "CoQ10 100mg"]
      : ["Vitamina D3 2.000UI/dia", "Ômega-3 EPA/DHA 1g/dia", "Magnésio quelado 200mg"],
  });

  // Injetáveis (bandas altas)
  if (banda === "vermelha" || banda === "laranja") {
    acoes.push({
      categoria: "Terapia Injetável (IM/EV)",
      icone: <Syringe className="w-4 h-4 text-rose-400" />,
      bg: "border-rose-500/30 bg-rose-500/5",
      itens: banda === "vermelha"
        ? ["Vitamina C EV 15g (protocolo semanal)", "Glutationa EV 600mg", "Complexo B12 IM 5.000mcg", "NAD+ EV 250mg (avaliar)"]
        : ["Vitamina C EV 7,5g (quinzenal)", "Complexo B12 IM 1.000mcg"],
    });
  }

  return acoes;
}
