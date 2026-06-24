import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, Brain, Flame, Apple, Moon, Dumbbell, Zap, Plus, Trash2, Loader2 } from "lucide-react";

const SYSTEMS = [
  { value: "cardiovascular", label: "Cardiovascular", icon: Heart, color: "text-red-500" },
  { value: "metabolico", label: "Metabólico", icon: Flame, color: "text-orange-500" },
  { value: "endocrino", label: "Endócrino", icon: Zap, color: "text-yellow-500" },
  { value: "digestivo", label: "Digestivo", icon: Apple, color: "text-green-500" },
  { value: "neuro_humor", label: "Neuro/Humor", icon: Brain, color: "text-purple-500" },
  { value: "sono", label: "Sono", icon: Moon, color: "text-indigo-500" },
  { value: "atividade_fisica", label: "Atividade Física", icon: Dumbbell, color: "text-cyan-500" },
] as const;

type SystemType = typeof SYSTEMS[number]["value"];

const STATUS_COLORS: Record<string, string> = {
  diagnosticado: "bg-red-100 text-red-800 border-red-200",
  potencial: "bg-yellow-100 text-yellow-800 border-yellow-200",
  descartado: "bg-gray-100 text-gray-600 border-gray-200",
  em_investigacao: "bg-blue-100 text-blue-800 border-blue-200",
};

const SEVERITY_COLORS: Record<string, string> = {
  leve: "bg-green-100 text-green-700",
  moderado: "bg-yellow-100 text-yellow-700",
  grave: "bg-red-100 text-red-700",
};

export default function SistemasClinico() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ system: "" as string, conditionCode: "", conditionName: "", status: "potencial" as string, severity: "leve" as string, notes: "", diagnosedAt: "" });

  const patients = trpc.patient.list.useQuery();
  const systems = trpc.clinicalSystem.list.useQuery({ patientId: selectedPatientId ?? 0 }, { enabled: !!selectedPatientId });
  const createMut = trpc.clinicalSystem.create.useMutation({
    onSuccess: () => { systems.refetch(); setDialogOpen(false); toast.success("Condição adicionada"); resetForm(); },
  });
  const deleteMut = trpc.clinicalSystem.delete.useMutation({
    onSuccess: () => { systems.refetch(); toast.success("Condição removida"); },
  });
  const updateMut = trpc.clinicalSystem.update.useMutation({
    onSuccess: () => { systems.refetch(); toast.success("Condição atualizada"); },
  });

  const resetForm = () => setForm({ system: "", conditionCode: "", conditionName: "", status: "potencial", severity: "leve", notes: "", diagnosedAt: "" });

  const grouped = SYSTEMS.map(s => ({
    ...s,
    conditions: (systems.data ?? []).filter((c: any) => c.system === s.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painéis por Sistema Clínico</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão por sistema orgânico — endócrino, imunológico, cardiovascular, etc. Cada painel agrupa exames e condutas relacionadas.</p>
          <p className="text-muted-foreground text-sm mt-1">Visão matricial das condições do paciente por sistema orgânico</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedPatientId?.toString() ?? ""} onValueChange={v => setSelectedPatientId(Number(v))}>
          <SelectTrigger className="w-[320px]"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
          <SelectContent>
            {(patients.data ?? []).map((p: any) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPatientId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Condição</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Condição Clínica</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.system} onValueChange={v => setForm(f => ({ ...f, system: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sistema" /></SelectTrigger>
                  <SelectContent>
                    {SYSTEMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Código (ex: HAS, DM2)" value={form.conditionCode} onChange={e => setForm(f => ({ ...f, conditionCode: e.target.value }))} />
                <Input placeholder="Nome da condição" value={form.conditionName} onChange={e => setForm(f => ({ ...f, conditionName: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagnosticado">Diagnosticado</SelectItem>
                      <SelectItem value="potencial">Potencial</SelectItem>
                      <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input type="date" value={form.diagnosedAt} onChange={e => setForm(f => ({ ...f, diagnosedAt: e.target.value }))} />
                <Textarea placeholder="Observações..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <Button className="w-full" disabled={!form.system || !form.conditionCode || !form.conditionName} onClick={() => {
                  if (!selectedPatientId) return;
                  createMut.mutate({ patientId: selectedPatientId, system: form.system as SystemType, conditionCode: form.conditionCode, conditionName: form.conditionName, status: form.status as any, severity: form.severity as any, notes: form.notes || undefined, diagnosedAt: form.diagnosedAt || undefined });
                }}>
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedPatientId ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Selecione um paciente para visualizar os painéis por sistema clínico</CardContent></Card>
      ) : systems.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {grouped.map(sys => {
            const Icon = sys.icon;
            return (
              <Card key={sys.value} className={`${sys.conditions.length > 0 ? "border-l-4" : ""}`} style={sys.conditions.length > 0 ? { borderLeftColor: sys.color.includes("red") ? "#ef4444" : sys.color.includes("orange") ? "#f97316" : sys.color.includes("yellow") ? "#eab308" : sys.color.includes("green") ? "#22c55e" : sys.color.includes("purple") ? "#a855f7" : sys.color.includes("indigo") ? "#6366f1" : "#06b6d4" } : {}}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className={`h-4 w-4 ${sys.color}`} />
                    {sys.label}
                    {sys.conditions.length > 0 && <Badge variant="secondary" className="ml-auto text-xs">{sys.conditions.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sys.conditions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma condição registrada</p>
                  ) : (
                    sys.conditions.map((c: any) => (
                      <div key={c.id} className="rounded-md border p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{c.conditionName}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteMut.mutate({ id: c.id })}>
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</Badge>
                          {c.severity && <Badge className={`text-[10px] ${SEVERITY_COLORS[c.severity] ?? ""}`}>{c.severity}</Badge>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{c.conditionCode}</span>
                        </div>
                        {c.status !== "descartado" && (
                          <Select value={c.status} onValueChange={v => updateMut.mutate({ id: c.id, status: v as any })}>
                            <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diagnosticado">Diagnosticado</SelectItem>
                              <SelectItem value="potencial">Potencial</SelectItem>
                              <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                              <SelectItem value="descartado">Descartado</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
