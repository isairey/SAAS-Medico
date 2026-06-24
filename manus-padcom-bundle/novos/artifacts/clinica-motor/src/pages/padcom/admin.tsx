import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Search, Filter, Clock, CheckCircle2, AlertTriangle, User, ChevronRight } from "lucide-react";

interface Sessao {
  id: string;
  pacienteId: string;
  status: string;
  scoreFinal: number | null;
  banda: string | null;
  perguntasRespondidas: number;
  totalPerguntas: number;
  origemCanal: string | null;
  criadoEm: string;
  finalizadaEm: string | null;
  validadaEm: string | null;
}

const BANDAS_CONFIG: Record<string, { cor: string; bg: string; label: string }> = {
  verde: { cor: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", label: "Verde — Manutenção" },
  amarela: { cor: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", label: "Amarela — Atenção" },
  laranja: { cor: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", label: "Laranja — Intervenção" },
  vermelha: { cor: "text-red-400", bg: "bg-red-400/10 border-red-400/30", label: "Vermelha — Urgência" },
};

const STATUS_CONFIG: Record<string, { icone: any; cor: string; label: string }> = {
  em_andamento: { icone: Clock, cor: "text-blue-400", label: "Em andamento" },
  finalizada: { icone: AlertTriangle, cor: "text-amber-400", label: "Aguardando validação" },
  validada: { icone: CheckCircle2, cor: "text-emerald-400", label: "Validada" },
};

export default function PadcomAdmin() {
  const navigate = useNavigate();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroBanda, setFiltroBanda] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const { data: sessoes = [], isLoading } = useQuery<Sessao[]>({
    queryKey: ["padcom-sessoes", filtroStatus, filtroBanda],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroStatus !== "todos") params.set("status", filtroStatus);
      if (filtroBanda !== "todas") params.set("banda", filtroBanda);
      const r = await fetch(`/api/padcom-sessoes?${params}`);
      if (!r.ok) throw new Error("Falha ao carregar sessões");
      return r.json();
    },
  });

  const sessoesFiltradas = sessoes.filter(s =>
    busca ? s.pacienteId.toLowerCase().includes(busca.toLowerCase()) : true
  );

  // Contadores do funil
  const contadores = {
    total: sessoes.length,
    emAndamento: sessoes.filter(s => s.status === "em_andamento").length,
    aguardando: sessoes.filter(s => s.status === "finalizada").length,
    validadas: sessoes.filter(s => s.status === "validada").length,
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--pawards-cyan))]">
              PADCOM Admin
            </h1>
            <p className="text-slate-400 mt-1">
              Fila de sessões de anamnese — gerencie, valide e acompanhe o motor clínico
            </p>
          </div>
          <button
            onClick={() => navigate("/padcom-admin/dashboard")}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
          >
            Ver Dashboard
          </button>
        </div>

        {/* Funil de status — chips */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", valor: contadores.total, cor: "border-slate-600 bg-slate-800/50" },
            { label: "Em andamento", valor: contadores.emAndamento, cor: "border-blue-500/30 bg-blue-500/10" },
            { label: "Aguardando validação", valor: contadores.aguardando, cor: "border-amber-500/30 bg-amber-500/10" },
            { label: "Validadas", valor: contadores.validadas, cor: "border-emerald-500/30 bg-emerald-500/10" },
          ].map((item, idx) => (
            <div key={idx} className={`rounded-xl border px-4 py-3 ${item.cor}`}>
              <p className="text-2xl font-bold text-white">{item.valor}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por paciente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none text-sm"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="todos">Todos os status</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizada">Aguardando validação</option>
            <option value="validada">Validadas</option>
          </select>
          <select
            value={filtroBanda}
            onChange={(e) => setFiltroBanda(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="todas">Todas as bandas</option>
            <option value="verde">Verde</option>
            <option value="amarela">Amarela</option>
            <option value="laranja">Laranja</option>
            <option value="vermelha">Vermelha</option>
          </select>
        </div>

        {/* Lista de sessões */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessoesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma sessão encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessoesFiltradas.map(sessao => {
              const bandaConfig = sessao.banda ? BANDAS_CONFIG[sessao.banda] : null;
              const statusConfig = STATUS_CONFIG[sessao.status] ?? STATUS_CONFIG.em_andamento;
              const StatusIcon = statusConfig.icone;

              return (
                <button
                  key={sessao.id}
                  onClick={() => navigate(`/padcom-admin/${sessao.id}`)}
                  className="w-full flex items-center gap-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 transition-all group text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {sessao.pacienteId}
                      </span>
                      {bandaConfig && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${bandaConfig.bg} ${bandaConfig.cor}`}>
                          {sessao.banda}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className={`flex items-center gap-1 ${statusConfig.cor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {sessao.scoreFinal != null && (
                        <span>Score: {sessao.scoreFinal}</span>
                      )}
                      <span>{sessao.perguntasRespondidas}/{sessao.totalPerguntas} respostas</span>
                      {sessao.origemCanal && (
                        <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">
                          {sessao.origemCanal}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seta */}
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
