import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Webhook, Copy, RefreshCw, Zap, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Webhooks() {
  const utils = trpc.useUtils();
  const { data: endpoints, isLoading } = trpc.webhookEndpoint.list.useQuery({});
  const createEndpoint = trpc.webhookEndpoint.create.useMutation({
    onSuccess: (data) => {
      utils.webhookEndpoint.list.invalidate();
      toast.success("Webhook criado! Token: " + data.secretToken.slice(0, 8) + "...");
      setShowCreate(false);
    },
  });
  const regenerateToken = trpc.webhookEndpoint.regenerateToken.useMutation({
    onSuccess: (data) => {
      utils.webhookEndpoint.list.invalidate();
      toast.success("Novo token gerado: " + data.secretToken.slice(0, 8) + "...");
    },
  });
  const updateEndpoint = trpc.webhookEndpoint.update.useMutation({
    onSuccess: () => { utils.webhookEndpoint.list.invalidate(); toast.success("Atualizado"); },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    platform: "manychat" as const,
    targetAction: "create_lead" as const,
    defaultChannelType: "trafego_pago" as const,
  });

  const platformLabels: Record<string, { label: string; color: string }> = {
    manychat: { label: "ManyChat", color: "bg-blue-100 text-blue-800" },
    typebot: { label: "Typebot", color: "bg-purple-100 text-purple-800" },
    botpress: { label: "Botpress", color: "bg-indigo-100 text-indigo-800" },
    n8n: { label: "n8n", color: "bg-orange-100 text-orange-800" },
    zapier: { label: "Zapier", color: "bg-amber-100 text-amber-800" },
    make: { label: "Make", color: "bg-violet-100 text-violet-800" },
    custom: { label: "Custom", color: "bg-gray-100 text-gray-800" },
  };

  const actionLabels: Record<string, string> = {
    create_lead: "Criar Lead",
    start_quick_anamnesis: "Iniciar Anamnese Rápida",
    update_lead_status: "Atualizar Status do Lead",
    trigger_prescription: "Disparar Prescrição",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const webhookUrl = `${window.location.origin}/api/trpc/webhookIntake.ingest`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks de Automação</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conecte ManyChat, Typebot, n8n e outras ferramentas
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: ManyChat Instagram Ads" />
              </div>
              <div>
                <Label>Plataforma</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ação ao Receber</Label>
                <Select value={form.targetAction} onValueChange={v => setForm(f => ({ ...f, targetAction: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal de Entrada Padrão</Label>
                <Select value={form.defaultChannelType} onValueChange={v => setForm(f => ({ ...f, defaultChannelType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                    <SelectItem value="consultora">Consultora</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="vendedor_externo">Vendedor Externo</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                    <SelectItem value="whatsapp_bot">WhatsApp Bot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createEndpoint.mutate(form)}
                disabled={!form.name || createEndpoint.isPending}
              >
                {createEndpoint.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Como Usar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Envie um POST para o endpoint abaixo com o token do webhook:</p>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-lg font-mono text-xs">
            <code className="flex-1 break-all">{webhookUrl}</code>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs mt-2">
            Body: <code>{`{"token": "SEU_TOKEN", "payload": {"name": "João", "phone": "11999...", "email": "..."}}`}</code>
          </p>
        </CardContent>
      </Card>

      {/* Endpoint List */}
      <div className="space-y-3">
        {endpoints?.map(ep => {
          const platform = platformLabels[ep.platform];
          return (
            <Card key={ep.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Webhook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ep.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${platform?.color || "bg-gray-100"}`}>
                          {platform?.label || ep.platform}
                        </span>
                        <Badge variant={ep.isActive ? "default" : "secondary"} className="text-xs">
                          {ep.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ação: <strong>{actionLabels[ep.targetAction]}</strong> | 
                        Chamadas: <strong>{ep.callCount}</strong>
                        {ep.lastCalledAt && ` | Última: ${new Date(ep.lastCalledAt).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ep.secretToken)}
                      title="Copiar token"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateToken.mutate({ id: ep.id })}
                      title="Regenerar token"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateEndpoint.mutate({ id: ep.id, isActive: !ep.isActive })}
                    >
                      {ep.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 bg-muted p-2 rounded font-mono text-xs flex items-center gap-2">
                  <span className="text-muted-foreground">Token:</span>
                  <code>{ep.secretToken.slice(0, 12)}...{ep.secretToken.slice(-4)}</code>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!endpoints || endpoints.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum webhook configurado. Crie um para conectar suas ferramentas de automação.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
