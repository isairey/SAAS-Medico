import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bell, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AlertasPage() {
  const { data: alerts, isLoading } = trpc.alert.list.useQuery();
  const updateMutation = trpc.alert.update.useMutation();
  const utils = trpc.useUtils();
  const [responseText, setResponseText] = useState<Record<number, string>>({});

  const handleResolve = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, status: "resolvido", resolutionNotes: responseText[id] || undefined });
      utils.alert.list.invalidate();
      toast.success("Alerta resolvido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDismiss = async (id: number) => {
    await updateMutation.mutateAsync({ id, status: "descartado" });
    utils.alert.list.invalidate();
    toast.info("Alerta descartado");
  };

  const priorityConfig: Record<string, { color: string; icon: any }> = {
    critica: { color: "bg-red-500/10 text-red-700 border-red-200", icon: XCircle },
    alta: { color: "bg-orange-500/10 text-orange-700 border-orange-200", icon: AlertTriangle },
    moderada: { color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", icon: AlertTriangle },
    baixa: { color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: Bell },
  };

  const active = (alerts ?? []).filter((a: any) => a.status === "ativo");
  const resolved = (alerts ?? []).filter((a: any) => a.status === "resolvido");
  const dismissed = (alerts ?? []).filter((a: any) => a.status === "descartado");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Motor de Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">Alertas automáticos gerados pelo motor clínico — interações medicamentosas, scores críticos, exames fora da faixa, prazos vencidos</p>
      </div>

      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos" className="gap-1.5">Ativos <Badge variant="secondary" className="text-[10px] ml-1">{active.length}</Badge></TabsTrigger>
          <TabsTrigger value="resolvidos">Resolvidos ({resolved.length})</TabsTrigger>
          <TabsTrigger value="descartados">Descartados ({dismissed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-4 space-y-3">
          {active.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum alerta ativo</CardContent></Card> : active.map((a: any) => {
            const cfg = priorityConfig[a.priority] ?? priorityConfig.baixa;
            const Icon = cfg.icon;
            return (
              <Card key={a.id} className="border-l-4" style={{ borderLeftColor: a.priority === "critica" ? "#ef4444" : a.priority === "alta" ? "#f97316" : a.priority === "moderada" ? "#eab308" : "#3b82f6" }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{a.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    </div>
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground mb-3">{a.description}</p>}
                  <div className="space-y-2">
                    <Textarea placeholder="Resposta da consultora..." value={responseText[a.id] ?? ""} onChange={e => setResponseText(r => ({ ...r, [a.id]: e.target.value }))} rows={2} className="text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" onClick={() => handleResolve(a.id)}><CheckCircle className="h-3.5 w-3.5" /> Resolver</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDismiss(a.id)}>Descartar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="resolvidos" className="mt-4 space-y-2">
          {resolved.map((a: any) => (
            <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
              <div><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.category} | {new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>{a.resolutionNotes && <p className="text-xs text-green-700 mt-1">Resposta: {a.resolutionNotes}</p>}</div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 text-xs">Resolvido</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="descartados" className="mt-4 space-y-2">
          {dismissed.map((a: any) => (
            <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
              <div><p className="font-medium text-sm line-through opacity-60">{a.title}</p><p className="text-xs text-muted-foreground">{a.category}</p></div>
              <Badge variant="outline" className="text-xs opacity-60">Descartado</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
