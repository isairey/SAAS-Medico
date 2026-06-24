import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Shield, ShieldCheck, ShieldAlert, Pill, Syringe, FlaskConical, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

/** Componente reutilizável: Label com subtítulo explicativo */
function FieldLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-0.5 mb-1.5">
      <Label className="text-sm font-semibold">{title}</Label>
      <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
    </div>
  );
}

const categoryLabels: Record<string, { label: string; subtitle: string }> = {
  medicamento: { label: "Medicamento", subtitle: "Fármaco industrializado com registro ANVISA" },
  suplemento: { label: "Suplemento", subtitle: "Suplemento alimentar regulado pela RDC 243/2018" },
  formula_magistral: { label: "Fórmula Magistral", subtitle: "Preparação manipulada em farmácia conforme RDC 67/2007" },
  procedimento: { label: "Procedimento", subtitle: "Ato clínico realizado no paciente (invasivo ou não)" },
  exame: { label: "Exame", subtitle: "Avaliação diagnóstica ou de acompanhamento" },
  protocolo: { label: "Protocolo", subtitle: "Conjunto padronizado de condutas terapêuticas" },
  conduta_clinica: { label: "Conduta Clínica", subtitle: "Orientação ou decisão terapêutica sem fármaco" },
  dispositivo: { label: "Dispositivo", subtitle: "Implante, chip ou dispositivo médico" },
};

const routeLabels: Record<string, { label: string; subtitle: string }> = {
  oral: { label: "Oral", subtitle: "Via oral — comprimido, cápsula, líquido" },
  injetavel_iv: { label: "Injetável IV", subtitle: "Intravenoso — acesso venoso, soroterapia" },
  injetavel_im: { label: "Injetável IM", subtitle: "Intramuscular — aplicação em músculo" },
  injetavel_sc: { label: "Injetável SC", subtitle: "Subcutâneo — aplicação sob a pele" },
  topico: { label: "Tópico", subtitle: "Aplicação na pele — creme, pomada, gel" },
  implante: { label: "Implante", subtitle: "Dispositivo implantado cirurgicamente" },
  inalatorio: { label: "Inalatório", subtitle: "Via respiratória — nebulização, spray" },
  sublingual: { label: "Sublingual", subtitle: "Absorção sob a língua" },
  retal: { label: "Retal", subtitle: "Via retal — supositório" },
  oftalmico: { label: "Oftálmico", subtitle: "Via ocular — colírio" },
  nasal: { label: "Nasal", subtitle: "Via nasal — spray nasal" },
  transdermico: { label: "Transdérmico", subtitle: "Adesivo cutâneo de liberação lenta" },
  procedimento_invasivo: { label: "Procedimento Invasivo", subtitle: "Quebra de barreira cutânea ou mucosa" },
  procedimento_nao_invasivo: { label: "Procedimento Não Invasivo", subtitle: "Sem quebra de barreira — avaliação, laser" },
  nenhuma: { label: "Nenhuma", subtitle: "Não se aplica via de administração" },
};

const prescriptionLabels: Record<string, { label: string; subtitle: string }> = {
  simples: { label: "Receita Simples", subtitle: "Suplementos e fitoterápicos — sem retenção" },
  comum: { label: "Receita Comum", subtitle: "Medicamentos não controlados — 2 vias" },
  controle_especial: { label: "Controle Especial", subtitle: "Lista C1 — receita em 2 vias com retenção" },
  antimicrobiano: { label: "Antimicrobiano", subtitle: "Antibióticos — RDC 20/2011, retenção obrigatória" },
  retencao: { label: "Retenção (B1/B2)", subtitle: "Psicotrópicos — notificação azul ou rosa" },
  notificacao_a: { label: "Notificação A", subtitle: "Entorpecentes — notificação amarela, máximo 30 dias" },
  nenhuma: { label: "Nenhuma", subtitle: "Não requer receita — venda livre" },
};

const levelColors: Record<string, string> = {
  N1: "bg-green-100 text-green-800 border-green-300",
  N2: "bg-amber-100 text-amber-800 border-amber-300",
  N3: "bg-red-100 text-red-800 border-red-300",
};

const levelLabels: Record<string, { label: string; subtitle: string }> = {
  N1: { label: "N1 — Automático", subtitle: "Score 0-30: IA valida, gera receita e despacha automaticamente" },
  N2: { label: "N2 — Semi-automático", subtitle: "Score 31-60: IA valida, mas requer 1 clique do consultor delegado" },
  N3: { label: "N3 — Manual / Cascata", subtitle: "Score 61-100: Cascata completa — enfermagem → médico → preceptor" },
};

export default function ScoreRegulatorio() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.regulatoryCompetence.list.useQuery({});
  const createItem = trpc.regulatoryCompetence.create.useMutation({
    onSuccess: () => { utils.regulatoryCompetence.list.invalidate(); toast.success("Item cadastrado"); setShowCreate(false); },
  });
  const updateItem = trpc.regulatoryCompetence.update.useMutation({
    onSuccess: () => { utils.regulatoryCompetence.list.invalidate(); toast.success("Atualizado"); },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    itemName: "", itemCategory: "suplemento" as any, administrationRoute: "oral" as any,
    regulatoryScore: 10, canMedico: true, canEnfermeiro: false, canFarmaceutico: false,
    canBiomedico: false, canNutricionista: false, canPsicologo: false,
    requiresCRM: false, requiresSpecialPrescription: false,
    prescriptionType: "simples" as any, autoValidationLevel: "N1" as any,
    regulatoryNotes: "", legalBasis: "", exampleDosage: "", therapeuticGroup: "",
  });

  // Auto-calculate validation level from score
  const autoLevel = (score: number) => {
    if (score <= 30) return "N1";
    if (score <= 60) return "N2";
    return "N3";
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      if (filterCategory !== "all" && item.itemCategory !== filterCategory) return false;
      if (filterLevel !== "all" && item.autoValidationLevel !== filterLevel) return false;
      if (searchTerm && !item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [items, filterCategory, filterLevel, searchTerm]);

  const stats = useMemo(() => {
    if (!items) return { total: 0, n1: 0, n2: 0, n3: 0 };
    return {
      total: items.length,
      n1: items.filter(i => i.autoValidationLevel === "N1").length,
      n2: items.filter(i => i.autoValidationLevel === "N2").length,
      n3: items.filter(i => i.autoValidationLevel === "N3").length,
    };
  }, [items]);

  if (isLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">Score Competência Reguladora</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Classificação regulatória de cada conduta — quem pode prescrever, qual via, qual nível de validação
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Item Regulatório</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Defina quem pode prescrever este item e qual nível de validação é necessário
              </p>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FieldLabel title="Nome do Item / Conduta" subtitle="Nome completo do medicamento, suplemento, procedimento ou conduta clínica" />
                <Input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="Ex: Coenzima Q10 100mg" />
              </div>

              <div>
                <FieldLabel title="Categoria" subtitle="Tipo regulatório do item conforme classificação ANVISA/CFM" />
                <Select value={form.itemCategory} onValueChange={v => setForm(f => ({ ...f, itemCategory: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className="font-medium">{v.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {v.subtitle}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel title="Via de Administração" subtitle="Como o item é administrado ao paciente — determina complexidade regulatória" />
                <Select value={form.administrationRoute} onValueChange={v => setForm(f => ({ ...f, administrationRoute: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(routeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className="font-medium">{v.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {v.subtitle}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel title="Score Regulatório (0-100)" subtitle="0-30 = N1 auto | 31-60 = N2 semi | 61-100 = N3 cascata completa" />
                <Input
                  type="number" min={0} max={100}
                  value={form.regulatoryScore}
                  onChange={e => {
                    const score = Number(e.target.value);
                    setForm(f => ({ ...f, regulatoryScore: score, autoValidationLevel: autoLevel(score) }));
                  }}
                />
                <Badge className={`mt-1 ${levelColors[form.autoValidationLevel]}`}>
                  {levelLabels[form.autoValidationLevel]?.label}
                </Badge>
              </div>

              <div>
                <FieldLabel title="Tipo de Receita" subtitle="Classificação legal da receita necessária para dispensação" />
                <Select value={form.prescriptionType} onValueChange={v => setForm(f => ({ ...f, prescriptionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(prescriptionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className="font-medium">{v.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {v.subtitle}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Profissionais habilitados */}
              <div className="col-span-2">
                <FieldLabel title="Profissionais Habilitados" subtitle="Marque quais categorias profissionais podem prescrever ou executar este item" />
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {[
                    { key: "canMedico", label: "Médico (CRM)", subtitle: "Prescreve qualquer item" },
                    { key: "canEnfermeiro", label: "Enfermeiro (COREN)", subtitle: "Prescreve conforme protocolo" },
                    { key: "canFarmaceutico", label: "Farmacêutico (CRF)", subtitle: "Prescreve suplementos e MIPs" },
                    { key: "canBiomedico", label: "Biomédico (CRBM)", subtitle: "Executa procedimentos estéticos" },
                    { key: "canNutricionista", label: "Nutricionista (CRN)", subtitle: "Prescreve suplementos e fitoterápicos" },
                    { key: "canPsicologo", label: "Psicólogo (CRP)", subtitle: "Condutas psicológicas" },
                  ].map(prof => (
                    <div key={prof.key} className="flex items-start gap-2 p-2 rounded-lg border">
                      <Switch
                        checked={(form as any)[prof.key]}
                        onCheckedChange={v => setForm(f => ({ ...f, [prof.key]: v }))}
                      />
                      <div>
                        <p className="text-xs font-medium">{prof.label}</p>
                        <p className="text-[10px] text-muted-foreground">{prof.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags regulatórias */}
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Switch checked={form.requiresCRM} onCheckedChange={v => setForm(f => ({ ...f, requiresCRM: v }))} />
                <div>
                  <p className="text-sm font-medium">Requer CRM na Receita</p>
                  <p className="text-xs text-muted-foreground">A receita precisa do carimbo e assinatura de um médico com CRM ativo</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Switch checked={form.requiresSpecialPrescription} onCheckedChange={v => setForm(f => ({ ...f, requiresSpecialPrescription: v }))} />
                <div>
                  <p className="text-sm font-medium">Receita Especial / Controlado</p>
                  <p className="text-xs text-muted-foreground">Medicamento controlado que exige receita especial com retenção na farmácia</p>
                </div>
              </div>

              <div>
                <FieldLabel title="Grupo Terapêutico" subtitle="Agrupamento farmacológico — ex: Antioxidantes, Vitaminas, Estatinas" />
                <Input value={form.therapeuticGroup} onChange={e => setForm(f => ({ ...f, therapeuticGroup: e.target.value }))} />
              </div>

              <div>
                <FieldLabel title="Posologia Exemplo" subtitle="Dose e frequência padrão para referência rápida" />
                <Input value={form.exampleDosage} onChange={e => setForm(f => ({ ...f, exampleDosage: e.target.value }))} placeholder="Ex: 100mg 1x/dia" />
              </div>

              <div>
                <FieldLabel title="Base Legal" subtitle="Resolução, portaria ou norma que regulamenta este item" />
                <Input value={form.legalBasis} onChange={e => setForm(f => ({ ...f, legalBasis: e.target.value }))} placeholder="Ex: RDC 243/2018" />
              </div>

              <div className="col-span-2">
                <FieldLabel title="Observações Regulatórias" subtitle="Notas adicionais sobre restrições, alertas ou condições especiais de prescrição" />
                <Textarea value={form.regulatoryNotes} onChange={e => setForm(f => ({ ...f, regulatoryNotes: e.target.value }))} />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => createItem.mutate(form)}
                disabled={!form.itemName || createItem.isPending}
              >
                {createItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total de Itens</p>
            <p className="text-[10px] text-muted-foreground">Condutas classificadas no sistema</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.n1}</p>
            <p className="text-xs text-muted-foreground font-medium">N1 — Automático</p>
            <p className="text-[10px] text-muted-foreground">Score 0-30 · IA valida e despacha</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.n2}</p>
            <p className="text-xs text-muted-foreground font-medium">N2 — Semi-automático</p>
            <p className="text-[10px] text-muted-foreground">Score 31-60 · Requer clique do consultor</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.n3}</p>
            <p className="text-xs text-muted-foreground font-medium">N3 — Cascata Completa</p>
            <p className="text-[10px] text-muted-foreground">Score 61-100 · Enfermagem → Médico → Preceptor</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <FieldLabel title="Buscar" subtitle="Pesquise pelo nome do item, medicamento ou conduta" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ex: Coenzima, Vitamina..." />
              </div>
            </div>
            <div className="w-[180px]">
              <FieldLabel title="Categoria" subtitle="Filtrar por tipo regulatório" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <FieldLabel title="Nível" subtitle="Filtrar por nível de validação" />
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="N1">N1 — Automático</SelectItem>
                  <SelectItem value="N2">N2 — Semi</SelectItem>
                  <SelectItem value="N3">N3 — Cascata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens Regulatórios</CardTitle>
          <CardDescription>
            {filteredItems.length} de {items?.length ?? 0} itens · Cada item define quem pode prescrever e qual nível de validação é necessário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">
                    <p className="font-medium text-muted-foreground">Item / Conduta</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Nome e grupo terapêutico</p>
                  </th>
                  <th className="text-left py-2 px-3">
                    <p className="font-medium text-muted-foreground">Categoria</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Tipo regulatório ANVISA</p>
                  </th>
                  <th className="text-left py-2 px-3">
                    <p className="font-medium text-muted-foreground">Via</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Administração</p>
                  </th>
                  <th className="text-center py-2 px-3">
                    <p className="font-medium text-muted-foreground">Score</p>
                    <p className="text-[10px] text-muted-foreground font-normal">0-100</p>
                  </th>
                  <th className="text-center py-2 px-3">
                    <p className="font-medium text-muted-foreground">Nível</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Validação</p>
                  </th>
                  <th className="text-left py-2 px-3">
                    <p className="font-medium text-muted-foreground">Habilitados</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Quem pode prescrever</p>
                  </th>
                  <th className="text-left py-2 px-3">
                    <p className="font-medium text-muted-foreground">Receita</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Tipo necessário</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <p className="font-medium text-sm">{item.itemName}</p>
                      {item.therapeuticGroup && (
                        <p className="text-[10px] text-muted-foreground">{item.therapeuticGroup}</p>
                      )}
                      {item.exampleDosage && (
                        <p className="text-[10px] text-muted-foreground italic">{item.exampleDosage}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[item.itemCategory]?.label || item.itemCategory}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs">{routeLabels[item.administrationRoute]?.label || item.administrationRoute}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-lg">{item.regulatoryScore}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge className={`${levelColors[item.autoValidationLevel]} border`}>
                        {item.autoValidationLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.canMedico && <Badge variant="secondary" className="text-[10px]">Médico</Badge>}
                        {item.canEnfermeiro && <Badge variant="secondary" className="text-[10px]">Enfermeiro</Badge>}
                        {item.canFarmaceutico && <Badge variant="secondary" className="text-[10px]">Farmacêutico</Badge>}
                        {item.canBiomedico && <Badge variant="secondary" className="text-[10px]">Biomédico</Badge>}
                        {item.canNutricionista && <Badge variant="secondary" className="text-[10px]">Nutricionista</Badge>}
                        {item.canPsicologo && <Badge variant="secondary" className="text-[10px]">Psicólogo</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs">{prescriptionLabels[item.prescriptionType]?.label || item.prescriptionType}</span>
                      {item.requiresCRM && <Badge variant="destructive" className="text-[10px] ml-1">CRM</Badge>}
                      {item.requiresSpecialPrescription && <Badge variant="destructive" className="text-[10px] ml-1">Especial</Badge>}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterCategory !== "all" || filterLevel !== "all"
                        ? "Nenhum item encontrado com os filtros aplicados."
                        : "Nenhum item regulatório cadastrado. Clique em \"Novo Item\" para começar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda dos Níveis de Validação</CardTitle>
          <CardDescription>Como o Score Competência Reguladora determina o fluxo de validação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(levelLabels).map(([level, info]) => (
              <div key={level} className={`p-4 rounded-lg border-2 ${levelColors[level]}`}>
                <p className="font-bold text-sm">{info.label}</p>
                <p className="text-xs mt-1">{info.subtitle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
