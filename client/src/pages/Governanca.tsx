import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, ShoppingCart, Shield, ArrowRight, Eye, Zap, Target, BarChart3, Activity } from "lucide-react";
import { useState, useMemo } from "react";

export default function Governanca() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: leads, isLoading: loadingLeads } = trpc.entryLead.list.useQuery({});
  const { data: channels } = trpc.entryChannel.list.useQuery({});
  const { data: dispatches } = trpc.dispatch.list.useQuery({});
  const { data: validations } = trpc.validationCascade.list.useQuery({});
  const { data: grades } = trpc.conductGrade.list.useQuery({});
  const { data: pharmacies } = trpc.pharmacy.list.useQuery({});

  const stats = useMemo(() => {
    if (!leads) return null;
    const total = leads.length;
    const novos = leads.filter(l => l.status === "novo").length;
    const convertidos = leads.filter(l => l.status === "convertido").length;
    const perdidos = leads.filter(l => l.status === "perdido").length;
    const prescricoes = leads.filter(l => l.status === "prescricao_gerada").length;
    const taxaConversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) : "0";

    const byChannel: Record<string, number> = {};
    leads.forEach(l => {
      byChannel[l.channelType] = (byChannel[l.channelType] || 0) + 1;
    });

    return { total, novos, convertidos, perdidos, prescricoes, taxaConversao, byChannel };
  }, [leads]);

  const dispatchStats = useMemo(() => {
    if (!dispatches) return null;
    const total = dispatches.length;
    const pendentes = dispatches.filter(d => d.status === "pendente").length;
    const enviados = dispatches.filter(d => d.status === "enviado" || d.status === "aceito").length;
    const entregues = dispatches.filter(d => d.status === "entregue").length;
    const cancelados = dispatches.filter(d => d.status === "cancelado").length;
    return { total, pendentes, enviados, entregues, cancelados };
  }, [dispatches]);

  const validationStats = useMemo(() => {
    if (!validations) return null;
    const total = validations.length;
    const aguardando = validations.filter(v => v.status === "aguardando").length;
    const homologados = validations.filter(v => v.status === "homologado").length;
    const devolvidos = validations.filter(v => v.status === "devolvido").length;
    return { total, aguardando, homologados, devolvidos };
  }, [validations]);

  const channelLabels: Record<string, string> = {
    trafego_pago: "Tráfego Pago",
    consultora: "Consultora",
    site: "Site",
    vendedor_externo: "Vendedor Externo",
    referral: "Indicação",
    whatsapp_bot: "WhatsApp Bot",
  };

  const statusLabels: Record<string, string> = {
    novo: "Novo",
    contatado: "Contatado",
    agendado: "Agendado",
    anamnese_iniciada: "Anamnese Iniciada",
    anamnese_concluida: "Anamnese Concluída",
    prescricao_gerada: "Prescrição Gerada",
    convertido: "Convertido",
    perdido: "Perdido",
    reativado: "Reativado",
  };

  const statusColors: Record<string, string> = {
    novo: "bg-blue-100 text-blue-800",
    contatado: "bg-cyan-100 text-cyan-800",
    agendado: "bg-indigo-100 text-indigo-800",
    anamnese_iniciada: "bg-purple-100 text-purple-800",
    anamnese_concluida: "bg-violet-100 text-violet-800",
    prescricao_gerada: "bg-amber-100 text-amber-800",
    convertido: "bg-green-100 text-green-800",
    perdido: "bg-red-100 text-red-800",
    reativado: "bg-orange-100 text-orange-800",
  };

  if (loadingLeads) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Governança Global</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão 360° de todas as entradas, validações e despachos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            {stats?.total ?? 0} leads totais
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">Leads Novos</span>
            </div>
            <p className="text-2xl font-bold">{stats?.novos ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">Convertidos</span>
            </div>
            <p className="text-2xl font-bold">{stats?.convertidos ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">Prescrições</span>
            </div>
            <p className="text-2xl font-bold">{stats?.prescricoes ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground font-medium">Taxa Conversão</span>
            </div>
            <p className="text-2xl font-bold">{stats?.taxaConversao ?? 0}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground font-medium">Despachos</span>
            </div>
            <p className="text-2xl font-bold">{dispatchStats?.total ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground font-medium">Validações</span>
            </div>
            <p className="text-2xl font-bold">{validationStats?.aguardando ?? 0}</p>
            <span className="text-xs text-muted-foreground">aguardando</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="dispatches">Despachos</TabsTrigger>
          <TabsTrigger value="validations">Validações</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Leads por Canal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads por Canal de Entrada</CardTitle>
                <CardDescription>Distribuição de leads por braço de entrada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.byChannel && Object.entries(stats.byChannel)
                    .sort(([,a], [,b]) => b - a)
                    .map(([channel, count]) => {
                      const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
                      return (
                        <div key={channel} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{channelLabels[channel] || channel}</span>
                            <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {(!stats?.byChannel || Object.keys(stats.byChannel).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum lead registrado ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Graus de Conduta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Graus de Conduta (N1/N2/N3)</CardTitle>
                <CardDescription>Classificação automática por score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {grades?.map(grade => (
                    <div key={grade.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: grade.color || "#888" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{grade.name}</span>
                          <Badge variant="outline" className="text-xs">{grade.validationLevel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Score {grade.minScore}–{grade.maxScore} |
                          {grade.autoGenerateRecipe ? " Auto-receita" : ""} 
                          {grade.autoDispatchPharmacy ? " Auto-despacho" : ""}
                          {grade.requiresConsultantClick ? " Clique consultor" : ""}
                          {grade.requiresFullCascade ? " Cascata completa" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!grades || grades.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum grau configurado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline de Vendas</CardTitle>
              <CardDescription>Funil de conversão dos leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {["novo", "contatado", "agendado", "anamnese_iniciada", "anamnese_concluida", "prescricao_gerada", "convertido"].map((status, idx) => {
                  const count = leads?.filter(l => l.status === status).length ?? 0;
                  return (
                    <div key={status} className="flex items-center">
                      <div className={`px-3 py-2 rounded-lg text-center min-w-[100px] ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs font-medium">{statusLabels[status]}</p>
                      </div>
                      {idx < 6 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos os Leads</CardTitle>
              <CardDescription>{leads?.length ?? 0} leads no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Canal</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Telefone</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">UTM Source</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads?.map(lead => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{lead.name}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs">
                            {channelLabels[lead.channelType] || lead.channelType}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>
                            {statusLabels[lead.status] || lead.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{lead.phone || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{lead.utmSource || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </td>
                      </tr>
                    ))}
                    {(!leads || leads.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum lead registrado. Configure os braços de entrada para começar a captar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHANNELS TAB */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais de Entrada Configurados</CardTitle>
              <CardDescription>Braços de captação ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channels?.map(ch => (
                  <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ch.name}</span>
                        <Badge variant="outline" className="text-xs">{channelLabels[ch.type] || ch.type}</Badge>
                        <Badge variant={ch.isActive ? "default" : "secondary"} className="text-xs">
                          {ch.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {ch.description && <p className="text-xs text-muted-foreground mt-1">{ch.description}</p>}
                      {ch.utmSource && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          UTM: {ch.utmSource} / {ch.utmMedium} / {ch.utmCampaign}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {leads?.filter(l => l.channelId === ch.id).length ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">leads</p>
                    </div>
                  </div>
                ))}
                {(!channels || channels.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum canal configurado. Crie canais de entrada para rastrear a origem dos leads.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISPATCHES TAB */}
        <TabsContent value="dispatches" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{dispatchStats?.pendentes ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{dispatchStats?.enviados ?? 0}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{dispatchStats?.entregues ?? 0}</p>
                <p className="text-xs text-muted-foreground">Entregues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{dispatchStats?.cancelados ?? 0}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despachos para Farmácias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Farmácia</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Comissão</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches?.map(d => {
                      const pharmacy = pharmacies?.find(p => p.id === d.pharmacyId);
                      return (
                        <tr key={d.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-mono text-xs">#{d.id}</td>
                          <td className="py-2 px-3">{pharmacy?.name ?? `Farmácia #${d.pharmacyId}`}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">{d.status}</Badge>
                          </td>
                          <td className="py-2 px-3">R$ {d.totalValue || "—"}</td>
                          <td className="py-2 px-3">R$ {d.commissionValue || "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString("pt-BR") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {(!dispatches || dispatches.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum despacho registrado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VALIDATIONS TAB */}
        <TabsContent value="validations" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{validationStats?.aguardando ?? 0}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{validationStats?.homologados ?? 0}</p>
                <p className="text-xs text-muted-foreground">Homologados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{validationStats?.devolvidos ?? 0}</p>
                <p className="text-xs text-muted-foreground">Devolvidos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cascata de Validação</CardTitle>
              <CardDescription>Fila de validação: Enfermagem → Médico → Preceptor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Etapa</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Profissional</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">CRM</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations?.map(v => (
                      <tr key={v.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs">{v.entityType}</Badge>
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {v.step === "triagem_enfermagem" && "Triagem Enfermagem"}
                          {v.step === "validacao_medico" && "Validação Médico"}
                          {v.step === "validacao_preceptor" && "Validação Preceptor"}
                        </td>
                        <td className="py-2 px-3">
                          <Badge
                            variant={v.status === "homologado" ? "default" : v.status === "devolvido" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {v.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">{v.professionalName || "—"}</td>
                        <td className="py-2 px-3 font-mono text-xs">{v.professionalCRM || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {v.validatedAt ? new Date(v.validatedAt).toLocaleDateString("pt-BR") : "Pendente"}
                        </td>
                      </tr>
                    ))}
                    {(!validations || validations.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma validação na fila.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
