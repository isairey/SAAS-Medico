import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Copy, MessageSquare, Pill, FlaskConical, CalendarCheck, Bell, FileHeart, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const SYSTEM_LABELS: Record<string, string> = {
  cardio: "Cardiovascular",
  metabolico: "Metabólico",
  endocrino: "Endócrino",
  sono: "Sono",
  intestino: "Intestinal",
  hormonal: "Hormonal",
  humor: "Humor",
  foco: "Foco",
  energia: "Energia",
  libido: "Libido",
};

export default function PacienteDetalhe() {
  const params = useParams<{ id: string }>();
  const patientId = Number(params.id);
  const [, setLocation] = useLocation();
  const { data: patient, isLoading } = trpc.patient.get.useQuery({ id: patientId });
  const { data: prescriptions } = trpc.prescription.list.useQuery({ patientId });
  const { data: dailyReports } = trpc.dailyReport.list.useQuery({ patientId, limit: 20 });
  const { data: examsData } = trpc.exam.list.useQuery({ patientId });
  const { data: sessions } = trpc.followUp.list.useQuery({ patientId });
  const { data: alertsData } = trpc.alert.list.useQuery({ patientId });

  // Build radar data from daily reports
  const radarData = useMemo(() => {
    if (!dailyReports?.length) return [];
    const latest = dailyReports[0] as any;
    const axes = [
      { axis: "Sono", value: latest.sleep ?? 0 },
      { axis: "Energia", value: latest.energy ?? 0 },
      { axis: "Foco", value: latest.focus ?? 0 },
      { axis: "Libido", value: latest.libido ?? 0 },
      { axis: "Humor", value: latest.mood ?? 0 },
      { axis: "Digestão", value: latest.digestion ?? 0 },
    ].filter(a => a.value > 0);
    return axes;
  }, [dailyReports]);

  // Build evolution chart from daily reports
  const evolutionData = useMemo(() => {
    if (!dailyReports?.length) return [];
    return [...dailyReports].reverse().slice(-10).map((r: any) => ({
      date: r.reportDate,
      sono: r.sleep,
      energia: r.energy,
      foco: r.focus,
      libido: r.libido,
    }));
  }, [dailyReports]);

  // Calculate clinical score from latest reports
  const clinicalScore = useMemo(() => {
    if (!dailyReports?.length) return null;
    const latest = dailyReports[0] as any;
    const values = [latest.sleep, latest.energy, latest.focus, latest.libido, latest.mood, latest.digestion].filter(v => v != null && v > 0);
    if (values.length === 0) return null;
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    return Math.round(avg * 10);
  }, [dailyReports]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!patient) return <div className="p-8 text-center text-muted-foreground">Paciente não encontrado</div>;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${patient.accessToken}`);
    toast.success("Link copiado!");
  };

  const sendWhatsApp = () => {
    const url = `${window.location.origin}/portal/${patient.accessToken}`;
    const msg = encodeURIComponent(`Olá ${patient.name}! Segue o link para preencher sua anamnese e relatos no PADCOM: ${url}`);
    const phone = patient.phone?.replace(/\D/g, "") ?? "";
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  const activePrescriptions = (prescriptions ?? []).filter((p: any) => p.status === "ativa");
  const activeAlerts = (alertsData ?? []).filter((a: any) => a.status === "ativo");
  const hasPendingFlags = activeAlerts.some((a: any) => a.priority === "critica");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/pacientes")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">{patient.cpf} {patient.birthDate ? `| Nasc: ${patient.birthDate}` : ""} {patient.sex ? `| ${patient.sex === "M" ? "Masculino" : patient.sex === "F" ? "Feminino" : "Outro"}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Link</Button>
          {patient.phone && <Button variant="outline" size="sm" className="gap-1.5 text-green-600" onClick={sendWhatsApp}><MessageSquare className="h-3.5 w-3.5" /> WhatsApp</Button>}
        </div>
      </div>

      {/* Score + Radar + CTA */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Clinical Score */}
        <Card className="border-2 border-primary/10">
          <CardContent className="p-6 text-center space-y-3">
            <div className="text-4xl font-bold text-primary">{clinicalScore ?? "—"}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Score Clínico</p>
            {clinicalScore != null && (
              <Badge variant="outline" className={`text-xs ${clinicalScore >= 70 ? "bg-green-50 text-green-700" : clinicalScore >= 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                {clinicalScore >= 70 ? "Ótimo" : clinicalScore >= 40 ? "Mediano" : "Atenção"}
              </Badge>
            )}
            <Button
              className="w-full gap-1.5 mt-2"
              disabled={hasPendingFlags}
              onClick={() => toast.success("Protocolo validado e enviado")}
            >
              {hasPendingFlags ? (
                <><Shield className="h-4 w-4" /> Flags Pendentes</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Validar e Enviar Protocolo</>
              )}
            </Button>
            {hasPendingFlags && (
              <p className="text-xs text-destructive">Existem flags clínicas que precisam de validação humana antes de enviar o protocolo.</p>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-0"><CardTitle className="text-sm">Radar por Eixo Clínico</CardTitle></CardHeader>
          <CardContent className="p-2">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Sem dados de relatos</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={Pill} label="Fórmulas" value={activePrescriptions.length} />
          <MiniStat icon={FileHeart} label="Relatos" value={dailyReports?.length ?? 0} />
          <MiniStat icon={FlaskConical} label="Exames" value={examsData?.length ?? 0} />
          <MiniStat icon={Bell} label="Alertas" value={activeAlerts.length} color={activeAlerts.length > 0 ? "text-orange-600" : undefined} />
        </div>
      </div>

      {/* Evolution Chart */}
      {evolutionData.length > 1 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Evolução dos Sintomas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sono" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Sono" />
                <Line type="monotone" dataKey="energia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Energia" />
                <Line type="monotone" dataKey="foco" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Foco" />
                <Line type="monotone" dataKey="libido" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="Libido" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="prescricoes" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="prescricoes" className="text-xs">Prescrições</TabsTrigger>
          <TabsTrigger value="relatos" className="text-xs">Relatos</TabsTrigger>
          <TabsTrigger value="exames" className="text-xs">Exames</TabsTrigger>
          <TabsTrigger value="sessoes" className="text-xs">Sessões</TabsTrigger>
          <TabsTrigger value="alertas" className="text-xs">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="prescricoes" className="mt-4">
          {activePrescriptions.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhuma prescrição ativa</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {activePrescriptions.map((p: any) => (
                <Card key={p.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.code} | {p.dosage} | {p.frequency}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{p.status}</Badge>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relatos" className="mt-4">
          {!dailyReports?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhum relato registrado</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {dailyReports.map((r: any) => (
                <Card key={r.id}><CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{r.reportDate}</p>
                    <Badge variant="outline" className="text-xs">{r.period === "manha" ? "Manhã" : r.period === "tarde" ? "Tarde" : "Noite"}</Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                    {r.sleep != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Sono</span><span className="font-bold text-sm">{r.sleep}</span></div>}
                    {r.energy != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Energia</span><span className="font-bold text-sm">{r.energy}</span></div>}
                    {r.focus != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Foco</span><span className="font-bold text-sm">{r.focus}</span></div>}
                    {r.libido != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Libido</span><span className="font-bold text-sm">{r.libido}</span></div>}
                    {r.mood != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Humor</span><span className="font-bold text-sm">{r.mood}</span></div>}
                    {r.digestion != null && <div className="text-center p-1.5 rounded bg-muted/50"><span className="text-muted-foreground block">Digestão</span><span className="font-bold text-sm">{r.digestion}</span></div>}
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground mt-2 italic">{r.notes}</p>}
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exames" className="mt-4">
          {!examsData?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhum exame registrado</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {examsData.map((e: any) => (
                <Card key={e.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.examName}</p>
                    <p className="text-xs text-muted-foreground">{e.examDate} | {e.value} {e.unit} (Ref: {e.referenceMin}-{e.referenceMax})</p>
                  </div>
                  {e.classification && <Badge variant="outline" className={`text-xs ${e.classification === "alto" || e.classification === "baixo" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{e.classification}</Badge>}
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessoes" className="mt-4">
          {!sessions?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhuma sessão registrada</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((s: any) => (
                <Card key={s.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{new Date(s.sessionDate).toLocaleDateString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">{s.sessionType} | Score: {s.clinicalScore ?? "N/A"}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{s.status}</Badge>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          {!alertsData?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhum alerta</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {alertsData.map((a: any) => (
                <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.category} | {new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${a.priority === "critica" ? "bg-red-500/10 text-red-700" : a.priority === "alta" ? "bg-orange-500/10 text-orange-700" : ""}`}>{a.priority}</Badge>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${color ?? "text-primary"}`} />
      <div><p className="text-lg font-bold">{value}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p></div>
    </CardContent></Card>
  );
}
