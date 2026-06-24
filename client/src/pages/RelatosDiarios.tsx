import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileHeart, Sun, Sunset, Moon, MessageSquare, Pill, Send, Clock, Wifi, WifiOff, CloudUpload, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function RelatosDiarios() {
  const { data: patients } = trpc.patient.list.useQuery();
  const createReport = trpc.dailyReport.create.useMutation();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappTurno, setWhatsappTurno] = useState<"manha" | "tarde" | "noite">("manha");
  const { isOnline, queueLength, syncing, syncQueue, addToQueue, pendingItems } = useOfflineSync();
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    period: "" as string,
    sleep: 5, energy: 5, mood: 5, focus: 5, concentration: 5, libido: 5, strength: 5, physicalActivity: 5,
    systolicBP: "", diastolicBP: "", weight: "", generalNotes: "",
  });

  const { data: reports, refetch: refetchReports } = trpc.dailyReport.list.useQuery(
    { patientId: Number(selectedPatient), limit: 20 },
    { enabled: !!selectedPatient }
  );

  const { data: medications } = trpc.medication.list.useQuery(
    { patientId: Number(selectedPatient) },
    { enabled: !!selectedPatient }
  );

  const selectedPatientData = (patients ?? []).find((p: any) => p.id === Number(selectedPatient));

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error("Selecione um paciente"); return; }
    if (!form.period) { toast.error("Selecione o período"); return; }

    const payload = {
      patientId: Number(selectedPatient),
      reportDate: form.reportDate,
      period: form.period as any,
      sleep: String(form.sleep), energy: String(form.energy), mood: String(form.mood),
      focus: String(form.focus), concentration: String(form.concentration), libido: String(form.libido),
      strength: String(form.strength), physicalActivity: String(form.physicalActivity),
      systolicBP: form.systolicBP ? Number(form.systolicBP) : undefined,
      diastolicBP: form.diastolicBP ? Number(form.diastolicBP) : undefined,
      weight: form.weight || undefined,
      generalNotes: form.generalNotes || undefined,
    };

    if (!isOnline) {
      const patientName = selectedPatientData?.name ?? 'Paciente';
      const periodLabel = form.period === 'manha' ? 'Manhã' : form.period === 'tarde' ? 'Tarde' : 'Noite';
      addToQueue({
        procedure: 'dailyReport.create',
        input: payload,
        timestamp: Date.now(),
        label: `${patientName} — ${periodLabel} (${form.reportDate})`,
      });
      toast.info("Sem conexão. Relato salvo localmente e será enviado quando a internet voltar.");
      return;
    }

    try {
      await createReport.mutateAsync(payload);
      toast.success("Relato registrado com sucesso!");
      refetchReports();
    } catch (e: any) {
      if (e.message?.includes('fetch') || e.message?.includes('network') || e.message?.includes('Failed')) {
        const patientName = selectedPatientData?.name ?? 'Paciente';
        const periodLabel = form.period === 'manha' ? 'Manhã' : form.period === 'tarde' ? 'Tarde' : 'Noite';
        addToQueue({
          procedure: 'dailyReport.create',
          input: payload,
          timestamp: Date.now(),
          label: `${patientName} — ${periodLabel} (${form.reportDate})`,
        });
        toast.info("Erro de rede. Relato salvo localmente para envio posterior.");
      } else {
        toast.error(e.message);
      }
    }
  };

  const periodIcon = { manha: Sun, tarde: Sunset, noite: Moon };
  const turnoLabel = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
  const turnoHorario = { manha: "07:00–08:00", tarde: "12:00–13:00", noite: "19:00–20:00" };

  const generateWhatsappMessage = (turno: "manha" | "tarde" | "noite") => {
    const name = selectedPatientData?.name ?? "Paciente";
    const label = turnoLabel[turno];
    const horario = turnoHorario[turno];
    // Filtrar medicações ativas do turno selecionado
    const qtyField = turno === "manha" ? "morningQty" : turno === "tarde" ? "afternoonQty" : "nightQty";
    const turnoMeds = (medications ?? []).filter((m: any) => m.isActive !== false && (m[qtyField] ?? 0) > 0);
    let medsText = "";
    if (turnoMeds.length > 0) {
      medsText = turnoMeds.map((m: any) => {
        const qty = m[qtyField];
        const dose = m.dosageValue ? ` (${m.dosageValue}${m.dosageUnit ? " " + m.dosageUnit : ""})` : "";
        return `  💊 ${m.name}${dose} — ${qty} comprimido${qty > 1 ? "s" : ""}`;
      }).join("\n");
      medsText = `\n*Suas medicações deste turno:*\n${medsText}\n`;
    } else {
      medsText = "\n📋 Confira suas medicações conforme prescrito.\n";
    }
    const portalLink = selectedPatientData?.accessToken
      ? `\n🔗 Acesse seu portal: ${window.location.origin}/portal/${selectedPatientData.accessToken}\n`
      : "";
    return `Olá ${name}, tudo bem? 😊\n\n` +
      `Lembrete de *medicação do turno da ${label}* (${horario}):\n` +
      medsText +
      portalLink +
      `\nApós tomar, registre como se sentiu:\n` +
      `• Nível de energia\n• Qualidade do sono\n• Humor geral\n• Qualquer reação ou desconforto\n\n` +
      `Seu acompanhamento é muito importante! 💚\n\n` +
      `Equipe PADCOM`;
  };

  const sendWhatsapp = (turno: "manha" | "tarde" | "noite") => {
    if (!selectedPatientData?.phone) { toast.error("Paciente sem telefone cadastrado"); return; }
    const phone = selectedPatientData.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(generateWhatsappMessage(turno));
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
    toast.success(`Lembrete de ${turnoLabel[turno]} enviado via WhatsApp`);
  };

  return (
    <div className="space-y-6">
      {/* Offline Status Banner */}
      {(!isOnline || queueLength > 0) && (
        <div className={`rounded-lg p-3 flex items-center justify-between ${isOnline ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-amber-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <span className="text-sm font-medium">
              {!isOnline ? 'Modo Offline' : 'Conexão restaurada'}
              {queueLength > 0 && ` — ${queueLength} relato${queueLength > 1 ? 's' : ''} na fila`}
            </span>
          </div>
          {isOnline && queueLength > 0 && (
            <Button size="sm" variant="outline" onClick={() => syncQueue()} disabled={syncing} className="gap-1.5">
              {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-primary" /> Relatos Diários
            {isOnline
              ? <Badge variant="outline" className="text-[10px] gap-1"><Wifi className="h-3 w-3 text-green-500" />Online</Badge>
              : <Badge variant="destructive" className="text-[10px] gap-1"><WifiOff className="h-3 w-3" />Offline</Badge>
            }
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registro diário de sintomas e sinais vitais — sono, energia, humor, foco, PA, peso. Dados alimentam o motor de scoring e evolução clínica. Funciona offline: relatos são salvos localmente e sincronizados quando a conexão voltar.</p>
        </div>
        {selectedPatient && selectedPatientData?.phone && (
          <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Lembrete WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Lembrete de Medicação por Turno</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Envie um lembrete de medicação para <strong>{selectedPatientData.name}</strong> no turno desejado.</p>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(["manha", "tarde", "noite"] as const).map(turno => {
                  const Icon = periodIcon[turno];
                  return (
                    <Card key={turno} className={`cursor-pointer transition-all hover:border-primary/50 ${whatsappTurno === turno ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setWhatsappTurno(turno)}>
                      <CardContent className="pt-4 text-center space-y-2">
                        <Icon className="h-8 w-8 mx-auto text-primary" />
                        <p className="font-medium text-sm">{turnoLabel[turno]}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{turnoHorario[turno]}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs whitespace-pre-line max-h-40 overflow-y-auto">
                {generateWhatsappMessage(whatsappTurno)}
              </div>
              <Button className="w-full mt-2 gap-1.5" onClick={() => { sendWhatsapp(whatsappTurno); setWhatsappOpen(false); }}>
                <Send className="h-4 w-4" /> Enviar via WhatsApp ({turnoLabel[whatsappTurno]})
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Novo Relato</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(patients ?? []).map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="flex gap-2">
                    {(["manha", "tarde", "noite"] as const).map(p => {
                      const Icon = periodIcon[p];
                      return (
                        <Button key={p} variant={form.period === p ? "default" : "outline"} size="sm" className="flex-1 gap-1 text-xs"
                          onClick={() => setForm(f => ({ ...f, period: p }))}>
                          <Icon className="h-3.5 w-3.5" />
                          {turnoLabel[p]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "sleep", label: "Sono" }, { key: "energy", label: "Energia" },
                  { key: "mood", label: "Humor" }, { key: "focus", label: "Foco" },
                  { key: "concentration", label: "Concentração" }, { key: "libido", label: "Libido" },
                  { key: "strength", label: "Força" }, { key: "physicalActivity", label: "Atividade Física" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between"><Label className="text-xs">{label}</Label><span className="text-xs font-semibold text-primary">{(form as any)[key]}</span></div>
                    <Slider value={[(form as any)[key]]} min={0} max={10} step={0.5} onValueChange={([v]) => setForm(f => ({ ...f, [key]: v }))} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label className="text-xs">PA Sistólica</Label><Input type="number" value={form.systolicBP} onChange={e => setForm(f => ({ ...f, systolicBP: e.target.value }))} placeholder="120" /></div>
                <div className="space-y-2"><Label className="text-xs">PA Diastólica</Label><Input type="number" value={form.diastolicBP} onChange={e => setForm(f => ({ ...f, diastolicBP: e.target.value }))} placeholder="80" /></div>
                <div className="space-y-2"><Label className="text-xs">Peso (kg)</Label><Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="75.0" /></div>
              </div>

              <div className="space-y-2"><Label className="text-xs">Observações Gerais</Label><Textarea value={form.generalNotes} onChange={e => setForm(f => ({ ...f, generalNotes: e.target.value }))} rows={2} /></div>
              <Button onClick={handleSubmit} className="w-full" disabled={createReport.isPending}>{createReport.isPending ? "Salvando..." : "Registrar Relato"}</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Pending offline items */}
          {pendingItems.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-amber-500" />
                  Pendentes Offline ({pendingItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingItems.map((item, idx) => (
                    <div key={`pending-${idx}`} className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.label ?? item.procedure}</span>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">Pendente</Badge>
                      </div>
                      <p className="text-muted-foreground text-[10px]">Salvo em {new Date(item.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico Recente</CardTitle></CardHeader>
            <CardContent>
              {!selectedPatient ? (
                <p className="text-sm text-muted-foreground text-center py-4">Selecione um paciente</p>
              ) : !reports?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum relato</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg border text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{r.reportDate}</span>
                        <Badge variant="outline" className="text-[10px]">{r.period === "manha" ? "Manhã" : r.period === "tarde" ? "Tarde" : "Noite"}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                        {r.sleep && <span>Sono: {r.sleep}</span>}
                        {r.energy && <span>Energia: {r.energy}</span>}
                        {r.focus && <span>Foco: {r.focus}</span>}
                        {r.libido && <span>Libido: {r.libido}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
