import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, Plus, Clock, MapPin, User, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  consulta_integrativa: "Consulta Integrativa", consulta_estetica: "Consulta Estética",
  retorno: "Retorno", anamnese: "Anamnese", procedimento: "Procedimento",
  exame: "Exame", acompanhamento: "Acompanhamento",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  em_atendimento: { label: "Em Atendimento", color: "bg-yellow-100 text-yellow-800" },
  concluido: { label: "Concluído", color: "bg-emerald-100 text-emerald-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  no_show: { label: "Não Compareceu", color: "bg-gray-100 text-gray-800" },
  reagendado: { label: "Reagendado", color: "bg-purple-100 text-purple-800" },
};

export default function Agendamentos() {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const appointments = trpc.appointment.list.useQuery();
  const patients = trpc.patient.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.appointment.create.useMutation({
    onSuccess: () => { utils.appointment.list.invalidate(); setOpen(false); toast.success("Agendamento criado"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.appointment.update.useMutation({
    onSuccess: () => { utils.appointment.list.invalidate(); toast.success("Status atualizado"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!appointments.data) return [];
    if (filterStatus === "all") return appointments.data;
    return appointments.data.filter((a: any) => a.status === filterStatus);
  }, [appointments.data, filterStatus]);

  // Calendar helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const appointmentsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    (appointments.data || []).forEach((a: any) => {
      const d = new Date(a.scheduledAt);
      if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(a);
      }
    });
    return map;
  }, [appointments.data, currentMonth]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      patientId: Number(fd.get("patientId")),
      patientName: fd.get("patientName") as string || undefined,
      type: (fd.get("type") as any) || undefined,
      scheduledAt: fd.get("scheduledAt") as string,
      durationMinutes: Number(fd.get("durationMinutes")) || 30,
      location: fd.get("location") as string || undefined,
      notes: fd.get("notes") as string || undefined,
      reminderType: (fd.get("reminderType") as any) || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            Agendamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie consultas, procedimentos e retornos. Integração com calendário externo disponível.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <p className="text-xs text-muted-foreground">Selecione o paciente para este agendamento</p>
                <select name="patientId" required className="w-full border rounded px-3 py-2 mt-1 text-sm">
                  <option value="">Selecione...</option>
                  {(patients.data || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tipo de Consulta</Label>
                <p className="text-xs text-muted-foreground">Categoria do atendimento agendado</p>
                <select name="type" className="w-full border rounded px-3 py-2 mt-1 text-sm">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data e Hora</Label>
                  <p className="text-xs text-muted-foreground">Quando será o atendimento</p>
                  <Input name="scheduledAt" type="datetime-local" required className="mt-1" />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <p className="text-xs text-muted-foreground">Tempo estimado em minutos</p>
                  <Input name="durationMinutes" type="number" defaultValue={30} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Local</Label>
                <p className="text-xs text-muted-foreground">Endereço ou sala do atendimento</p>
                <Input name="location" placeholder="Sala 1, Clínica Central" className="mt-1" />
              </div>
              <div>
                <Label>Lembrete</Label>
                <p className="text-xs text-muted-foreground">Canal para envio de lembrete automático</p>
                <select name="reminderType" className="w-full border rounded px-3 py-2 mt-1 text-sm">
                  <option value="nenhum">Nenhum</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>
              <div>
                <Label>Observações</Label>
                <p className="text-xs text-muted-foreground">Notas internas sobre o agendamento</p>
                <Textarea name="notes" rows={2} className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={createMut.isPending}>
                {createMut.isPending ? "Salvando..." : "Criar Agendamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mini Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calendário</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm min-w-[140px] text-center">
                {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="font-semibold py-1 text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayAppts = appointmentsByDay[day] || [];
              const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();
              return (
                <div key={day} className={`p-1 rounded text-sm relative ${isToday ? "bg-blue-100 font-bold" : ""} ${dayAppts.length ? "bg-blue-50" : ""}`}>
                  {day}
                  {dayAppts.length > 0 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayAppts.slice(0, 3).map((_: any, j: number) => (
                        <div key={j} className="w-1 h-1 rounded-full bg-blue-500" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} agendamentos</Badge>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum agendamento encontrado</CardContent></Card>
        )}
        {filtered.map((a: any) => {
          const st = STATUS_LABELS[a.status] || { label: a.status, color: "bg-gray-100" };
          return (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{a.patientName || `Paciente #${a.patientId}`}</span>
                      <Badge className={st.color}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(a.scheduledAt).toLocaleDateString("pt-BR")} às {new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {a.durationMinutes}min
                      </span>
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.location}
                        </span>
                      )}
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </div>
                  <Select
                    value={a.status}
                    onValueChange={(v) => updateMut.mutate({ id: a.id, status: v as any })}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
