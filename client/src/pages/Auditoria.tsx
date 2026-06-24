import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export default function AuditoriaPage() {
  const { data: logs, isLoading } = trpc.dashboard.auditLog.useQuery({ limit: 100 });

  const actionColor: Record<string, string> = {
    create: "bg-green-500/10 text-green-700",
    update: "bg-blue-500/10 text-blue-700",
    delete: "bg-red-500/10 text-red-700",
    login: "bg-purple-500/10 text-purple-700",
    access: "bg-yellow-500/10 text-yellow-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">Log completo de ações realizadas no sistema — rastreabilidade total para governança e compliance</p>
      </div>

      {isLoading ? <div className="text-center p-8 text-muted-foreground">Carregando...</div> : !logs?.length ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhum registro de auditoria</CardContent></Card>
      ) : (
        <div className="space-y-1">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Badge variant="outline" className={`text-[10px] shrink-0 ${actionColor[log.action] ?? ""}`}>{log.action}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{log.entityType}: {log.description || log.entityId}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
