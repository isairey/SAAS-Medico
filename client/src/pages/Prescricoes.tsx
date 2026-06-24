import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Prescricoes() {
  const { data: patients } = trpc.patient.list.useQuery();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const { data: prescriptions } = trpc.prescription.list.useQuery({ patientId: Number(selectedPatient) }, { enabled: !!selectedPatient });
  const createMutation = trpc.prescription.create.useMutation();
  const updateMutation = trpc.prescription.update.useMutation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", via: "", form: "", dosage: "", frequency: "", duration: "", objective: "" });
  const [components, setComponents] = useState<{ componentName: string; dosage: string; unit: string }[]>([]);

  const handleCreate = async () => {
    if (!selectedPatient || !form.code || !form.name) { toast.error("Preencha os campos obrigatórios"); return; }
    try {
      await createMutation.mutateAsync({ patientId: Number(selectedPatient), ...form, components });
      toast.success("Prescrição criada!");
      utils.prescription.list.invalidate();
      setOpen(false);
      setForm({ code: "", name: "", via: "", form: "", dosage: "", frequency: "", duration: "", objective: "" });
      setComponents([]);
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleStatus = async (id: number, current: string) => {
    const next = current === "ativa" ? "pausada" : "ativa";
    await updateMutation.mutateAsync({ id, status: next as any });
    utils.prescription.list.invalidate();
    toast.success(`Prescrição ${next}`);
  };

  const statusColor: Record<string, string> = { ativa: "bg-green-500/10 text-green-700", pausada: "bg-yellow-500/10 text-yellow-700", encerrada: "bg-gray-500/10 text-gray-600" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Pill className="h-6 w-6 text-primary" /> Prescrições</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie fórmulas magistrais, medicamentos e componentes prescritos — cada prescrição é validada pelo Score Competência Reguladora</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2" disabled={!selectedPatient}><Plus className="h-4 w-4" /> Nova Prescrição</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Prescrição</DialogTitle>
              <p className="text-sm text-muted-foreground">Crie uma prescrição com fórmula, componentes e posologia. O nível de validação será determinado pelo Score Regulatório dos itens.</p>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">Código *</Label><p className="text-xs text-muted-foreground">Identificador único da fórmula — ex: FRM-001, PRO-042</p><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FRM-001" /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Nome da Fórmula *</Label><p className="text-xs text-muted-foreground">Nome descritivo da prescrição para identificação rápida</p><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da fórmula" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">Via de Administração</Label><p className="text-xs text-muted-foreground">Como o paciente vai tomar — oral, IV, IM, tópico</p><Input value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))} placeholder="Oral" /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Forma Farmacêutica</Label><p className="text-xs text-muted-foreground">Cápsula, comprimido, solução, creme, etc.</p><Input value={form.form} onChange={e => setForm(f => ({ ...f, form: e.target.value }))} placeholder="Cápsula" /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Dosagem Total</Label><p className="text-xs text-muted-foreground">Dose por unidade — ex: 500mg, 10ml</p><Input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="500mg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">Frequência / Posologia</Label><p className="text-xs text-muted-foreground">Quantas vezes ao dia e em qual horário</p><Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="2x ao dia" /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Duração do Tratamento</Label><p className="text-xs text-muted-foreground">Período total de uso — ex: 30 dias, 3 meses, contínuo</p><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30 dias" /></div>
              </div>
              <div className="space-y-1"><Label className="text-sm font-semibold">Objetivo Terapêutico</Label><p className="text-xs text-muted-foreground">Finalidade clínica da prescrição — ex: redução de estresse oxidativo, suporte mitocondrial</p><Textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} /></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label>Componentes</Label><Button variant="outline" size="sm" onClick={() => setComponents(c => [...c, { componentName: "", dosage: "", unit: "" }])}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button></div>
                {components.map((comp, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1"><Label className="text-xs">Componente</Label><Input value={comp.componentName} onChange={e => { const c = [...components]; c[i].componentName = e.target.value; setComponents(c); }} placeholder="Nome" /></div>
                    <div className="w-20 space-y-1"><Label className="text-xs">Dose</Label><Input value={comp.dosage} onChange={e => { const c = [...components]; c[i].dosage = e.target.value; setComponents(c); }} placeholder="100" /></div>
                    <div className="w-16 space-y-1"><Label className="text-xs">Un.</Label><Input value={comp.unit} onChange={e => { const c = [...components]; c[i].unit = e.target.value; setComponents(c); }} placeholder="mg" /></div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setComponents(c => c.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? "Salvando..." : "Criar Prescrição"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-xs">
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
          <SelectContent>{(patients ?? []).map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {!selectedPatient ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Selecione um paciente para ver as prescrições</CardContent></Card>
      ) : !prescriptions?.length ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhuma prescrição cadastrada</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p: any) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    <Badge variant="outline" className={`text-[10px] ${statusColor[p.status] ?? ""}`}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.code} | {p.dosage} | {p.frequency} | {p.duration}</p>
                  {p.objective && <p className="text-xs text-muted-foreground mt-1">{p.objective}</p>}
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleStatus(p.id, p.status)}>
                  {p.status === "ativa" ? "Pausar" : "Ativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
