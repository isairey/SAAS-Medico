import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, AlertTriangle, Clock, CheckCircle, Plus, Loader2, Stethoscope, ShieldCheck, HeartPulse } from "lucide-react";

const PROFILES = [
  { value: "todos", label: "Todos", icon: Users },
  { value: "enfermagem", label: "Enfermagem", icon: HeartPulse },
  { value: "medico_assistente", label: "Médico Assistente", icon: Stethoscope },
  { value: "supervisor", label: "Supervisor", icon: ShieldCheck },
  { value: "nao_atribuido", label: "Não Atribuído", icon: Clock },
];

const PRIORITY_COLORS: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, any> = {
  pendente: Clock,
  em_atendimento: Loader2,
  concluido: CheckCircle,
};

export default function FilaEquipe() {
  const [profileFilter, setProfileFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", assignedProfile: "nao_atribuido", priority: "normal", reason: "", notes: "" });

  const queue = trpc.teamQueue.list.useQuery({ profile: profileFilter === "todos" ? undefined : profileFilter });
  const patients = trpc.patient.list.useQuery();
  const createMut = trpc.teamQueue.create.useMutation({
    onSuccess: () => { queue.refetch(); setDialogOpen(false); toast.success("Item adicionado à fila"); },
  });
  const updateMut = trpc.teamQueue.update.useMutation({
    onSuccess: () => { queue.refetch(); toast.success("Atualizado"); },
  });

  const items = queue.data ?? [];
  const pendingCount = items.filter((i: any) => i.status === "pendente").length;
  const inProgressCount = items.filter((i: any) => i.status === "em_atendimento").length;
  const urgentCount = items.filter((i: any) => i.priority === "urgente" && i.status !== "concluido").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fila da Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de atendimentos — pacientes aguardando, em atendimento e finalizados. Atribua profissionais e acompanhe prioridades.</p>
          <p className="text-muted-foreground text-sm mt-1">Gestão de atendimentos segmentada por perfil profissional</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar à Fila</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.patientId} onValueChange={v => setForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Paciente" /></SelectTrigger>
                <SelectContent>
                  {(patients.data ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.assignedProfile} onValueChange={v => setForm(f => ({ ...f, assignedProfile: v }))}>
                <SelectTrigger><SelectValue placeholder="Perfil" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enfermagem">Enfermagem</SelectItem>
                  <SelectItem value="medico_assistente">Médico Assistente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="nao_atribuido">Não Atribuído</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Motivo" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              <Textarea placeholder="Observações..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full" disabled={!form.patientId || !form.reason} onClick={() => {
                createMut.mutate({
                  patientId: Number(form.patientId), assignedProfile: form.assignedProfile as any,
                  priority: form.priority as any, reason: form.reason, notes: form.notes || undefined,
                });
              }}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
          <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Loader2 className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{inProgressCount}</p><p className="text-xs text-muted-foreground">Em Atendimento</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-2xl font-bold">{urgentCount}</p><p className="text-xs text-muted-foreground">Urgentes</p></div>
        </CardContent></Card>
      </div>

      {/* Profile Filter */}
      <div className="flex gap-2 flex-wrap">
        {PROFILES.map(p => {
          const Icon = p.icon;
          const isActive = profileFilter === p.value;
          return (
            <Button key={p.value} variant={isActive ? "default" : "outline"} size="sm" onClick={() => setProfileFilter(p.value)}>
              <Icon className="h-3.5 w-3.5 mr-1" /> {p.label}
            </Button>
          );
        })}
      </div>

      {/* Queue Items */}
      {queue.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum item na fila</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const StatusIcon = STATUS_ICONS[item.status] ?? Clock;
            const patient = (patients.data ?? []).find((p: any) => p.id === item.patientId);
            return (
              <Card key={item.id} className={item.priority === "urgente" ? "border-red-200 bg-red-50/30" : item.priority === "alta" ? "border-orange-200 bg-orange-50/20" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${item.status === "concluido" ? "text-green-500" : item.status === "em_atendimento" ? "text-blue-500 animate-spin" : "text-yellow-500"}`} />
                        <span className="font-medium">{patient?.name ?? `Paciente #${item.patientId}`}</span>
                        <Badge className={PRIORITY_COLORS[item.priority] ?? ""}>{item.priority}</Badge>
                        <Badge variant="outline" className="text-xs">{item.assignedProfile?.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                      {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                      <p className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex gap-1">
                      {item.status === "pendente" && (
                        <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: item.id, status: "em_atendimento" })}>
                          Iniciar
                        </Button>
                      )}
                      {item.status === "em_atendimento" && (
                        <Button size="sm" onClick={() => updateMut.mutate({ id: item.id, status: "concluido" })}>
                          Concluir
                        </Button>
                      )}
                      {item.status !== "concluido" && (
                        <Select value={item.assignedProfile} onValueChange={v => updateMut.mutate({ id: item.id, assignedProfile: v as any })}>
                          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enfermagem">Enfermagem</SelectItem>
                            <SelectItem value="medico_assistente">Médico Assist.</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
