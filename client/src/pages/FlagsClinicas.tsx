import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  aprovado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejeitado: "bg-red-100 text-red-800 border-red-200",
};

const typeIcons: Record<string, any> = {
  validation: <ShieldAlert className="w-4 h-4 text-red-500" />,
  warning: <Clock className="w-4 h-4 text-amber-500" />,
  info: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
};

export default function FlagsClinicasPage() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [validationNotes, setValidationNotes] = useState("");

  const patients = trpc.patient.list.useQuery();
  const flags = trpc.clinicalFlag.list.useQuery({ patientId: selectedPatient! }, { enabled: !!selectedPatient });
  const validateFlag = trpc.clinicalFlag.validate.useMutation({
    onSuccess: () => { flags.refetch(); setValidatingId(null); setValidationNotes(""); toast.success("Flag validada"); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Flags Clínicas</h1>
        <p className="text-sm text-muted-foreground mt-1">Marcadores clínicos do paciente — alergias, condições, riscos e observações importantes para a equipe</p>
        <p className="text-muted-foreground text-sm mt-1">Validação humana de condições críticas detectadas pelo motor de score</p>
      </div>

      <div className="grid gap-2">
        <Label>Selecione o Paciente</Label>
        <Select value={selectedPatient?.toString() ?? ""} onValueChange={v => setSelectedPatient(parseInt(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Escolha um paciente" /></SelectTrigger>
          <SelectContent>{patients.data?.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedPatient && flags.data && (
        <div className="space-y-4">
          {flags.data.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma flag clínica encontrada para este paciente.</CardContent></Card>
          ) : flags.data.map((flag: any) => (
            <Card key={flag.id} className="border-l-4" style={{ borderLeftColor: flag.flagType === "validation" ? "#ef4444" : flag.flagType === "warning" ? "#f59e0b" : "#3b82f6" }}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {typeIcons[flag.flagType]}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{flag.code}</span>
                        <Badge variant="outline" className={statusColors[flag.status]}>{flag.status}</Badge>
                        <Badge variant="outline" className="text-xs">{flag.flagType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                      {flag.source && <p className="text-xs text-muted-foreground mt-1">Fonte: {flag.source} {flag.sourceId ? `#${flag.sourceId}` : ""}</p>}
                      {flag.notes && <p className="text-xs mt-2 bg-muted/50 p-2 rounded">{flag.notes}</p>}
                    </div>
                  </div>
                  {flag.status === "pendente" && (
                    <div className="flex gap-2 shrink-0">
                      <Dialog open={validatingId === flag.id} onOpenChange={open => { if (!open) setValidatingId(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setValidatingId(flag.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Validar Flag: {flag.code}</DialogTitle></DialogHeader>
                          <div className="grid gap-4">
                            <p className="text-sm text-muted-foreground">{flag.description}</p>
                            <div className="grid gap-2"><Label>Observações da validação</Label><Textarea value={validationNotes} onChange={e => setValidationNotes(e.target.value)} placeholder="Notas opcionais..." /></div>
                            <div className="flex gap-2">
                              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => validateFlag.mutate({ id: flag.id, status: "aprovado", notes: validationNotes })}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                              </Button>
                              <Button variant="destructive" className="flex-1" onClick={() => validateFlag.mutate({ id: flag.id, status: "rejeitado", notes: validationNotes })}>
                                <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
