import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SessoesPage() {
  const { data: patients } = trpc.patient.list.useQuery();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const { data: sessions } = trpc.followUp.list.useQuery({ patientId: Number(selectedPatient) }, { enabled: !!selectedPatient });
  const createMutation = trpc.followUp.create.useMutation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().split("T")[0],
    sessionType: "presencial" as string,
    clinicalScore: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!selectedPatient) { toast.error("Selecione um paciente"); return; }
    try {
      await createMutation.mutateAsync({
        patientId: Number(selectedPatient),
        sessionDate: form.sessionDate,
        sessionType: form.sessionType as any,
        clinicalScore: form.clinicalScore || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Sessão registrada!");
      utils.followUp.list.invalidate();
      setOpen(false);
      setForm({ sessionDate: new Date().toISOString().split("T")[0], sessionType: "presencial", clinicalScore: "", notes: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  const typeLabel: Record<string, string> = { presencial: "Presencial", online: "Online", pre_avaliacao: "Pré-Avaliação", retorno_30: "Retorno 30d", retorno_60: "Retorno 60d", retorno_90: "Retorno 90d" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><CalendarCheck className="h-6 w-6 text-primary" /> Sessões</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento longitudinal do paciente — registre consultas presenciais, online e retornos em 30/60/90 dias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2" disabled={!selectedPatient}><Plus className="h-4 w-4" /> Nova Sessão</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Sessão de Acompanhamento</DialogTitle>
              <p className="text-sm text-muted-foreground">Registre uma consulta ou retorno. O score clínico permite acompanhar a evolução do paciente ao longo do tempo.</p>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">Data da Sessão</Label><p className="text-xs text-muted-foreground">Data em que a consulta ou retorno ocorreu</p><Input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Tipo de Sessão</Label><p className="text-xs text-muted-foreground">Modalidade do atendimento — presencial, online ou retorno programado</p>
                  <Select value={form.sessionType} onValueChange={v => setForm(f => ({ ...f, sessionType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabel).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-sm font-semibold">Score Clínico</Label><p className="text-xs text-muted-foreground">Nota de 0 a 10 representando o estado geral do paciente nesta sessão</p><Input value={form.clinicalScore} onChange={e => setForm(f => ({ ...f, clinicalScore: e.target.value }))} placeholder="7.5" /></div>
              <div className="space-y-1"><Label className="text-sm font-semibold">Observações Clínicas</Label><p className="text-xs text-muted-foreground">Notas livres sobre o atendimento — queixas, evolução, ajustes de conduta</p><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Registrar Sessão</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="max-w-xs"><Select value={selectedPatient} onValueChange={setSelectedPatient}><SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger><SelectContent>{(patients ?? []).map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent></Select></div>
      {!selectedPatient ? <Card><CardContent className="p-12 text-center text-muted-foreground">Selecione um paciente</CardContent></Card> : !sessions?.length ? <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhuma sessão registrada</CardContent></Card> : (
        <div className="space-y-2">{sessions.map((s: any) => (
          <Card key={s.id}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-medium text-sm">{new Date(s.sessionDate).toLocaleDateString("pt-BR")}</p><p className="text-xs text-muted-foreground">{typeLabel[s.sessionType] ?? s.sessionType} | Score: {s.clinicalScore ?? "N/A"}</p>{s.notes && <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{s.notes}</p>}</div>
            <Badge variant="outline" className="text-xs">{s.status}</Badge>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
