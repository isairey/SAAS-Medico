import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pill, AlertTriangle, ShieldAlert, Eye, Plus, Loader2, Search } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  contraindicacao: "bg-red-100 text-red-800 border-red-200",
  precaucao: "bg-orange-100 text-orange-800 border-orange-200",
  monitorar: "bg-blue-100 text-blue-800 border-blue-200",
  limiar_polifarmacia: "bg-purple-100 text-purple-800 border-purple-200",
};

const TYPE_LABELS: Record<string, string> = {
  contraindicacao: "Contraindicação",
  precaucao: "Precaução",
  monitorar: "Monitorar",
  limiar_polifarmacia: "Limiar Polifarmácia",
};

export default function Polifarmacia() {
  const [checkPatientId, setCheckPatientId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", medicationA: "", medicationB: "", interactionType: "monitorar" as string, description: "", threshold: "" });

  const rules = trpc.polypharmacy.rules.useQuery();
  const patients = trpc.patient.list.useQuery();
  const checkResult = trpc.polypharmacy.check.useQuery({ patientId: checkPatientId ?? 0 }, { enabled: !!checkPatientId });
  const createMut = trpc.polypharmacy.createRule.useMutation({
    onSuccess: () => { rules.refetch(); setDialogOpen(false); toast.success("Regra criada"); },
  });
  const updateMut = trpc.polypharmacy.updateRule.useMutation({
    onSuccess: () => { rules.refetch(); toast.success("Regra atualizada"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Polifarmácia</h1>
          <p className="text-sm text-muted-foreground mt-1">Regras de interação medicamentosa — detecta combinações perigosas e gera alertas automáticos para a equipe clínica</p>
          <p className="text-muted-foreground text-sm mt-1">Regras de interação medicamentosa e limiares de polifarmácia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regra de Interação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome da regra" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Select value={form.interactionType} onValueChange={v => setForm(f => ({ ...f, interactionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contraindicacao">Contraindicação</SelectItem>
                  <SelectItem value="precaucao">Precaução</SelectItem>
                  <SelectItem value="monitorar">Monitorar</SelectItem>
                  <SelectItem value="limiar_polifarmacia">Limiar Polifarmácia</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Medicamento A" value={form.medicationA} onChange={e => setForm(f => ({ ...f, medicationA: e.target.value }))} />
              {form.interactionType !== "limiar_polifarmacia" && (
                <Input placeholder="Medicamento B" value={form.medicationB} onChange={e => setForm(f => ({ ...f, medicationB: e.target.value }))} />
              )}
              {form.interactionType === "limiar_polifarmacia" && (
                <Input type="number" placeholder="Limiar (ex: 5)" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
              )}
              <Textarea placeholder="Descrição da interação" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Button className="w-full" disabled={!form.name || !form.medicationA || !form.description} onClick={() => {
                createMut.mutate({
                  name: form.name, medicationA: form.medicationA,
                  medicationB: form.medicationB || undefined,
                  interactionType: form.interactionType as any,
                  description: form.description,
                  threshold: form.threshold ? Number(form.threshold) : undefined,
                });
              }}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Check Patient */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Verificar Paciente</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <Select value={checkPatientId?.toString() ?? ""} onValueChange={v => setCheckPatientId(Number(v))}>
              <SelectTrigger className="w-[320px]"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
              <SelectContent>
                {(patients.data ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {checkPatientId && checkResult.data && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                <span className="text-sm font-medium">{checkResult.data.totalMeds} medicamentos ativos</span>
                {checkResult.data.totalMeds >= 5 && <Badge className="bg-red-100 text-red-700">Polifarmácia</Badge>}
              </div>
              {checkResult.data.alerts.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-1">Nenhuma interação detectada</p>
              ) : (
                <div className="space-y-2">
                  {checkResult.data.alerts.map((a: any, i: number) => (
                    <div key={i} className={`rounded-lg border p-3 ${a.severity === "grave" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
                      <div className="flex items-center gap-2">
                        {a.severity === "grave" ? <ShieldAlert className="h-4 w-4 text-red-600" /> : <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        <Badge className={TYPE_COLORS[a.type] ?? ""}>{TYPE_LABELS[a.type] ?? a.type}</Badge>
                        <Badge variant="outline" className={a.severity === "grave" ? "text-red-700" : "text-orange-700"}>{a.severity}</Badge>
                      </div>
                      <p className="text-sm mt-1">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Regras Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {rules.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (rules.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma regra cadastrada</p>
          ) : (
            <div className="space-y-2">
              {(rules.data ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.name}</span>
                      <Badge className={TYPE_COLORS[r.interactionType] ?? ""} variant="outline">{TYPE_LABELS[r.interactionType] ?? r.interactionType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.medicationA}{r.medicationB ? ` + ${r.medicationB}` : ""}{r.threshold ? ` (limiar: ${r.threshold})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <Switch checked={r.isActive !== false} onCheckedChange={v => updateMut.mutate({ id: r.id, isActive: v })} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
