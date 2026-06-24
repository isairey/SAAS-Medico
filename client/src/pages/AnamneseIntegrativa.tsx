import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Stethoscope, ChevronRight, ChevronLeft, Check, Info, Sparkles, AlertTriangle, Heart, Brain, Pill, Target, DollarSign, Save } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Microtextos comerciais de transição ─────────────────────
const STEP_LABELS: Record<number, { title: string; subtitle: string; icon: any; microtext: string }> = {
  1: { title: "Dados e Clínico Básico", subtitle: "Vamos conhecer você e seu histórico clínico", icon: Heart, microtext: "Essas informações nos permitem personalizar completamente o seu protocolo de saúde. Cada detalhe importa para um tratamento seguro e eficaz." },
  2: { title: "Sintomas Funcionais", subtitle: "Como você está se sentindo no dia a dia?", icon: Brain, microtext: "Seus sintomas funcionais são a bússola do tratamento integrativo. Eles revelam o que os exames tradicionais muitas vezes não captam." },
  3: { title: "Cirurgias, Medicamentos e Hábitos", subtitle: "Histórico completo para sua segurança", icon: Pill, microtext: "Conhecer seus medicamentos e hábitos é essencial para evitar interações e personalizar as fórmulas com máxima segurança." },
  4: { title: "Preferências Terapêuticas", subtitle: "O tratamento ideal é o que se adapta a você", icon: Target, microtext: "Suas preferências guiam a escolha do protocolo. Não existe tratamento genérico — cada detalhe é pensado para o seu perfil." },
  5: { title: "Informações Complementares", subtitle: "Últimos detalhes para completar seu perfil", icon: DollarSign, microtext: "Essas informações nos ajudam a adequar o protocolo ao seu momento de vida e garantir a melhor experiência possível." },
};

// ─── Perfis de demonstração ──────────────────────────────────
const DEMO_PROFILES: Record<string, { name: string; desc: string; answers: Record<string, any> }> = {
  basico: {
    name: "Mariana (Básico)",
    desc: "32 anos, saudável, busca otimização. Score esperado: 15-25",
    answers: { "SINT_SONO_001": 7, "SINT_ENER_002": 7, "SINT_FOCO_003": 8, "SINT_LIBI_004": 7, "SINT_HUMO_005": 8, "SINT_DIGE_006": 7 },
  },
  avancado: {
    name: "Carlos (Avançado)",
    desc: "55 anos, HAS + diabetes, múltiplos medicamentos. Score esperado: 55-75",
    answers: { "CARD_DOEN_HASA_001": true, "META_DOEN_DIAB_001": "Diabetes Tipo 2", "META_DOEN_DISL_002": true, "MEDI_CONT_001": true, "SINT_SONO_001": 4, "SINT_ENER_002": 3, "SINT_FOCO_003": 5, "SINT_LIBI_004": 3, "SINT_HUMO_005": 4, "SINT_DIGE_006": 5 },
  },
  full: {
    name: "Helena (Full)",
    desc: "62 anos, pós-infarto, Hashimoto, polifarmácia. Score esperado: 82-100",
    answers: { "CARD_DOEN_HASA_001": true, "CARD_DOEN_INFA_002": true, "META_DOEN_DIAB_001": "Diabetes Tipo 2", "META_DOEN_DISL_002": true, "ENDO_DOEN_TIRO_001": "Hashimoto", "MEDI_CONT_001": true, "SINT_SONO_001": 2, "SINT_ENER_002": 2, "SINT_FOCO_003": 3, "SINT_LIBI_004": 1, "SINT_HUMO_005": 3, "SINT_DIGE_006": 3 },
  },
};

// ─── Hook de autosave em localStorage ────────────────────────
function useDraft(key: string) {
  const storageKey = `padcom_draft_${key}`;
  const [draft, setDraft] = useState<Record<number, any>>(() => {
    try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : {}; }
    catch { return {}; }
  });
  const saveDraft = useCallback((data: Record<number, any>) => {
    setDraft(data);
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch {}
  }, [storageKey]);
  const clearDraft = useCallback(() => {
    setDraft({});
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);
  return { draft, saveDraft, clearDraft };
}

export default function AnamneseIntegrativa() {
  const { data: patients } = trpc.patient.list.useQuery();
  const { data: questions } = trpc.question.list.useQuery({ category: "integrativa" });
  const createSession = trpc.anamnesis.createSession.useMutation();
  const saveResponses = trpc.anamnesis.saveResponses.useMutation();
  const completeSession = trpc.anamnesis.completeSession.useMutation();
  const calculateScore = trpc.scoring.calculate.useMutation();

  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showScore, setShowScore] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const { draft, saveDraft, clearDraft } = useDraft(selectedPatient || "new");
  const [answers, setAnswers] = useState<Record<number, any>>(draft);

  // Autosave on answer change
  useEffect(() => { if (Object.keys(answers).length > 0) saveDraft(answers); }, [answers, saveDraft]);

  // Group questions by step (1-5)
  const stepQuestions = useMemo(() => {
    if (!questions) return {};
    const grouped: Record<number, any[]> = {};
    (questions as any[]).filter((q: any) => q.isActive).forEach((q: any) => {
      const step = q.step ?? 1;
      if (!grouped[step]) grouped[step] = [];
      grouped[step].push(q);
    });
    // Sort within each step
    Object.values(grouped).forEach(arr => arr.sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    return grouped;
  }, [questions]);

  const totalSteps = Math.max(...Object.keys(stepQuestions).map(Number), 5);
  const currentQuestions = stepQuestions[currentStep] ?? [];
  const progress = (currentStep / totalSteps) * 100;
  const stepInfo = STEP_LABELS[currentStep] ?? STEP_LABELS[1];
  const StepIcon = stepInfo.icon;

  const startSession = async () => {
    if (!selectedPatient && !demoMode) { toast.error("Selecione um paciente"); return; }
    if (demoMode) { setSessionId(-1); setCurrentStep(1); return; }
    try {
      const result = await createSession.mutateAsync({ patientId: Number(selectedPatient), category: "integrativa", conductedByType: "medico" });
      setSessionId(result.id);
      setCurrentStep(1);
      toast.success("Sessão iniciada");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAnswer = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const loadDemoProfile = (profileKey: string) => {
    const profile = DEMO_PROFILES[profileKey];
    if (!profile || !questions) return;
    const newAnswers: Record<number, any> = {};
    (questions as any[]).forEach((q: any) => {
      if (q.code && profile.answers[q.code] !== undefined) {
        newAnswers[q.id] = profile.answers[q.code];
      }
    });
    setAnswers(newAnswers);
    setDemoMode(true);
    toast.success(`Perfil "${profile.name}" carregado`);
  };

  const handleSavePartial = async () => {
    if (!sessionId || sessionId === -1) return;
    try {
      const responses = buildResponses();
      await saveResponses.mutateAsync({ sessionId, responses });
      toast.success("Progresso salvo");
    } catch (e: any) { toast.error(e.message); }
  };

  const buildResponses = () => {
    return Object.entries(answers).map(([qId, val]) => ({
      questionId: Number(qId),
      answerText: typeof val === "string" ? val : typeof val === "boolean" ? (val ? "sim" : "nao") : undefined,
      answerNumber: typeof val === "number" ? String(val) : undefined,
      answerJson: Array.isArray(val) ? val : undefined,
    }));
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      const responses = buildResponses();
      if (sessionId !== -1) {
        await saveResponses.mutateAsync({ sessionId, responses });
        await completeSession.mutateAsync({ sessionId });
      }
      // Calculate score
      try {
        const result = await calculateScore.mutateAsync({ responses });
        setScoreResult(result);
      } catch { /* score calculation is optional */ }
      setShowScore(true);
      clearDraft();
      toast.success("Anamnese integrativa concluída!");
    } catch (e: any) { toast.error(e.message); }
  };

  // ─── Score Result Screen ───────────────────────────────────
  if (showScore) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Anamnese Concluída</h1>
          <p className="text-muted-foreground">Resultado do Motor Clínico V15</p>
        </div>

        {scoreResult && (
          <>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="text-6xl font-bold text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {scoreResult.normalizedScore}
                </div>
                <p className="text-sm text-muted-foreground mt-1">pontos de 100</p>
                {scoreResult.band && (
                  <Badge className="mt-3 text-sm px-4 py-1" style={{ backgroundColor: scoreResult.band.color + "20", color: scoreResult.band.color, borderColor: scoreResult.band.color }}>
                    Faixa: {scoreResult.band.name}
                  </Badge>
                )}
                {scoreResult.band?.description && (
                  <p className="text-sm text-muted-foreground mt-3">{scoreResult.band.description}</p>
                )}
              </CardContent>
            </Card>

            {scoreResult.flags?.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Flags Clínicas Detectadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scoreResult.flags.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant={f.type === "validation" ? "destructive" : "secondary"} className="text-xs shrink-0">{f.type}</Badge>
                      <span>{f.description}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {scoreResult.motorActions?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Ações Sugeridas pelo Motor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scoreResult.motorActions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50">
                      <Badge variant="outline" className="text-xs shrink-0">{a.actionType}</Badge>
                      <span>{a.actionValue}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {scoreResult.axisScores && Object.keys(scoreResult.axisScores).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Score por Eixo Clínico</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(scoreResult.axisScores).map(([axis, score]) => (
                    <div key={axis} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{axis.replace(/_/g, " ")}</span>
                        <span className="font-semibold">{score as number}%</span>
                      </div>
                      <Progress value={score as number} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setShowScore(false); setSessionId(null); setAnswers({}); setScoreResult(null); setDemoMode(false); }}>
            Nova Anamnese
          </Button>
        </div>
      </div>
    );
  }

  // ─── Session Start Screen ──────────────────────────────────
  if (!sessionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" /> Anamnese Integrativa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Via 1 — Formulário em 5 etapas com Motor Clínico V15</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Iniciar Nova Anamnese</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {(patients ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={startSession} className="w-full" disabled={createSession.isPending}>Iniciar Anamnese</Button>
              {Object.keys(draft).length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  <Save className="h-3 w-3 inline mr-1" />Rascunho salvo com {Object.keys(draft).length} respostas
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Modo Demonstração
              </CardTitle>
              <CardDescription>Teste o motor com perfis fictícios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(DEMO_PROFILES).map(([key, profile]) => (
                <Button key={key} variant="outline" className="w-full justify-start text-left h-auto py-2" onClick={() => { loadDemoProfile(key); startSession(); }}>
                  <div>
                    <div className="font-medium text-sm">{profile.name}</div>
                    <div className="text-xs text-muted-foreground">{profile.desc}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {Object.keys(stepQuestions).length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma pergunta cadastrada. Execute o seed ou acesse "Perguntas" no menu para criar o questionário.
          </CardContent></Card>
        )}
      </div>
    );
  }

  // ─── Step Navigation ───────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header with step info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Etapa {currentStep}: {stepInfo.title}</h1>
            <p className="text-sm text-muted-foreground">{stepInfo.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <Badge variant="secondary" className="text-xs">Demo</Badge>}
          <Badge variant="outline" className="text-xs">{Math.round(progress)}%</Badge>
        </div>
      </div>

      {/* Progress bar with step indicators */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
            <button key={step} onClick={() => setCurrentStep(step)}
              className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${step < currentStep ? "bg-primary" : step === currentStep ? "bg-primary/70" : "bg-muted"}`} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
            <span key={step} className={step === currentStep ? "text-primary font-medium" : ""}>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Microtext */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm text-muted-foreground italic">
        {stepInfo.microtext}
      </div>

      {/* Questions */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {currentQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma pergunta nesta etapa. Avance para a próxima.</p>
          ) : (
            currentQuestions.map((q: any) => (
              <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v: any) => handleAnswer(q.id, v)} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="flex gap-2">
          {sessionId !== -1 && (
            <Button variant="ghost" size="sm" onClick={handleSavePartial} disabled={saveResponses.isPending}>
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          )}
          {currentStep === totalSteps ? (
            <Button onClick={handleComplete} className="gap-1" disabled={saveResponses.isPending || completeSession.isPending}>
              <Check className="h-4 w-4" /> Concluir Anamnese
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))} className="gap-1">
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Question Field Component ────────────────────────────────
function QuestionField({ question, value, onChange }: { question: any; value: any; onChange: (v: any) => void }) {
  const q = question;
  return (
    <div className="space-y-2 p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-sm font-medium leading-relaxed">
          {q.questionText} {q.isRequired && <span className="text-destructive">*</span>}
        </Label>
        {q.technicalName && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">{q.technicalName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {q.code && <div><span className="font-medium text-muted-foreground">Código:</span> <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{q.code}</code></div>}
                {q.clinicalGoal && <div><span className="font-medium text-muted-foreground">Objetivo Clínico:</span> {q.clinicalGoal}</div>}
                {q.commercialGoal && <div><span className="font-medium text-muted-foreground">Objetivo Comercial:</span> {q.commercialGoal}</div>}
                {q.weight && <div><span className="font-medium text-muted-foreground">Peso no Score:</span> {q.weight}</div>}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {q.helper && <p className="text-xs text-muted-foreground -mt-1">{q.helper}</p>}

      {q.fieldType === "text" && <Input value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="Digite sua resposta" />}
      {q.fieldType === "textarea" && <Textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="Descreva em detalhes" rows={3} />}
      {q.fieldType === "number" && <Input type="number" value={value ?? ""} onChange={e => onChange(Number(e.target.value))} />}
      {q.fieldType === "date" && <Input type="date" value={value ?? ""} onChange={e => onChange(e.target.value)} />}
      {q.fieldType === "scale" && (
        <div className="space-y-2 pt-1">
          <Slider value={[value ?? q.scaleMin ?? 0]} min={q.scaleMin ?? 0} max={q.scaleMax ?? 10} step={0.5} onValueChange={([v]) => onChange(v)} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{q.scaleMin ?? 0}</span>
            <span className="font-bold text-lg text-primary">{value ?? q.scaleMin ?? 0}</span>
            <span>{q.scaleMax ?? 10}</span>
          </div>
        </div>
      )}
      {q.fieldType === "select" && (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {(q.options ?? []).map((opt: string, i: number) => (
              <SelectItem key={i} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {q.fieldType === "multiselect" && (
        <div className="grid grid-cols-2 gap-2">
          {(q.options ?? []).map((opt: string, i: number) => {
            const selected = Array.isArray(value) ? value : [];
            const isChecked = selected.includes(opt);
            return (
              <label key={i} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${isChecked ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                <Checkbox checked={isChecked} onCheckedChange={checked => {
                  onChange(checked ? [...selected, opt] : selected.filter((s: string) => s !== opt));
                }} />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
      {q.fieldType === "checkbox" && (
        <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${value ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
          <Checkbox checked={!!value} onCheckedChange={onChange} />
          <span className="text-sm font-medium">Sim</span>
        </label>
      )}
    </div>
  );
}
