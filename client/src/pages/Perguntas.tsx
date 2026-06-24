import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardList, Plus, Pencil, Trash2, GripVertical, Video, Info, Beaker, Target, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const emptyForm = {
  questionText: "", section: "", fieldType: "text" as string, isRequired: false,
  options: "", scaleMin: "0", scaleMax: "10", sortOrder: "0",
  code: "", block: "", step: "", clinicalGoal: "", commercialGoal: "",
  helper: "", technicalName: "", weight: "", videoUrl: "",
};

export default function PerguntasPage() {
  const [category, setCategory] = useState<string>("integrativa");
  const { data: questions, isLoading } = trpc.question.list.useQuery({ category: category as any });
  const createMutation = trpc.question.create.useMutation();
  const updateMutation = trpc.question.update.useMutation();
  const deleteMutation = trpc.question.delete.useMutation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const resetForm = () => { setForm({ ...emptyForm }); setEditId(null); setShowAdvanced(false); };

  const handleSave = async () => {
    if (!form.questionText || !form.section) { toast.error("Preencha texto e seção"); return; }
    const payload: any = {
      questionText: form.questionText, section: form.section, fieldType: form.fieldType as any,
      category: category as any, isRequired: form.isRequired,
      options: form.options ? form.options.split(",").map(s => s.trim()) : undefined,
      scaleMin: form.fieldType === "scale" ? Number(form.scaleMin) : undefined,
      scaleMax: form.fieldType === "scale" ? Number(form.scaleMax) : undefined,
      sortOrder: Number(form.sortOrder),
    };
    if (form.code) payload.code = form.code;
    if (form.block) payload.block = form.block;
    if (form.step) payload.step = Number(form.step);
    if (form.clinicalGoal) payload.clinicalGoal = form.clinicalGoal;
    if (form.commercialGoal) payload.commercialGoal = form.commercialGoal;
    if (form.helper) payload.helper = form.helper;
    if (form.technicalName) payload.technicalName = form.technicalName;
    if (form.weight) payload.weight = form.weight;
    if (form.videoUrl) payload.videoUrl = form.videoUrl;
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload });
        toast.success("Pergunta atualizada!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Pergunta criada!");
      }
      utils.question.list.invalidate();
      setOpen(false); resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEdit = (q: any) => {
    setEditId(q.id);
    setForm({
      questionText: q.questionText, section: q.section, fieldType: q.fieldType,
      isRequired: q.isRequired, options: (q.options ?? []).join(", "),
      scaleMin: String(q.scaleMin ?? 0), scaleMax: String(q.scaleMax ?? 10), sortOrder: String(q.sortOrder ?? 0),
      code: q.code ?? "", block: q.block ?? "", step: q.step ? String(q.step) : "",
      clinicalGoal: q.clinicalGoal ?? "", commercialGoal: q.commercialGoal ?? "",
      helper: q.helper ?? "", technicalName: q.technicalName ?? "",
      weight: q.weight ?? "", videoUrl: q.videoUrl ?? "",
    });
    setShowAdvanced(!!(q.code || q.block || q.step || q.clinicalGoal || q.commercialGoal || q.helper || q.technicalName || q.weight || q.videoUrl));
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta pergunta?")) return;
    await deleteMutation.mutateAsync({ id });
    utils.question.list.invalidate();
    toast.success("Pergunta excluída");
  };

  const toggleActive = async (id: number, current: boolean) => {
    await updateMutation.mutateAsync({ id, isActive: !current });
    utils.question.list.invalidate();
  };

  const sections = Array.from(new Set((questions ?? []).map((q: any) => q.section)));

  const fieldTypeLabel: Record<string, string> = {
    text: "Texto", textarea: "Texto Longo", number: "Número", date: "Data",
    scale: "Escala", select: "Seleção", multiselect: "Multi-Seleção", checkbox: "Checkbox",
  };

  const stepLabel: Record<number, string> = { 1: "Dados + Clínico", 2: "Sintomas", 3: "Cirurgias + Meds", 4: "Preferências", 5: "Financeiro" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> Perguntas da Anamnese</h1>
          <p className="text-sm text-muted-foreground mt-1">Banco de perguntas da anamnese — cada pergunta tem código semântico, bloco clínico, peso no scoring e vídeo explicativo</p>
        </div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Pergunta</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Campos básicos */}
              <div className="space-y-2"><Label>Texto da Pergunta *</Label><Textarea value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} placeholder="Qual é a sua queixa principal?" rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Seção *</Label><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="Dados Pessoais" /></div>
                <div className="space-y-2"><Label>Tipo de Campo</Label>
                  <Select value={form.fieldType} onValueChange={v => setForm(f => ({ ...f, fieldType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(fieldTypeLabel).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              {(form.fieldType === "select" || form.fieldType === "multiselect") && (
                <div className="space-y-2"><Label>Opções (separadas por vírgula)</Label><Input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Opção 1, Opção 2, Opção 3" /></div>
              )}
              {form.fieldType === "scale" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Mínimo</Label><Input type="number" value={form.scaleMin} onChange={e => setForm(f => ({ ...f, scaleMin: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Máximo</Label><Input type="number" value={form.scaleMax} onChange={e => setForm(f => ({ ...f, scaleMax: e.target.value }))} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.isRequired} onCheckedChange={v => setForm(f => ({ ...f, isRequired: v }))} /><Label>Obrigatória</Label></div>
              </div>

              {/* Campos avançados V15 */}
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Campos Avançados V15 (Semânticos)
              </button>
              {showAdvanced && (
                <div className="space-y-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label className="text-xs">Código Semântico</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CARD_DOEN_HASA_001" className="text-xs font-mono" /></div>
                    <div className="space-y-2"><Label className="text-xs">Bloco Clínico</Label><Input value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} placeholder="CARDIO" className="text-xs" /></div>
                    <div className="space-y-2"><Label className="text-xs">Etapa (1-5)</Label>
                      <Select value={form.step} onValueChange={v => setForm(f => ({ ...f, step: v }))}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{[1,2,3,4,5].map(s => (<SelectItem key={s} value={String(s)}>{s} — {stepLabel[s]}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-xs">Nome Técnico</Label><Input value={form.technicalName} onChange={e => setForm(f => ({ ...f, technicalName: e.target.value }))} placeholder="Hipertensão Arterial Sistêmica" className="text-xs" /></div>
                    <div className="space-y-2"><Label className="text-xs">Peso (0.00 - 99.99)</Label><Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="3.50" className="text-xs" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">Objetivo Clínico</Label><Textarea value={form.clinicalGoal} onChange={e => setForm(f => ({ ...f, clinicalGoal: e.target.value }))} placeholder="Identificar risco cardiovascular para direcionar exames..." rows={2} className="text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Objetivo Comercial</Label><Textarea value={form.commercialGoal} onChange={e => setForm(f => ({ ...f, commercialGoal: e.target.value }))} placeholder="Paciente percebe valor do acompanhamento cardiológico..." rows={2} className="text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Helper (texto de ajuda para o paciente)</Label><Textarea value={form.helper} onChange={e => setForm(f => ({ ...f, helper: e.target.value }))} placeholder="Pressão alta é quando os valores ficam acima de 140/90..." rows={2} className="text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs flex items-center gap-1"><Video className="h-3 w-3" /> URL do Vídeo Explicativo</Label><Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="text-xs" /></div>
                </div>
              )}

              <Button onClick={handleSave} className="w-full">{editId ? "Atualizar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="integrativa">Integrativa</TabsTrigger>
          <TabsTrigger value="estetica">Estética</TabsTrigger>
          <TabsTrigger value="relato_diario">Relato Diário</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{(questions ?? []).length} perguntas</span>
        <span>{(questions ?? []).filter((q: any) => q.isActive).length} ativas</span>
        <span>{(questions ?? []).filter((q: any) => q.code).length} com código semântico</span>
        <span>{(questions ?? []).filter((q: any) => q.videoUrl).length} com vídeo</span>
      </div>

      {isLoading ? <div className="text-center p-8 text-muted-foreground">Carregando...</div> : !questions?.length ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhuma pergunta cadastrada nesta categoria</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sections.map(sec => (
            <div key={sec}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{sec}</h3>
              <div className="space-y-1">
                {(questions ?? []).filter((q: any) => q.section === sec).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((q: any) => (
                  <Card key={q.id} className={`${!q.isActive ? "opacity-50" : ""} transition-all`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                          <p className="text-sm font-medium truncate">{q.questionText}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{fieldTypeLabel[q.fieldType] ?? q.fieldType}</Badge>
                            {q.isRequired && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600">Obrigatória</Badge>}
                            {q.code && <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 font-mono">{q.code}</Badge>}
                            {q.step && <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600">Etapa {q.step}</Badge>}
                            {q.weight && <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600">Peso: {q.weight}</Badge>}
                            {q.videoUrl && <Tooltip><TooltipTrigger><Video className="h-3 w-3 text-primary" /></TooltipTrigger><TooltipContent>Vídeo explicativo disponível</TooltipContent></Tooltip>}
                          </div>
                        </div>
                        <Switch checked={q.isActive} onCheckedChange={() => toggleActive(q.id, q.isActive)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(q)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      {/* Expanded details */}
                      {expandedQ === q.id && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-xs text-muted-foreground">
                          {q.technicalName && <div className="flex gap-2"><Beaker className="h-3 w-3 shrink-0 mt-0.5" /><span><strong>Nome técnico:</strong> {q.technicalName}</span></div>}
                          {q.clinicalGoal && <div className="flex gap-2"><Target className="h-3 w-3 shrink-0 mt-0.5" /><span><strong>Objetivo clínico:</strong> {q.clinicalGoal}</span></div>}
                          {q.commercialGoal && <div className="flex gap-2"><Target className="h-3 w-3 shrink-0 mt-0.5" /><span><strong>Objetivo comercial:</strong> {q.commercialGoal}</span></div>}
                          {q.helper && <div className="flex gap-2"><Info className="h-3 w-3 shrink-0 mt-0.5" /><span><strong>Helper:</strong> {q.helper}</span></div>}
                          {q.block && <span><strong>Bloco:</strong> {q.block}</span>}
                          {q.videoUrl && (
                            <div className="flex gap-2 items-center">
                              <Video className="h-3 w-3 shrink-0" />
                              <a href={q.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{q.videoUrl}</a>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
