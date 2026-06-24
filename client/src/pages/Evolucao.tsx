import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Activity, FlaskConical, Target } from "lucide-react";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar,
} from "recharts";

const AXIS_LABELS: Record<string, string> = {
  sleep: "Sono", energy: "Energia", mood: "Humor", focus: "Foco",
  concentration: "Concentração", libido: "Libido", strength: "Força", physicalActivity: "Ativ. Física",
};

const COLORS = ["#0d9488", "#059669", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", "#4f46e5"];

export default function EvolucaoPage() {
  const { data: patients } = trpc.patient.list.useQuery();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [days, setDays] = useState(90);
  const patientId = selectedPatient ? Number(selectedPatient) : 0;
  const { data: timeline, isLoading } = trpc.dashboard.patientTimeline.useQuery(
    { patientId, days },
    { enabled: patientId > 0 }
  );

  const symptomChartData = useMemo(() => {
    if (!timeline?.symptomData) return [];
    return timeline.symptomData.map((d: any) => ({
      ...d,
      date: typeof d.date === "string" ? d.date : new Date(d.date).toLocaleDateString("pt-BR"),
    }));
  }, [timeline]);

  const radarData = useMemo(() => {
    if (!timeline?.clinicalScore?.axes) return [];
    return Object.entries(timeline.clinicalScore.axes).map(([key, val]) => ({
      axis: AXIS_LABELS[key] ?? key,
      value: Number(val),
      fullMark: 10,
    }));
  }, [timeline]);

  const examChartData = useMemo(() => {
    if (!timeline?.examGroups) return {};
    const result: Record<string, any[]> = {};
    Object.entries(timeline.examGroups).forEach(([name, entries]: [string, any]) => {
      result[name] = entries.map((e: any) => ({
        date: e.date,
        value: e.value,
        refMin: e.refMin ? parseFloat(e.refMin) : undefined,
        refMax: e.refMax ? parseFloat(e.refMax) : undefined,
      }));
    });
    return result;
  }, [timeline]);

  const examNames = Object.keys(examChartData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Evolução Longitudinal</h1>
        <p className="text-sm text-muted-foreground mt-1">Gráficos de evolução longitudinal — acompanhe sintomas, exames e scores clínicos ao longo do tempo para cada paciente</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="space-y-1 min-w-[200px]">
          <Label className="text-xs">Paciente</Label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{(patients ?? []).map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedPatient ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Selecione um paciente para visualizar a evolução</CardContent></Card>
      ) : isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando dados...</div>
      ) : (
        <Tabs defaultValue="sintomas">
          <TabsList>
            <TabsTrigger value="sintomas" className="gap-1"><Activity className="h-3.5 w-3.5" /> Sintomas</TabsTrigger>
            <TabsTrigger value="exames" className="gap-1"><FlaskConical className="h-3.5 w-3.5" /> Exames</TabsTrigger>
            <TabsTrigger value="score" className="gap-1"><Target className="h-3.5 w-3.5" /> Score Clínico</TabsTrigger>
          </TabsList>

          <TabsContent value="sintomas" className="mt-4 space-y-4">
            {symptomChartData.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum relato diário registrado neste período</CardContent></Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução de Sintomas</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={symptomChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {Object.entries(AXIS_LABELS).map(([key, label], i) => (
                          <Line key={key} type="monotone" dataKey={key} name={label} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Pressão Arterial</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={symptomChartData.filter((d: any) => d.systolicBP)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="systolicBP" name="Sistólica" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                          <Line type="monotone" dataKey="diastolicBP" name="Diastólica" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Peso</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={symptomChartData.filter((d: any) => d.weight)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Bar dataKey="weight" name="Peso (kg)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="exames" className="mt-4 space-y-4">
            {examNames.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum exame registrado neste período</CardContent></Card>
            ) : (
              examNames.map(name => (
                <Card key={name}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{name}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={examChartData[name]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="value" name={name} stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="refMax" name="Ref. Máx" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="refMin" name="Ref. Mín" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="score" className="mt-4 space-y-4">
            {!timeline?.clinicalScore ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Dados insuficientes para calcular o score clínico</CardContent></Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">Score Clínico Global <Badge variant={timeline.clinicalScore.total >= 70 ? "default" : timeline.clinicalScore.total >= 40 ? "secondary" : "destructive"} className="text-xs">{timeline.clinicalScore.total}%</Badge></CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={timeline.clinicalScore.total >= 70 ? "#0d9488" : timeline.clinicalScore.total >= 40 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${timeline.clinicalScore.total}, 100`} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{timeline.clinicalScore.total}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Radar de Eixos</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                          <Radar name="Score" dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por Eixo</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(timeline.clinicalScore.axes).map(([key, val]: [string, any]) => {
                        const score = Number(val);
                        const status = score >= 7 ? "Ótimo" : score >= 5 ? "Mediano" : "Baixo";
                        const color = score >= 7 ? "text-green-600 bg-green-500/10" : score >= 5 ? "text-yellow-600 bg-yellow-500/10" : "text-red-600 bg-red-500/10";
                        return (
                          <div key={key} className={`p-3 rounded-lg ${color}`}>
                            <p className="text-xs font-medium opacity-70">{AXIS_LABELS[key] ?? key}</p>
                            <p className="text-xl font-bold">{score.toFixed(1)}</p>
                            <p className="text-[10px] font-medium">{status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
