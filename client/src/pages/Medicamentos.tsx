import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pill, Plus, Sun, Sunset, Moon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MedicamentosPage() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dosageUnit: "mg", dosageValue: "", associatedDisease: "", morningQty: 0, afternoonQty: 0, nightQty: 0, notes: "" });

  const patients = trpc.patient.list.useQuery();
  const meds = trpc.medication.list.useQuery({ patientId: selectedPatient! }, { enabled: !!selectedPatient });
  const createMed = trpc.medication.create.useMutation({ onSuccess: () => { meds.refetch(); setOpen(false); resetForm(); toast.success("Medicamento adicionado"); } });
  const updateMed = trpc.medication.update.useMutation({ onSuccess: () => { meds.refetch(); toast.success("Atualizado"); } });
  const deleteMed = trpc.medication.delete.useMutation({ onSuccess: () => { meds.refetch(); toast.success("Removido"); } });

  function resetForm() { setForm({ name: "", dosageUnit: "mg", dosageValue: "", associatedDisease: "", morningQty: 0, afternoonQty: 0, nightQty: 0, notes: "" }); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medicamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogo de medicamentos e fórmulas disponíveis — base para prescrições e Score Competência Reguladora</p>
          <p className="text-muted-foreground text-sm mt-1">Matriz dosada por período — manhã, tarde e noite</p>
        </div>
        {selectedPatient && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Medicamento</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Levotiroxina" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Dosagem</Label><Input value={form.dosageValue} onChange={e => setForm(f => ({ ...f, dosageValue: e.target.value }))} placeholder="50" /></div>
                  <div className="grid gap-2"><Label>Unidade</Label>
                    <Select value={form.dosageUnit} onValueChange={v => setForm(f => ({ ...f, dosageUnit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="mg">mg</SelectItem><SelectItem value="mcg">mcg</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="UI">UI</SelectItem><SelectItem value="gotas">gotas</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2"><Label>Doença associada</Label><Input value={form.associatedDisease} onChange={e => setForm(f => ({ ...f, associatedDisease: e.target.value }))} placeholder="Ex: Hipotireoidismo" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2 text-center"><Label className="flex items-center justify-center gap-1"><Sun className="w-4 h-4 text-amber-500" /> Manhã</Label><Input type="number" min={0} value={form.morningQty} onChange={e => setForm(f => ({ ...f, morningQty: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="grid gap-2 text-center"><Label className="flex items-center justify-center gap-1"><Sunset className="w-4 h-4 text-orange-500" /> Tarde</Label><Input type="number" min={0} value={form.afternoonQty} onChange={e => setForm(f => ({ ...f, afternoonQty: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="grid gap-2 text-center"><Label className="flex items-center justify-center gap-1"><Moon className="w-4 h-4 text-indigo-500" /> Noite</Label><Input type="number" min={0} value={form.nightQty} onChange={e => setForm(f => ({ ...f, nightQty: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={() => { if (!form.name) return toast.error("Nome obrigatório"); createMed.mutate({ ...form, patientId: selectedPatient! }); }} disabled={createMed.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Selecione o Paciente</Label>
        <Select value={selectedPatient?.toString() ?? ""} onValueChange={v => setSelectedPatient(parseInt(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Escolha um paciente" /></SelectTrigger>
          <SelectContent>{patients.data?.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedPatient && meds.data && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5" /> Medicamentos Ativos</CardTitle></CardHeader>
          <CardContent>
            {meds.data.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum medicamento cadastrado.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="py-3 px-2 font-medium">Medicamento</th>
                    <th className="py-3 px-2 font-medium">Dosagem</th>
                    <th className="py-3 px-2 font-medium">Doença</th>
                    <th className="py-3 px-2 font-medium text-center"><Sun className="w-4 h-4 mx-auto text-amber-500" /></th>
                    <th className="py-3 px-2 font-medium text-center"><Sunset className="w-4 h-4 mx-auto text-orange-500" /></th>
                    <th className="py-3 px-2 font-medium text-center"><Moon className="w-4 h-4 mx-auto text-indigo-500" /></th>
                    <th className="py-3 px-2 font-medium text-center">Total/dia</th>
                    <th className="py-3 px-2 font-medium">Ativo</th>
                    <th className="py-3 px-2"></th>
                  </tr></thead>
                  <tbody>
                    {meds.data.map((m: any) => (
                      <tr key={m.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 font-medium">{m.name}</td>
                        <td className="py-3 px-2">{m.dosageValue ? `${m.dosageValue} ${m.dosageUnit}` : "—"}</td>
                        <td className="py-3 px-2 text-muted-foreground">{m.associatedDisease || "—"}</td>
                        <td className="py-3 px-2 text-center"><Badge variant="outline">{m.morningQty}</Badge></td>
                        <td className="py-3 px-2 text-center"><Badge variant="outline">{m.afternoonQty}</Badge></td>
                        <td className="py-3 px-2 text-center"><Badge variant="outline">{m.nightQty}</Badge></td>
                        <td className="py-3 px-2 text-center font-semibold">{m.totalDaily}</td>
                        <td className="py-3 px-2"><Switch checked={m.isActive} onCheckedChange={v => updateMed.mutate({ id: m.id, isActive: v })} /></td>
                        <td className="py-3 px-2"><Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover?")) deleteMed.mutate({ id: m.id }); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
