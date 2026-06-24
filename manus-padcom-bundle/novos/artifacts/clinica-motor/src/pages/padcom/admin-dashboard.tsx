import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList
} from "recharts";
import { ArrowLeft, TrendingUp, Users, AlertTriangle, Clock } from "lucide-react";

interface DashboardData {
  porStatus: Array<{ status: string; total: number }>;
  porBanda: Array<{ banda: string; total: number; scoreMedia: string | null }>;
  alertasPendentes: number;
  abandonos: Array<{ ultimoModulo: number | null; total: number }>;
}

const BANDAS_CORES: Record<string, string> = {
  verde: "#34d399",
  amarela: "#fbbf24",
  laranja: "#fb923c",
  vermelha: "#f87171",
};

const BANDAS_LABELS: Record<string, string> = {
  verde: "Verde — Manutenção",
  amarela: "Amarela — Atenção",
  laranja: "Laranja — Intervenção",
  vermelha: "Vermelha — Urgência",
};

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento",
  finalizada: "Aguardando validação",
  validada: "Validada",
};

const MODULOS_LABELS: Record<number, string> = {
  1: "M1 — Hábitos",
  2: "M2 — Sintomas",
  3: "M3 — Digestiva",
  4: "M4 — Mental/Sono",
  5: "M5 — Histórico",
};

export default function PadcomAdminDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["padcom-dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/padcom-dashboard");
      if (!r.ok) throw new Error("Falha ao carregar dashboard");
      return r.json();
    },
  });

  if (isLoading || !data) {
    return (
      <Layout>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Calcular totais
  const totalSessoes = data.porStatus.reduce((acc, s) => acc + Number(s.total), 0);
  const emAndamento = data.porStatus.find(s => s.status === "em_andamento")?.total ?? 0;
  const finalizadas = data.porStatus.find(s => s.status === "finalizada")?.total ?? 0;
  const validadas = data.porStatus.find(s => s.status === "validada")?.total ?? 0;

  // Dados para o gráfico de pizza (bandas)
  const dadosBandas = data.porBanda.map(b => ({
    name: BANDAS_LABELS[b.banda] ?? b.banda,
    value: Number(b.total),
    cor: BANDAS_CORES[b.banda] ?? "#94a3b8",
    scoreMedia: b.scoreMedia ? Number(b.scoreMedia).toFixed(1) : "—",
  }));

  // Dados para o funil
  const dadosFunil = [
    { name: "Sessões iniciadas", value: totalSessoes, fill: "#67e8f9" },
    { name: "Finalizadas", value: Number(finalizadas) + Number(validadas), fill: "#fbbf24" },
    { name: "Validadas", value: Number(validadas), fill: "#34d399" },
  ];

  // Dados para abandono por módulo
  const dadosAbandono = data.abandonos
    .filter(a => a.ultimoModulo != null)
    .map(a => ({
      modulo: MODULOS_LABELS[a.ultimoModulo!] ?? `M${a.ultimoModulo}`,
      abandonos: Number(a.total),
    }))
    .sort((a, b) => {
      const numA = parseInt(a.modulo.replace(/\D/g, ""));
      const numB = parseInt(b.modulo.replace(/\D/g, ""));
      return numA - numB;
    });

  // Dados para barras de status
  const dadosStatus = data.porStatus.map(s => ({
    status: STATUS_LABELS[s.status] ?? s.status,
    total: Number(s.total),
  }));

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
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--pawards-cyan))]">
              PADCOM Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Visão analítica do motor de anamnese — distribuição de bandas, funil e telemetria
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Sessões", valor: totalSessoes, icone: Users, cor: "text-cyan-400" },
            { label: "Em Andamento", valor: emAndamento, icone: Clock, cor: "text-blue-400" },
            { label: "Aguardando Validação", valor: finalizadas, icone: TrendingUp, cor: "text-amber-400" },
            { label: "Alertas Pendentes", valor: data.alertasPendentes, icone: AlertTriangle, cor: "text-red-400" },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icone className={`w-4 h-4 ${kpi.cor}`} />
                <span className="text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-3xl font-bold text-white">{kpi.valor}</p>
            </div>
          ))}
        </div>

        {/* Gráficos — Linha 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribuição por Banda (Pizza) */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Distribuição por Banda</h2>
            {dadosBandas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosBandas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {dadosBandas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} sessões (score médio: ${props.payload.scoreMedia})`,
                      name,
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Nenhuma sessão finalizada ainda
              </div>
            )}
          </div>

          {/* Funil de Conversão */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Funil de Conversão</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosFunil} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {dadosFunil.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Taxa de conversão */}
            <div className="mt-4 flex gap-4 text-xs text-slate-400">
              <span>
                Conclusão: <strong className="text-white">
                  {totalSessoes > 0 ? ((Number(finalizadas) + Number(validadas)) / totalSessoes * 100).toFixed(1) : 0}%
                </strong>
              </span>
              <span>
                Validação: <strong className="text-white">
                  {(Number(finalizadas) + Number(validadas)) > 0
                    ? (Number(validadas) / (Number(finalizadas) + Number(validadas)) * 100).toFixed(1)
                    : 0}%
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Gráficos — Linha 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Telemetria de Abandono */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Telemetria de Abandono
              <span className="text-xs text-slate-500 font-normal ml-2">
                (sessões em andamento por último módulo visitado)
              </span>
            </h2>
            {dadosAbandono.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosAbandono}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="modulo" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="abandonos" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                Nenhum abandono registrado
              </div>
            )}
          </div>

          {/* Score Médio por Banda */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Score Médio por Banda</h2>
            <div className="space-y-4">
              {dadosBandas.map((banda, idx) => {
                const scoreNum = parseFloat(banda.scoreMedia) || 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{banda.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{banda.value} sessões</span>
                        <span className="font-mono font-bold text-white">{banda.scoreMedia}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(scoreNum, 100)}%`,
                          backgroundColor: banda.cor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {dadosBandas.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma sessão finalizada ainda
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
