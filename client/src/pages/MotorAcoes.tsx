import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Cog, Plus, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MotorAcoesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ triggerCode: "", triggerCondition: "", actionType: "alerta" as string, actionValue: "", priority: 0 });

  const actions = trpc.scoring.motorActions.useQuery();
  const bands = trpc.scoring.bands.useQuery();
  const createAction = trpc.scoring.createMotorAction.useMutation({ onSuccess: () => { actions.refetch(); setOpen(false); toast.success("Ação criada"); } });
  const updateAction = trpc.scoring.updateMotorAction.useMutation({ onSuccess: () => { actions.refetch(); toast.success("Atualizado"); } });

  const actionTypeLabels: Record<string, string> = { formula: "Fórmula", exame: "Exame", encaminhamento: "Encaminhamento", alerta: "Alerta", painel: "Painel" };
  const actionTypeColors: Record<string, string> = { formula: "bg-purple-100 text-purple-800", exame: "bg-blue-100 text-blue-800", encaminhamento: "bg-amber-100 text-amber-800", alerta: "bg-red-100 text-red-800", painel: "bg-slate-100 text-slate-800" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Motor de Ações</h1>
          <p className="text-sm text-muted-foreground mt-1">Regras automáticas de scoring — pesos por categoria, faixas de classificação e gatilhos de alerta</p>
          <p className="text-muted-foreground text-sm mt-1">Regras automáticas: quando um código é acionado, dispara ações configuráveis</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ação</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Ação do Motor</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2"><Label>Código Trigger</Label><Input value={form.triggerCode} onChange={e => setForm(f => ({ ...f, triggerCode: e.target.value }))} placeholder="Ex: CARD_DOEN_HASA" /></div>
              <div className="grid gap-2"><Label>Condição</Label><Input value={form.triggerCondition} onChange={e => setForm(f => ({ ...f, triggerCondition: e.target.value }))} placeholder="Ex: resposta = sim" /></div>
              <div className="grid gap-2"><Label>Tipo de Ação</Label>
                <Select value={form.actionType} onValueChange={v => setForm(f => ({ ...f, actionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formula">Fórmula</SelectItem>
                    <SelectItem value="exame">Exame</SelectItem>
                    <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                    <SelectItem value="alerta">Alerta</SelectItem>
                    <SelectItem value="painel">Painel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Valor da Ação</Label><Input value={form.actionValue} onChange={e => setForm(f => ({ ...f, actionValue: e.target.value }))} placeholder="Ex: Solicitar painel cardiometabólico" /></div>
              <div className="grid gap-2"><Label>Prioridade (0-10)</Label><Input type="number" min={0} max={10} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} /></div>
              <Button onClick={() => { if (!form.triggerCode || !form.actionValue) return toast.error("Preencha os campos obrigatórios"); createAction.mutate(form as any); }}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scoring Bands */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5" /> Faixas de Score</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {bands.data?.map((b: any) => (
              <div key={b.id} className="rounded-lg border p-4 text-center" style={{ borderColor: b.color, backgroundColor: `${b.color}10` }}>
                <div className="text-lg font-bold" style={{ color: b.color }}>{b.name}</div>
                <div className="text-sm text-muted-foreground">{b.minScore} — {b.maxScore} pts</div>
                <p className="text-xs text-muted-foreground mt-2">{b.description}</p>
                {Array.isArray(b.actions) && b.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {(b.actions as string[]).slice(0, 3).map((a, i) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motor Actions List */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Cog className="w-5 h-5" /> Ações Configuradas</CardTitle></CardHeader>
        <CardContent>
          {!actions.data || actions.data.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma ação configurada. Clique em "Nova Ação" para começar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left">
                  <th className="py-3 px-2 font-medium">Trigger</th>
                  <th className="py-3 px-2 font-medium">Condição</th>
                  <th className="py-3 px-2 font-medium">Tipo</th>
                  <th className="py-3 px-2 font-medium">Ação</th>
                  <th className="py-3 px-2 font-medium">Prioridade</th>
                  <th className="py-3 px-2 font-medium">Ativo</th>
                </tr></thead>
                <tbody>
                  {actions.data.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono text-xs">{a.triggerCode}</td>
                      <td className="py-3 px-2 text-muted-foreground">{a.triggerCondition}</td>
                      <td className="py-3 px-2"><Badge className={actionTypeColors[a.actionType]}>{actionTypeLabels[a.actionType]}</Badge></td>
                      <td className="py-3 px-2">{a.actionValue}</td>
                      <td className="py-3 px-2 text-center">{a.priority}</td>
                      <td className="py-3 px-2"><Switch checked={a.isActive} onCheckedChange={v => updateAction.mutate({ id: a.id, isActive: v })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
