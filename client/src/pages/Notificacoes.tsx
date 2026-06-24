import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, Eye, AlertTriangle, Calendar, Package, Users, Settings, Pill } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  alerta_clinico: AlertTriangle, prescricao_pendente: Pill, validacao_pendente: Eye,
  despacho_atualizado: Package, agendamento: Calendar, lead_novo: Users,
  sistema: Settings, lembrete: Bell, resultado_exame: Eye,
};

const PRIORITY_COLORS: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-700", normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700", urgente: "bg-red-100 text-red-700",
};

export default function Notificacoes() {
  const [filterType, setFilterType] = useState<string>("all");
  const [showRead, setShowRead] = useState(false);

  const notifications = trpc.notification.list.useQuery(showRead ? undefined : { isRead: false });
  const unreadCount = trpc.notification.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const markReadMut = trpc.notification.markRead.useMutation({
    onSuccess: () => { utils.notification.list.invalidate(); utils.notification.unreadCount.invalidate(); },
  });

  const markAllReadMut = trpc.notification.markAllRead.useMutation({
    onSuccess: () => { utils.notification.list.invalidate(); utils.notification.unreadCount.invalidate(); toast.success("Todas marcadas como lidas"); },
  });

  const filtered = useMemo(() => {
    if (!notifications.data) return [];
    if (filterType === "all") return notifications.data;
    return notifications.data.filter((n: any) => n.type === filterType);
  }, [notifications.data, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-600" />
            Notificações
            {(unreadCount.data ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount.data}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central de notificações do sistema. Alertas clínicos, prescrições pendentes, leads e agendamentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRead(!showRead)}>
            {showRead ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
            {showRead ? "Mostrar não lidas" : "Mostrar todas"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAllReadMut.mutate()} disabled={markAllReadMut.isPending}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="alerta_clinico">Alerta Clínico</SelectItem>
            <SelectItem value="prescricao_pendente">Prescrição Pendente</SelectItem>
            <SelectItem value="validacao_pendente">Validação Pendente</SelectItem>
            <SelectItem value="despacho_atualizado">Despacho Atualizado</SelectItem>
            <SelectItem value="agendamento">Agendamento</SelectItem>
            <SelectItem value="lead_novo">Lead Novo</SelectItem>
            <SelectItem value="lembrete">Lembrete</SelectItem>
            <SelectItem value="resultado_exame">Resultado Exame</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} notificações</Badge>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {showRead ? "Nenhuma notificação encontrada" : "Nenhuma notificação não lida"}
            </CardContent>
          </Card>
        )}
        {filtered.map((n: any) => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          const priorityColor = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.normal;
          return (
            <Card key={n.id} className={`transition-all ${!n.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : "opacity-75"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${!n.isRead ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${!n.isRead ? "" : "text-muted-foreground"}`}>{n.title}</span>
                        <Badge className={priorityColor} variant="secondary">{n.priority}</Badge>
                      </div>
                      {n.content && <p className="text-sm text-muted-foreground">{n.content}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(n.createdAt).toLocaleDateString("pt-BR")} {new Date(n.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>Canal: {n.channel}</span>
                      </div>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markReadMut.mutate({ id: n.id })}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
