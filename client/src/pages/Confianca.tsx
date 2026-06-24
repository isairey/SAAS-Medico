import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Shield, ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Confianca() {
  const utils = trpc.useUtils();
  const { data: trusts, isLoading } = trpc.professionalTrust.list.useQuery({});
  const createTrust = trpc.professionalTrust.create.useMutation({
    onSuccess: () => { utils.professionalTrust.list.invalidate(); toast.success("Delegação criada"); setShowCreate(false); },
  });
  const updateTrust = trpc.professionalTrust.update.useMutation({
    onSuccess: () => { utils.professionalTrust.list.invalidate(); toast.success("Atualizado"); },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    professionalId: 0, professionalName: "", professionalCRM: "",
    professionalRole: "medico_consultor" as const, trustLevel: "supervisionado" as const,
    observation: "",
  });

  const roleLabels: Record<string, string> = {
    medico_consultor: "Médico Consultor",
    medico_assistente: "Médico Assistente",
    enfermeiro: "Enfermeiro(a)",
    biomedico: "Biomédico(a)",
    nutricionista: "Nutricionista",
    psicologo: "Psicólogo(a)",
  };

  const trustLabels: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    total: { label: "Confiança Total", icon: ShieldCheck, color: "text-green-600" },
    parcial: { label: "Confiança Parcial", icon: Shield, color: "text-amber-600" },
    supervisionado: { label: "Supervisionado", icon: Eye, color: "text-blue-600" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delegação de Confiança</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie quem pode validar prescrições e em qual nível
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Delegar Confiança</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Delegação de Confiança</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do Profissional</Label>
                <Input value={form.professionalName} onChange={e => setForm(f => ({ ...f, professionalName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CRM / Registro</Label>
                  <Input value={form.professionalCRM} onChange={e => setForm(f => ({ ...f, professionalCRM: e.target.value }))} />
                </div>
                <div>
                  <Label>ID no Sistema</Label>
                  <Input type="number" value={form.professionalId || ""} onChange={e => setForm(f => ({ ...f, professionalId: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Função</Label>
                <Select value={form.professionalRole} onValueChange={v => setForm(f => ({ ...f, professionalRole: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Confiança</Label>
                <Select value={form.trustLevel} onValueChange={v => setForm(f => ({ ...f, trustLevel: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total — Valida tudo sem preceptor</SelectItem>
                    <SelectItem value="parcial">Parcial — Valida simples, complexos vão ao preceptor</SelectItem>
                    <SelectItem value="supervisionado">Supervisionado — Tudo vai ao preceptor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createTrust.mutate(form)}
                disabled={!form.professionalName || !form.professionalId || createTrust.isPending}
              >
                {createTrust.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Delegar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Confiança Total</p>
                <p className="text-xs text-muted-foreground">Pode validar tudo sem preceptor. CRM próprio na receita.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">Confiança Parcial</p>
                <p className="text-xs text-muted-foreground">Valida itens simples (N1/N2). Complexos vão ao preceptor.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Supervisionado</p>
                <p className="text-xs text-muted-foreground">Aparece como validador intermediário, mas tudo vai ao preceptor.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profissionais Delegados</CardTitle>
          <CardDescription>{trusts?.length ?? 0} delegações ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trusts?.map(t => {
              const trust = trustLabels[t.trustLevel];
              const TrustIcon = trust?.icon || Shield;
              return (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted ${trust?.color}`}>
                      <TrustIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{t.professionalName}</span>
                        {t.professionalCRM && (
                          <Badge variant="outline" className="text-xs font-mono">CRM {t.professionalCRM}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{roleLabels[t.professionalRole] || t.professionalRole}</Badge>
                        <Badge variant={t.isActive ? "default" : "destructive"} className="text-xs">
                          {t.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {t.observation && <p className="text-xs text-muted-foreground mt-1">{t.observation}</p>}
                      {t.delegatedByName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Delegado por: {t.delegatedByName} {t.delegatedByCRM ? `(CRM ${t.delegatedByCRM})` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={t.trustLevel}
                      onValueChange={v => updateTrust.mutate({ id: t.id, trustLevel: v as any })}
                    >
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">Total</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                        <SelectItem value="supervisionado">Supervisionado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTrust.mutate({ id: t.id, isActive: !t.isActive })}
                    >
                      {t.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!trusts || trusts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma delegação de confiança criada. Clique em "Delegar Confiança" para começar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
