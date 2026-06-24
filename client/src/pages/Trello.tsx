import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trello, Plus, Settings, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

const SYNC_STATUS: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  sincronizado: { label: "Sincronizado", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  erro: { label: "Erro", icon: XCircle, color: "bg-red-100 text-red-800" },
  arquivado: { label: "Arquivado", icon: AlertCircle, color: "bg-gray-100 text-gray-800" },
};

const ENTITY_LABELS: Record<string, string> = {
  alerta: "Alerta Clínico", prescricao: "Prescrição", validacao: "Validação",
  lead: "Lead", agendamento: "Agendamento", despacho: "Despacho Farmácia",
};

export default function TrelloPage() {
  const [openCard, setOpenCard] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [filterSync, setFilterSync] = useState<string>("all");

  const cards = trpc.trello.listCards.useQuery();
  const config = trpc.trello.getConfig.useQuery();
  const utils = trpc.useUtils();

  const createCardMut = trpc.trello.createCard.useMutation({
    onSuccess: () => { utils.trello.listCards.invalidate(); setOpenCard(false); toast.success("Card criado"); },
    onError: (e) => toast.error(e.message),
  });

  const upsertConfigMut = trpc.trello.upsertConfig.useMutation({
    onSuccess: () => { utils.trello.getConfig.invalidate(); setOpenConfig(false); toast.success("Configuração salva"); },
    onError: (e) => toast.error(e.message),
  });

  const updateCardMut = trpc.trello.updateCard.useMutation({
    onSuccess: () => { utils.trello.listCards.invalidate(); toast.success("Card atualizado"); },
  });

  const filteredCards = (cards.data || []).filter((c: any) => filterSync === "all" || c.syncStatus === filterSync);

  const handleCreateCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCardMut.mutate({
      entityType: fd.get("entityType") as any,
      entityId: Number(fd.get("entityId")),
      cardTitle: fd.get("cardTitle") as string,
      cardDescription: fd.get("cardDescription") as string || undefined,
      labels: fd.get("labels") as string || undefined,
    });
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsertConfigMut.mutate({
      apiKey: fd.get("apiKey") as string || undefined,
      apiToken: fd.get("apiToken") as string || undefined,
      defaultBoardId: fd.get("defaultBoardId") as string || undefined,
      listMappings: fd.get("listMappings") as string || undefined,
      isActive: fd.get("isActive") === "on",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trello className="h-6 w-6 text-blue-600" />
            Integração Trello
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincronize alertas, prescrições e leads com boards do Trello para gestão visual de tarefas.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openConfig} onOpenChange={setOpenConfig}>
            <DialogTrigger asChild>
              <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Configurar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuração do Trello</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <p className="text-xs text-muted-foreground">Chave da API do Trello (obter em trello.com/app-key)</p>
                  <Input name="apiKey" defaultValue={config.data?.apiKey || ""} placeholder="Sua API Key" className="mt-1" />
                </div>
                <div>
                  <Label>API Token</Label>
                  <p className="text-xs text-muted-foreground">Token de autorização do Trello</p>
                  <Input name="apiToken" type="password" defaultValue={config.data?.apiToken || ""} placeholder="Seu Token" className="mt-1" />
                </div>
                <div>
                  <Label>Board ID Padrão</Label>
                  <p className="text-xs text-muted-foreground">ID do board onde os cards serão criados</p>
                  <Input name="defaultBoardId" defaultValue={config.data?.defaultBoardId || ""} placeholder="ID do Board" className="mt-1" />
                </div>
                <div>
                  <Label>Mapeamento de Listas (JSON)</Label>
                  <p className="text-xs text-muted-foreground">JSON mapeando tipo de entidade → ID da lista no Trello</p>
                  <Textarea name="listMappings" defaultValue={config.data?.listMappings || '{"alerta":"","prescricao":"","lead":""}'} rows={3} className="mt-1 font-mono text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="isActive" defaultChecked={config.data?.isActive || false} />
                  <Label>Integração ativa</Label>
                </div>
                <Button type="submit" className="w-full" disabled={upsertConfigMut.isPending}>
                  {upsertConfigMut.isPending ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openCard} onOpenChange={setOpenCard}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Card</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Card no Trello</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <Label>Tipo de Entidade</Label>
                  <p className="text-xs text-muted-foreground">Qual tipo de item do sistema este card representa</p>
                  <select name="entityType" required className="w-full border rounded px-3 py-2 mt-1 text-sm">
                    {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>ID da Entidade</Label>
                  <p className="text-xs text-muted-foreground">ID numérico do item no sistema (alerta, prescrição, etc.)</p>
                  <Input name="entityId" type="number" required className="mt-1" />
                </div>
                <div>
                  <Label>Título do Card</Label>
                  <p className="text-xs text-muted-foreground">Título que aparecerá no card do Trello</p>
                  <Input name="cardTitle" required className="mt-1" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <p className="text-xs text-muted-foreground">Detalhes adicionais para o card</p>
                  <Textarea name="cardDescription" rows={3} className="mt-1" />
                </div>
                <div>
                  <Label>Labels</Label>
                  <p className="text-xs text-muted-foreground">Etiquetas separadas por vírgula (ex: urgente, prescricao)</p>
                  <Input name="labels" placeholder="urgente, prescricao" className="mt-1" />
                </div>
                <Button type="submit" className="w-full" disabled={createCardMut.isPending}>
                  {createCardMut.isPending ? "Criando..." : "Criar Card"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status da integração */}
      <Card className={config.data?.isActive ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"}>
        <CardContent className="p-4 flex items-center gap-3">
          {config.data?.isActive ? (
            <><CheckCircle2 className="h-5 w-5 text-green-600" /><span className="font-medium text-green-800">Integração ativa</span><span className="text-sm text-green-600">Board: {config.data?.defaultBoardId || "não configurado"}</span></>
          ) : (
            <><AlertCircle className="h-5 w-5 text-orange-600" /><span className="font-medium text-orange-800">Integração inativa</span><span className="text-sm text-orange-600">Configure a API Key e Token para ativar</span></>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <Select value={filterSync} onValueChange={setFilterSync}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por sync" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SYNC_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredCards.length} cards</Badge>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {filteredCards.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum card encontrado</CardContent></Card>
        )}
        {filteredCards.map((c: any) => {
          const sync = SYNC_STATUS[c.syncStatus] || SYNC_STATUS.pendente;
          const SyncIcon = sync.icon;
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.cardTitle}</span>
                      <Badge className={sync.color}><SyncIcon className="h-3 w-3 mr-1" />{sync.label}</Badge>
                      <Badge variant="outline">{ENTITY_LABELS[c.entityType] || c.entityType}</Badge>
                    </div>
                    {c.cardDescription && <p className="text-sm text-muted-foreground">{c.cardDescription}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Entidade #{c.entityId}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                      {c.trelloUrl && (
                        <a href={c.trelloUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <ExternalLink className="h-3 w-3" />Ver no Trello
                        </a>
                      )}
                    </div>
                    {c.syncError && <p className="text-xs text-red-600 mt-1">Erro: {c.syncError}</p>}
                  </div>
                  <div className="flex gap-1">
                    {c.syncStatus === "pendente" && (
                      <Button variant="ghost" size="sm" onClick={() => updateCardMut.mutate({ id: c.id, syncStatus: "sincronizado" })}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
