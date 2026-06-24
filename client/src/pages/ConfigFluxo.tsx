import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings2, Shield, Zap, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  PRE_TRIAGEM_ENFERMAGEM: <Shield className="w-5 h-5 text-blue-500" />,
  VALIDACAO_MEDICO_ASSISTENTE: <Shield className="w-5 h-5 text-emerald-500" />,
  VALIDACAO_HUMANA_OBRIGATORIA: <Lock className="w-5 h-5 text-red-500" />,
  EXIGIR_VALIDACAO_FINAL: <Lock className="w-5 h-5 text-amber-500" />,
  LIBERAR_SUGESTAO_AUTOMATICA: <Zap className="w-5 h-5 text-purple-500" />,
  PREVER_COBRANCA: <Settings2 className="w-5 h-5 text-slate-500" />,
  AUTO_ENCAMINHAR_BAIXO_RISCO: <Zap className="w-5 h-5 text-green-500" />,
  TRAVAR_ONCOLOGIA: <AlertTriangle className="w-5 h-5 text-red-600" />,
  TRAVAR_GESTANTE: <AlertTriangle className="w-5 h-5 text-pink-500" />,
  TRAVAR_POLIFARMACIA: <AlertTriangle className="w-5 h-5 text-orange-500" />,
};

export default function ConfigFluxoPage() {
  const configs = trpc.flowConfig.list.useQuery();
  const updateConfig = trpc.flowConfig.update.useMutation({
    onSuccess: () => { configs.refetch(); toast.success("Configuração atualizada"); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuração de Fluxo</h1>
        <p className="text-sm text-muted-foreground mt-1">Parâmetros do motor clínico — intervalos de retorno, limites de alerta, automação de follow-up</p>
        <p className="text-muted-foreground text-sm mt-1">Governança clínica — controle quais etapas são obrigatórias e quais podem ser automatizadas</p>
      </div>

      <div className="grid gap-4">
        {configs.data?.map((cfg: any) => (
          <Card key={cfg.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{iconMap[cfg.configKey] ?? <Settings2 className="w-5 h-5 text-muted-foreground" />}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{cfg.configKey.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className={cfg.configValue === "ON" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                        {cfg.configValue}
                      </Badge>
                      {cfg.defaultProfile && <Badge variant="secondary" className="text-xs">{cfg.defaultProfile}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{cfg.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="text-emerald-600">ON: {cfg.ifOn}</span>
                      <span className="text-slate-400">OFF: {cfg.ifOff}</span>
                    </div>
                  </div>
                </div>
                {cfg.showToggle && (
                  <Switch
                    checked={cfg.configValue === "ON"}
                    onCheckedChange={v => updateConfig.mutate({ key: cfg.configKey, value: v ? "ON" : "OFF" })}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
