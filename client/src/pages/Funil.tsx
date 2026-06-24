import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, AlertTriangle, Star, DollarSign, MessageSquare, Clock, Phone } from "lucide-react";

const stageLabels: Record<string, string> = {
  iniciou_e_parou: "Iniciou e Parou",
  concluiu_clinico: "Concluiu Clínico",
  concluiu_financeiro: "Concluiu Financeiro",
  alto_interesse: "Alto Interesse",
  convertido: "Convertido",
};

const stageColors: Record<string, string> = {
  iniciou_e_parou: "#ef4444",
  concluiu_clinico: "#f59e0b",
  concluiu_financeiro: "#3b82f6",
  alto_interesse: "#8b5cf6",
  convertido: "#22c55e",
};

export default function FunilPage() {
  const stats = trpc.funnel.stats.useQuery();
  const abandoned = trpc.funnel.detectAbandonment.useQuery({ daysThreshold: 7 });
  const highInterest = trpc.funnel.classifyHighInterest.useQuery();
  const forecast = trpc.funnel.commercialForecast.useQuery();

  const chartData = Object.keys(stageLabels).map(stage => ({
    stage,
    label: stageLabels[stage],
    count: stats.data?.find((s: any) => s.stage === stage)?.count ?? 0,
    color: stageColors[stage],
  }));

  const total = chartData.reduce((a, b) => a + b.count, 0);
  const convertidos = chartData.find(c => c.stage === "convertido")?.count ?? 0;
  const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;
  const taxaAbandono = total > 0 ? Math.round(((abandoned.data?.length ?? 0) / Math.max(total, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Funil Comercial</h1>
        <p className="text-sm text-muted-foreground mt-1">Pipeline de conversão — leads, abandonos, reengajamento e pacientes de alto interesse. Rastreie cada braço de entrada.</p>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada do funil de conversão, abandono e previsão comercial</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {chartData.map(item => (
          <Card key={item.stage}>
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              {total > 0 && <p className="text-xs text-muted-foreground">{Math.round((item.count / total) * 100)}%</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detecção de Abandono - dados reais do backend */}
        <Card className="border-red-200 dark:border-red-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Detecção de Abandono
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div>
                <p className="text-2xl font-bold text-red-600">{abandoned.data?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Pacientes com sessão incompleta há 7+ dias</p>
              </div>
              <Badge variant="destructive" className="text-lg px-3">{taxaAbandono}%</Badge>
            </div>
            {(abandoned.data ?? []).length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(abandoned.data ?? []).map((p: any) => (
                  <div key={p.patientId} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">{p.patientName}</span>
                      <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1 inline-flex">
                        <Clock className="h-3 w-3" /> {p.daysSinceActivity} dias
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {p.phone && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => {
                          const phone = p.phone.replace(/\D/g, "");
                          const msg = encodeURIComponent(`Olá ${p.patientName}! Notamos que você iniciou sua avaliação de saúde mas não concluiu. Gostaria de retomar? Estamos à disposição! Equipe PADCOM`);
                          window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                        }}>
                          <MessageSquare className="h-3 w-3" /> WhatsApp
                        </Button>
                      )}
                      {p.phone && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => window.open(`tel:${p.phone}`)}>
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum paciente com abandono detectado</p>
            )}
          </CardContent>
        </Card>

        {/* Alto Interesse - dados reais do backend */}
        <Card className="border-purple-200 dark:border-purple-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Star className="w-5 h-5" /> Alto Interesse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div>
                <p className="text-2xl font-bold text-purple-600">{highInterest.data?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Pacientes com score ≥50 e funil avançado</p>
              </div>
            </div>
            {(highInterest.data ?? []).length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(highInterest.data ?? []).map((p: any) => (
                  <div key={p.patientId} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">{p.patientName}</span>
                      <Badge className="ml-2 text-[10px]" variant="secondary">Score: {p.score}</Badge>
                      {p.scoreBand && <Badge className="ml-1 text-[10px] bg-purple-100 text-purple-700">{p.scoreBand}</Badge>}
                    </div>
                    {p.phone && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => {
                        const phone = p.phone.replace(/\D/g, "");
                        const msg = encodeURIComponent(`Olá ${p.patientName}! Gostaríamos de agendar sua consulta. Quando seria o melhor horário? Equipe PADCOM`);
                        window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                      }}>
                        <MessageSquare className="h-3 w-3" /> Agendar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum paciente classificado como alto interesse</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Funil */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Distribuição do Funil</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Previsão Comercial por Camada - dados reais do backend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Previsão Comercial por Camada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(forecast.data ?? []).map((camada: any) => {
              const colors: Record<string, string> = { "Básico": "#94a3b8", "Intermediário": "#3b82f6", "Avançado": "#8b5cf6", "Full": "#22c55e" };
              const color = colors[camada.band] ?? "#6b7280";
              return (
                <div key={camada.band} className="p-4 rounded-lg border text-center space-y-2" style={{ borderColor: color + "40" }}>
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                    <DollarSign className="h-5 w-5" style={{ color }} />
                  </div>
                  <p className="font-semibold" style={{ color }}>{camada.band}</p>
                  <div className="text-2xl font-bold">{camada.count}</div>
                  <p className="text-[10px] text-muted-foreground">pacientes</p>
                  {camada.count > 0 && (
                    <p className="text-xs font-medium text-muted-foreground">
                      R$ {camada.revenueMin.toLocaleString("pt-BR")} – R$ {camada.revenueMax.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {(forecast.data ?? []).some((c: any) => c.count > 0) && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Receita estimada total:</p>
              <p className="text-lg font-bold text-primary">
                R$ {(forecast.data ?? []).reduce((a: number, c: any) => a + c.revenueMin, 0).toLocaleString("pt-BR")} – R$ {(forecast.data ?? []).reduce((a: number, c: any) => a + c.revenueMax, 0).toLocaleString("pt-BR")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Resumo Geral</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{total}</div>
              <p className="text-sm text-muted-foreground">Total no funil</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{convertidos}</div>
              <p className="text-sm text-muted-foreground">Convertidos</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{taxaConversao}%</div>
              <p className="text-sm text-muted-foreground">Taxa de conversão</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{taxaAbandono}%</div>
              <p className="text-sm text-muted-foreground">Taxa de abandono</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
