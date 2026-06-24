import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bell, FileWarning, UserCog, Activity, Stethoscope, TrendingUp, ShieldAlert, GitBranch, Tablets, Zap, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from "recharts";
import { useState, useMemo } from "react";

const priorityColor: Record<string, string> = {
  critica: "bg-red-500/10 text-red-700 border-red-200",
  alta: "bg-orange-500/10 text-orange-700 border-orange-200",
  moderada: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  baixa: "bg-blue-500/10 text-blue-700 border-blue-200",
};

const funnelStages = [
  { key: "iniciou_e_parou", label: "Iniciou", color: "#ef4444" },
  { key: "concluiu_clinico", label: "Clínico OK", color: "#f59e0b" },
  { key: "concluiu_financeiro", label: "Financeiro OK", color: "#3b82f6" },
  { key: "alto_interesse", label: "Alto Interesse", color: "#8b5cf6" },
  { key: "convertido", label: "Convertido", color: "#22c55e" },
];

const AXIS_LABELS: Record<string, string> = {
  sleep: "Sono", energy: "Energia", mood: "Humor", focus: "Foco",
  concentration: "Concentração", libido: "Libido", strength: "Força", physicalActivity: "Ativ. Física",
};

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: alerts } = trpc.alert.list.useQuery(undefined, { refetchInterval: 30000 });
  const { data: reports } = trpc.prescriptionReport.list.useQuery(undefined, { refetchInterval: 30000 });
  const { data: funnelStats } = trpc.funnel.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: bands } = trpc.scoring.bands.useQuery();
  const { data: patients } = trpc.patient.list.useQuery();
  const [, setLocation] = useLocation();
  const [patientSearch, setPatientSearch] = useState("");

  const recentAlerts = (alerts ?? []).filter((a: any) => a.status === "ativo").slice(0, 5);
  const openReports = (reports ?? []).filter((r: any) => r.status === "aberto").slice(0, 5);

  // Compute global average radar from all patients' latest daily reports
  // We query the first patient's timeline as a proxy. In production, this would be a dedicated endpoint.
  // For now, show the stats-based data or placeholder
  const radarData = useMemo(() => {
    const defaultData = [
      { axis: "Sono", value: 0, fullMark: 10 },
      { axis: "Energia", value: 0, fullMark: 10 },
      { axis: "Humor", value: 0, fullMark: 10 },
      { axis: "Foco", value: 0, fullMark: 10 },
      { axis: "Concentração", value: 0, fullMark: 10 },
      { axis: "Libido", value: 0, fullMark: 10 },
      { axis: "Força", value: 0, fullMark: 10 },
      { axis: "Ativ. Física", value: 0, fullMark: 10 },
    ];
    return defaultData;
  }, []);

  // Funnel chart data
  const funnelData = funnelStages.map(s => ({
    ...s,
    count: (funnelStats as any[])?.find((f: any) => f.stage === s.key)?.count ?? 0,
  }));
  const funnelTotal = funnelData.reduce((a, b) => a + b.count, 0);

  // Filtered patients for quick search
  const filteredPatients = useMemo(() => {
    if (!patients || !patientSearch.trim()) return (patients ?? []).slice(0, 8);
    const s = patientSearch.toLowerCase();
    return (patients as any[]).filter((p: any) => p.name?.toLowerCase().includes(s) || p.cpf?.includes(s)).slice(0, 8);
  }, [patients, patientSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PADCOM GLOBAL</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo, Dr. {user?.name?.split(" ")[0] ?? ""}. Visão consolidada do sistema clínico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal gap-1.5 py-1">
            <Activity className="h-3 w-3" />
            Motor V15
          </Badge>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard icon={Users} label="Pacientes" value={stats?.totalPatients ?? 0} color="text-primary" onClick={() => setLocation("/pacientes")} />
            <StatCard icon={Bell} label="Alertas" value={stats?.activeAlerts ?? 0} color="text-orange-600" onClick={() => setLocation("/alertas")} />
            <StatCard icon={FileWarning} label="Relatos" value={stats?.openReports ?? 0} color="text-red-600" onClick={() => setLocation("/relatos-diarios")} />
            <StatCard icon={UserCog} label="Consultoras" value={stats?.activeConsultants ?? 0} color="text-emerald-600" onClick={() => setLocation("/consultoras")} />
            <StatCard icon={ShieldAlert} label="Flags" value={stats?.pendingFlags ?? 0} color="text-purple-600" onClick={() => setLocation("/flags-clinicas")} />
            <StatCard icon={Tablets} label="Fórmulas" value={stats?.activePrescriptions ?? 0} color="text-cyan-600" onClick={() => setLocation("/prescricoes")} />
          </>
        )}
      </div>

      {/* Row 2: Quick Patient Search + Funnel + Scoring Bands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Patient Search */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Busca Rápida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Nome ou CPF..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum paciente encontrado</p>
              ) : (
                (filteredPatients as any[]).map((p: any) => (
                  <button key={p.id} className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors flex items-center justify-between group"
                    onClick={() => setLocation(`/pacientes/${p.id}`)}>
                    <div>
                      <p className="text-xs font-medium group-hover:text-primary transition-colors">{p.name}</p>
                      {p.cpf && <p className="text-[10px] text-muted-foreground">{p.cpf}</p>}
                    </div>
                    <Badge variant={p.isActive ? "default" : "secondary"} className="text-[9px] h-4">{p.isActive ? "Ativo" : "Inativo"}</Badge>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-purple-500" />
              Funil Comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Total: {funnelTotal}</span>
              <span className="text-emerald-600 font-medium">
                Conversão: {funnelTotal > 0 ? Math.round(((funnelData.find(f => f.key === "convertido")?.count ?? 0) / funnelTotal) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Bands */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Faixas de Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bands ?? []).map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: `${b.color}40`, backgroundColor: `${b.color}08` }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: b.color }}>{b.name}</span>
                      <span className="text-xs text-muted-foreground">{b.minScore}–{b.maxScore} pts</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.description}</p>
                  </div>
                </div>
              ))}
              {(!bands || bands.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6">Configure as faixas em Motor de Ações</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Alerts & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum alerta ativo</p>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setLocation("/alertas")}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.category}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${priorityColor[alert.priority] ?? ""}`}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-red-500" />
              Relatos de Prescrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openReports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum relato aberto</p>
            ) : (
              <div className="space-y-2">
                {openReports.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.description?.slice(0, 60)}...</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {report.reportType === "reacao_adversa" ? "Reação Adversa" : report.reportType}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${report.severity === "grave" ? "bg-red-500/10 text-red-700" : report.severity === "moderada" ? "bg-orange-500/10 text-orange-700" : "bg-blue-500/10 text-blue-700"}`}>
                      {report.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: { icon: any; label: string; value: number; color: string; onClick?: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50 group-hover:bg-accent transition-colors ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
