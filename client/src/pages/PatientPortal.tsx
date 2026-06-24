import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Sun, Sunset, Moon, AlertTriangle, Check, ChevronRight, ChevronLeft, Heart, Brain, Pill, Target, DollarSign, Info } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const STEP_LABELS: Record<number, { title: string; subtitle: string; icon: any }> = {
  1: { title: "Dados e Clínico Básico", subtitle: "Vamos conhecer você e seu histórico", icon: Heart },
  2: { title: "Sintomas Funcionais", subtitle: "Como você está se sentindo?", icon: Brain },
  3: { title: "Medicamentos e Hábitos", subtitle: "Seu histórico completo", icon: Pill },
  4: { title: "Preferências", subtitle: "O tratamento ideal para você", icon: Target },
  5: { title: "Informações Finais", subtitle: "Últimos detalhes", icon: DollarSign },
};

export default function PatientPortal() {
  const params = useParams<{ token: string; tab?: string; slug?: string }>();
  const token = params.token;
  const slug = params.slug;
  const { data: patient, isLoading } = trpc.patient.getByToken.useQuery({ token }, { enabled: !!token });
  const { data: clinic } = trpc.clinic.getBySlug.useQuery({ slug: slug! }, { enabled: !!slug });
  const [activeTab, setActiveTab] = useState(params.tab || "relato");

  // Apply clinic branding dynamically
  useEffect(() => {
    if (clinic?.primaryColor) {
      document.documentElement.style.setProperty('--clinic-primary', clinic.primaryColor);
      document.documentElement.style.setProperty('--clinic-secondary', clinic.secondaryColor || '#D4AF37');
    }
    return () => {
      document.documentElement.style.removeProperty('--clinic-primary');
      document.documentElement.style.removeProperty('--clinic-secondary');
    };
  }, [clinic]);

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Link Inválido</h2>
        <p className="text-sm text-muted-foreground">Este link de acesso não é válido ou expirou. Entre em contato com sua clínica.</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {clinic?.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name || 'Clínica'} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: clinic?.primaryColor || 'oklch(0.37 0.08 165)' }}>
              {clinic?.name?.charAt(0) || <Stethoscope className="h-5 w-5" />}
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ color: clinic?.primaryColor || undefined }}>{clinic?.name || 'PADCOM'}</h1>
            <p className="text-[11px] text-muted-foreground">Olá, {patient.name?.split(" ")[0]}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="relato" className="text-xs">Relato Diário</TabsTrigger>
            <TabsTrigger value="prescricoes" className="text-xs">Minhas Fórmulas</TabsTrigger>
            <TabsTrigger value="anamnese" className="text-xs">Anamnese</TabsTrigger>
          </TabsList>

          <TabsContent value="relato"><DailyReportForm patientId={patient.id} /></TabsContent>
          <TabsContent value="prescricoes"><PrescriptionReports patientId={patient.id} /></TabsContent>
          <TabsContent value="anamnese"><PatientAnamnese patientId={patient.id} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Daily Report Form ───────────────────────────────────────
function DailyReportForm({ patientId }: { patientId: number }) {
  const createReport = trpc.dailyReport.create.useMutation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    period: "" as string,
    sleep: 5, energy: 5, mood: 5, focus: 5, concentration: 5, libido: 5, strength: 5, physicalActivity: 5,
    systolicBP: "", diastolicBP: "", weight: "", generalNotes: "",
  });

  const handleSubmit = async () => {
    if (!form.period) { toast.error("Selecione o período do dia"); return; }
    try {
      await createReport.mutateAsync({
        patientId,
        reportDate: form.reportDate,
        period: form.period as any,
        sleep: String(form.sleep), energy: String(form.energy), mood: String(form.mood),
        focus: String(form.focus), concentration: String(form.concentration), libido: String(form.libido),
        strength: String(form.strength), physicalActivity: String(form.physicalActivity),
        systolicBP: form.systolicBP ? Number(form.systolicBP) : undefined,
        diastolicBP: form.diastolicBP ? Number(form.diastolicBP) : undefined,
        weight: form.weight || undefined,
        generalNotes: form.generalNotes || undefined,
      });
      setSubmitted(true);
      toast.success("Relato enviado com sucesso!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (submitted) return (
    <Card><CardContent className="p-8 text-center">
      <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">Relato Enviado!</h2>
      <p className="text-sm text-muted-foreground mb-4">Seu relato diário foi registrado com sucesso.</p>
      <Button onClick={() => setSubmitted(false)}>Enviar Outro Relato</Button>
    </CardContent></Card>
  );

  const periodIcon = { manha: Sun, tarde: Sunset, noite: Moon };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relato Diário</CardTitle>
        <CardDescription className="text-xs">Registre como você está se sentindo hoje</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label className="text-xs">Data</Label><Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} /></div>
          <div className="space-y-2">
            <Label className="text-xs">Período *</Label>
            <div className="flex gap-1.5">
              {(["manha", "tarde", "noite"] as const).map(p => {
                const Icon = periodIcon[p];
                return (
                  <Button key={p} variant={form.period === p ? "default" : "outline"} size="sm" className="flex-1 gap-1 text-[11px] h-9"
                    onClick={() => setForm(f => ({ ...f, period: p }))}>
                    <Icon className="h-3.5 w-3.5" />
                    {p === "manha" ? "Manhã" : p === "tarde" ? "Tarde" : "Noite"}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: "sleep", label: "Sono", helper: "0 = péssimo, 10 = excelente" },
            { key: "energy", label: "Energia", helper: "0 = sem energia, 10 = muito disposto" },
            { key: "mood", label: "Humor", helper: "0 = muito deprimido, 10 = ótimo humor" },
            { key: "focus", label: "Foco", helper: "0 = sem concentração, 10 = foco total" },
            { key: "concentration", label: "Concentração", helper: "0 = disperso, 10 = concentrado" },
            { key: "libido", label: "Libido", helper: "0 = ausente, 10 = muito presente" },
            { key: "strength", label: "Força", helper: "0 = sem força, 10 = muito forte" },
            { key: "physicalActivity", label: "Atividade Física", helper: "0 = sedentário, 10 = muito ativo" },
          ].map(({ key, label, helper }) => (
            <div key={key} className="space-y-1.5 p-3 rounded-lg border bg-card">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-xs font-medium">{label}</Label>
                  <p className="text-[10px] text-muted-foreground">{helper}</p>
                </div>
                <span className="text-lg font-bold text-primary min-w-[2rem] text-right">{(form as any)[key]}</span>
              </div>
              <Slider value={[(form as any)[key]]} min={0} max={10} step={0.5} onValueChange={([v]) => setForm(f => ({ ...f, [key]: v }))} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1"><Label className="text-[10px]">PA Sistólica</Label><Input type="number" value={form.systolicBP} onChange={e => setForm(f => ({ ...f, systolicBP: e.target.value }))} placeholder="120" className="h-9 text-sm" /></div>
          <div className="space-y-1"><Label className="text-[10px]">PA Diastólica</Label><Input type="number" value={form.diastolicBP} onChange={e => setForm(f => ({ ...f, diastolicBP: e.target.value }))} placeholder="80" className="h-9 text-sm" /></div>
          <div className="space-y-1"><Label className="text-[10px]">Peso (kg)</Label><Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="75" className="h-9 text-sm" /></div>
        </div>

        <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea value={form.generalNotes} onChange={e => setForm(f => ({ ...f, generalNotes: e.target.value }))} rows={2} placeholder="Como você está se sentindo hoje?" /></div>

        {/* Sticky CTA */}
        <div className="sticky bottom-4 pt-2">
          <Button onClick={handleSubmit} className="w-full shadow-lg" size="lg" disabled={createReport.isPending}>
            {createReport.isPending ? "Enviando..." : "Enviar Relato"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Prescription Reports ────────────────────────────────────
function PrescriptionReports({ patientId }: { patientId: number }) {
  const { data: prescriptions } = trpc.prescription.list.useQuery({ patientId });
  const createReport = trpc.prescriptionReport.create.useMutation();
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);
  const [reportForm, setReportForm] = useState({ reportType: "reacao_adversa" as string, severity: "leve" as string, description: "" });
  const [submitted, setSubmitted] = useState(false);

  const activePrescriptions = (prescriptions ?? []).filter((p: any) => p.status === "ativa");

  const handleReport = async () => {
    if (!selectedPrescription || !reportForm.description) { toast.error("Selecione a fórmula e descreva o ocorrido"); return; }
    try {
      await createReport.mutateAsync({
        prescriptionId: selectedPrescription,
        patientId,
        reportType: reportForm.reportType as any,
        severity: reportForm.severity as any,
        description: reportForm.description,
      });
      setSubmitted(true);
      toast.success("Relato enviado! A equipe será notificada.");
    } catch (e: any) { toast.error(e.message); }
  };

  if (submitted) return (
    <Card><CardContent className="p-8 text-center">
      <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">Relato Enviado!</h2>
      <p className="text-sm text-muted-foreground mb-4">A equipe médica será notificada sobre sua experiência com a fórmula.</p>
      <Button onClick={() => { setSubmitted(false); setSelectedPrescription(null); setReportForm({ reportType: "reacao_adversa", severity: "leve", description: "" }); }}>Enviar Outro Relato</Button>
    </CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suas Fórmulas Ativas</CardTitle>
          <CardDescription className="text-xs">Selecione uma fórmula para reportar sua experiência</CardDescription>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fórmula ativa no momento</p>
          ) : (
            <div className="space-y-2">
              {activePrescriptions.map((p: any) => (
                <button key={p.id}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedPrescription === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/30"}`}
                  onClick={() => setSelectedPrescription(p.id)}>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.code} | {p.dosage} | {p.frequency}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPrescription && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Reportar Experiência</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs">Tipo</Label>
                <Select value={reportForm.reportType} onValueChange={v => setReportForm(f => ({ ...f, reportType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reacao_adversa">Reação Adversa</SelectItem>
                    <SelectItem value="melhora">Melhora</SelectItem>
                    <SelectItem value="sem_efeito">Sem Efeito</SelectItem>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs">Gravidade</Label>
                <Select value={reportForm.severity} onValueChange={v => setReportForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Descreva o que ocorreu</Label><Textarea value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Ex: Senti queimação no estômago após a 2ª tomada..." /></div>
            <div className="sticky bottom-4 pt-2">
              <Button onClick={handleReport} className="w-full shadow-lg" size="lg" disabled={createReport.isPending}>{createReport.isPending ? "Enviando..." : "Enviar Relato"}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Patient Anamnese (V15 5-step flow) ──────────────────────
function PatientAnamnese({ patientId }: { patientId: number }) {
  const { data: questions } = trpc.question.list.useQuery({ category: "integrativa" });
  const createSession = trpc.anamnesis.createSession.useMutation();
  const saveResponses = trpc.anamnesis.saveResponses.useMutation();
  const completeSession = trpc.anamnesis.completeSession.useMutation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [completed, setCompleted] = useState(false);

  // Group questions by V15 step
  const stepQuestions = useMemo(() => {
    if (!questions) return {};
    const grouped: Record<number, any[]> = {};
    (questions as any[]).filter((q: any) => q.isActive).forEach((q: any) => {
      const step = q.step ?? 1;
      if (!grouped[step]) grouped[step] = [];
      grouped[step].push(q);
    });
    Object.values(grouped).forEach(arr => arr.sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    return grouped;
  }, [questions]);

  const totalSteps = Math.max(...Object.keys(stepQuestions).map(Number), 5);
  const currentQuestions = stepQuestions[currentStep] ?? [];
  const progress = (currentStep / totalSteps) * 100;
  const stepInfo = STEP_LABELS[currentStep] ?? STEP_LABELS[1];
  const StepIcon = stepInfo.icon;

  // Autosave to localStorage
  const storageKey = `padcom_portal_draft_${patientId}`;
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try { localStorage.setItem(storageKey, JSON.stringify(answers)); } catch {}
    }
  }, [answers, storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setAnswers(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  const startSession = async () => {
    try {
      const result = await createSession.mutateAsync({ patientId, category: "integrativa", conductedByType: "paciente" });
      setSessionId(result.id);
      setCurrentStep(1);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      const responses = Object.entries(answers).map(([qId, val]) => ({
        questionId: Number(qId),
        answerText: typeof val === "string" ? val : typeof val === "boolean" ? (val ? "sim" : "nao") : undefined,
        answerNumber: typeof val === "number" ? String(val) : undefined,
        answerJson: Array.isArray(val) ? val : undefined,
      }));
      await saveResponses.mutateAsync({ sessionId, responses });
      await completeSession.mutateAsync({ sessionId });
      try { localStorage.removeItem(storageKey); } catch {}
      setCompleted(true);
      toast.success("Anamnese concluída!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (completed) return (
    <Card><CardContent className="p-8 text-center">
      <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">Anamnese Concluída!</h2>
      <p className="text-sm text-muted-foreground">Obrigado por preencher. O médico terá acesso às suas respostas na próxima consulta.</p>
    </CardContent></Card>
  );

  if (!sessionId) return (
    <Card>
      <CardContent className="p-8 text-center">
        <Stethoscope className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Anamnese Clínica</h2>
        <p className="text-sm text-muted-foreground mb-4">Preencha o questionário em 5 etapas para que o médico tenha acesso ao seu histórico de saúde completo.</p>
        {Object.keys(stepQuestions).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum questionário disponível no momento.</p>
        ) : (
          <>
            <Button onClick={startSession} disabled={createSession.isPending} size="lg">Iniciar Anamnese</Button>
            {Object.keys(answers).length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">Rascunho salvo com {Object.keys(answers).length} respostas</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Step header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <StepIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Etapa {currentStep}: {stepInfo.title}</h2>
          <p className="text-xs text-muted-foreground">{stepInfo.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">{Math.round(progress)}%</Badge>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
          <div key={step} className={`h-1.5 flex-1 rounded-full transition-all ${step < currentStep ? "bg-primary" : step === currentStep ? "bg-primary/60" : "bg-muted"}`} />
        ))}
      </div>

      {/* Questions */}
      <Card>
        <CardContent className="p-5 space-y-5">
          {currentQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma pergunta nesta etapa. Avance para a próxima.</p>
          ) : (
            currentQuestions.map((q: any) => (
              <PortalQuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v: any) => setAnswers(prev => ({ ...prev, [q.id]: v }))} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Navigation - sticky */}
      <div className="sticky bottom-4 flex justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1} className="gap-1 shadow-sm">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        {currentStep === totalSteps ? (
          <Button onClick={handleComplete} className="gap-1 flex-1 shadow-lg" disabled={saveResponses.isPending || completeSession.isPending}>
            <Check className="h-4 w-4" /> Concluir Anamnese
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))} className="gap-1 flex-1 shadow-lg">
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Portal Question Field ───────────────────────────────────
function PortalQuestionField({ question, value, onChange }: { question: any; value: any; onChange: (v: any) => void }) {
  const q = question;
  return (
    <div className="space-y-2 p-3 rounded-lg border bg-card">
      <Label className="text-sm font-medium leading-relaxed">
        {q.questionText} {q.isRequired && <span className="text-destructive">*</span>}
      </Label>
      {q.helper && <p className="text-[10px] text-muted-foreground -mt-1">{q.helper}</p>}

      {q.fieldType === "text" && <Input value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="Digite sua resposta" />}
      {q.fieldType === "textarea" && <Textarea value={value ?? ""} onChange={e => onChange(e.target.value)} rows={3} placeholder="Descreva em detalhes" />}
      {q.fieldType === "number" && <Input type="number" value={value ?? ""} onChange={e => onChange(Number(e.target.value))} />}
      {q.fieldType === "date" && <Input type="date" value={value ?? ""} onChange={e => onChange(e.target.value)} />}
      {q.fieldType === "scale" && (
        <div className="space-y-1.5 pt-1">
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
          <SelectContent>{(q.options ?? []).map((opt: string, i: number) => (<SelectItem key={i} value={opt}>{opt}</SelectItem>))}</SelectContent>
        </Select>
      )}
      {q.fieldType === "multiselect" && (
        <div className="grid grid-cols-2 gap-2">
          {(q.options ?? []).map((opt: string, i: number) => {
            const selected = Array.isArray(value) ? value : [];
            const isChecked = selected.includes(opt);
            return (
              <label key={i} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-sm ${isChecked ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                <Checkbox checked={isChecked} onCheckedChange={checked => {
                  onChange(checked ? [...selected, opt] : selected.filter((s: string) => s !== opt));
                }} />
                {opt}
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
