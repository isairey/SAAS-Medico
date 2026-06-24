import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AnamneseEstetica() {
  const { data: patients } = trpc.patient.list.useQuery();
  const { data: questions } = trpc.question.list.useQuery({ category: "estetica" });
  const createSession = trpc.anamnesis.createSession.useMutation();
  const saveResponses = trpc.anamnesis.saveResponses.useMutation();
  const completeSession = trpc.anamnesis.completeSession.useMutation();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

  const sections = useMemo(() => {
    if (!questions) return [];
    const secs: Record<string, any[]> = {};
    questions.forEach((q: any) => { if (!q.isActive) return; if (!secs[q.section]) secs[q.section] = []; secs[q.section].push(q); });
    return Object.entries(secs).map(([name, qs]) => ({ name, questions: qs }));
  }, [questions]);

  const startSession = async () => {
    if (!selectedPatient) { toast.error("Selecione um paciente"); return; }
    try {
      const result = await createSession.mutateAsync({ patientId: Number(selectedPatient), category: "estetica", conductedByType: "medico" });
      setSessionId(result.id);
      setCurrentStep(0);
      toast.success("Sessão de estética iniciada");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAnswer = (questionId: number, value: any) => { setAnswers(prev => ({ ...prev, [questionId]: value })); };
  const handleNext = () => { if (currentStep < sections.length - 1) setCurrentStep(s => s + 1); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      const responses = Object.entries(answers).map(([qId, val]) => ({
        questionId: Number(qId),
        answerText: typeof val === "string" ? val : undefined,
        answerNumber: typeof val === "number" ? String(val) : undefined,
        answerJson: typeof val === "object" ? val : undefined,
      }));
      await saveResponses.mutateAsync({ sessionId, responses });
      await completeSession.mutateAsync({ sessionId });
      toast.success("Anamnese estética concluída!");
      setSessionId(null); setAnswers({}); setSelectedPatient("");
    } catch (e: any) { toast.error(e.message); }
  };

  if (!sessionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Anamnese Estética
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Via 2 — Avaliação estética paralela e independente</p>
        </div>
        <Card className="max-w-md">
          <CardHeader><CardTitle className="text-base">Iniciar Avaliação Estética</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>{(patients ?? []).map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Button onClick={startSession} className="w-full" disabled={createSession.isPending}>Iniciar Avaliação</Button>
          </CardContent>
        </Card>
        {sections.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma pergunta estética cadastrada. Acesse "Perguntas" para criar.
          </CardContent></Card>
        )}
      </div>
    );
  }

  const currentSection = sections[currentStep];
  const progress = sections.length > 0 ? ((currentStep + 1) / sections.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Anamnese Estética</h1>
          <p className="text-sm text-muted-foreground">Seção {currentStep + 1} de {sections.length}: {currentSection?.name}</p>
        </div>
        <Badge variant="outline" className="text-xs">{Math.round(progress)}%</Badge>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
      <Card><CardContent className="p-6 space-y-6">
        {currentSection?.questions.map((q: any) => (<QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v: any) => handleAnswer(q.id, v)} />))}
      </CardContent></Card>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-1"><ChevronLeft className="h-4 w-4" /> Anterior</Button>
        {currentStep === sections.length - 1 ? (
          <Button onClick={handleComplete} className="gap-1" disabled={saveResponses.isPending}><Check className="h-4 w-4" /> Concluir</Button>
        ) : (
          <Button onClick={handleNext} className="gap-1">Próxima <ChevronRight className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}

function QuestionField({ question, value, onChange }: { question: any; value: any; onChange: (v: any) => void }) {
  const q = question;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{q.questionText} {q.isRequired && <span className="text-destructive">*</span>}</Label>
      {q.fieldType === "text" && <Input value={value ?? ""} onChange={e => onChange(e.target.value)} />}
      {q.fieldType === "textarea" && <Textarea value={value ?? ""} onChange={e => onChange(e.target.value)} rows={3} />}
      {q.fieldType === "number" && <Input type="number" value={value ?? ""} onChange={e => onChange(Number(e.target.value))} />}
      {q.fieldType === "date" && <Input type="date" value={value ?? ""} onChange={e => onChange(e.target.value)} />}
      {q.fieldType === "scale" && (
        <div className="space-y-2">
          <Slider value={[value ?? q.scaleMin ?? 0]} min={q.scaleMin ?? 0} max={q.scaleMax ?? 10} step={0.5} onValueChange={([v]) => onChange(v)} />
          <div className="flex justify-between text-xs text-muted-foreground"><span>{q.scaleMin ?? 0}</span><span className="font-semibold text-foreground">{value ?? 0}</span><span>{q.scaleMax ?? 10}</span></div>
        </div>
      )}
      {q.fieldType === "select" && (
        <Select value={value ?? ""} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{(q.options ?? []).map((opt: string, i: number) => (<SelectItem key={i} value={opt}>{opt}</SelectItem>))}</SelectContent>
        </Select>
      )}
      {q.fieldType === "multiselect" && (
        <div className="space-y-2">{(q.options ?? []).map((opt: string, i: number) => {
          const selected = Array.isArray(value) ? value : [];
          return (<div key={i} className="flex items-center gap-2"><Checkbox checked={selected.includes(opt)} onCheckedChange={checked => { onChange(checked ? [...selected, opt] : selected.filter((s: string) => s !== opt)); }} /><span className="text-sm">{opt}</span></div>);
        })}</div>
      )}
      {q.fieldType === "checkbox" && (<div className="flex items-center gap-2"><Checkbox checked={!!value} onCheckedChange={onChange} /><span className="text-sm">Sim</span></div>)}
    </div>
  );
}
