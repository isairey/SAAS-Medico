import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Send, Plus, Loader2, MessageSquare, Mail, CheckCircle, AlertTriangle, ShieldAlert, Eye, Download } from "lucide-react";

function generatePDF(doc: any, patient: any, flags: any[]) {
  import("jspdf").then(({ jsPDF }) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header bar
    pdf.setFillColor(16, 85, 60);
    pdf.rect(0, 0, pageW, 28, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("PADCOM GLOBAL", 14, 14);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Sistema Clinico Integrado de Medicina Integrativa", 14, 22);
    pdf.setTextColor(0, 0, 0);
    y = 38;

    // Document title
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(doc.title || "Protocolo Clinico", 14, y);
    y += 6;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Tipo: ${(doc.documentType || "protocolo").toUpperCase()} | Gerado em: ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR")}`, 14, y);
    y += 10;

    // Patient info
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(14, y, pageW - 28, 30, 2, 2, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("DADOS DO PACIENTE", 18, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Nome: ${patient?.name || "N/A"}`, 18, y + 14);
    pdf.text(`CPF: ${patient?.cpf || "N/A"} | Telefone: ${patient?.phone || "N/A"}`, 18, y + 20);
    pdf.text(`Email: ${patient?.email || "N/A"} | Nascimento: ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString("pt-BR") : "N/A"}`, 18, y + 26);
    y += 38;

    // Score section
    if (doc.score != null || doc.scoreBand) {
      pdf.setFillColor(240, 248, 240);
      pdf.roundedRect(14, y, pageW - 28, 18, 2, 2, "F");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("SCORE CLINICO", 18, y + 7);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const scoreText = `Score: ${doc.score ?? "N/A"}/100 | Faixa: ${doc.scoreBand || "N/A"}`;
      pdf.text(scoreText, 18, y + 14);
      y += 24;
    }

    // Clinical flags
    if (flags && flags.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("FLAGS CLINICAS", 14, y);
      y += 6;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      for (const f of flags) {
        const status = f.status === "pendente" ? "[PENDENTE]" : "[VALIDADO]";
        pdf.text(`${status} ${f.flagType}: ${f.description || ""}`, 18, y);
        y += 5;
        if (y > 270) { pdf.addPage(); y = 20; }
      }
      y += 6;
    }

    // Content placeholder
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("OBSERVACOES E CONDUTA", 14, y);
    y += 6;
    pdf.setDrawColor(200, 200, 200);
    for (let i = 0; i < 8; i++) {
      pdf.line(14, y, pageW - 14, y);
      y += 7;
    }
    y += 6;

    // Signature
    if (doc.signedByName) {
      if (y > 240) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(0, 0, 0);
      pdf.line(pageW / 2 - 40, y + 10, pageW / 2 + 40, y + 10);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(doc.signedByName, pageW / 2, y + 16, { align: "center" });
      if (doc.signedByCRM) {
        pdf.text(`CRM: ${doc.signedByCRM}`, pageW / 2, y + 21, { align: "center" });
      }
      if (doc.signedAt) {
        pdf.text(`Assinado em: ${new Date(doc.signedAt).toLocaleDateString("pt-BR")}`, pageW / 2, y + 26, { align: "center" });
      }
    }

    // Footer
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text("PADCOM GLOBAL — Documento gerado automaticamente pelo sistema. Validade condicionada a assinatura do profissional responsavel.", pageW / 2, pageH - 8, { align: "center" });

    pdf.save(`${(doc.title || "protocolo").replace(/\s+/g, "_")}_${patient?.name?.replace(/\s+/g, "_") || "paciente"}.pdf`);
    toast.success("PDF gerado com sucesso");
  });
}

export default function Protocolos() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({ title: "", documentType: "protocolo" as string, scoreBand: "", score: "", signedByName: "", signedByCRM: "" });

  const patients = trpc.patient.list.useQuery();
  const docs = trpc.protocolDocument.list.useQuery({ patientId: selectedPatientId ?? 0 }, { enabled: !!selectedPatientId });
  const flags = trpc.clinicalFlag.list.useQuery({ patientId: selectedPatientId ?? 0 }, { enabled: !!selectedPatientId });
  const createMut = trpc.protocolDocument.create.useMutation({
    onSuccess: () => { docs.refetch(); setDialogOpen(false); toast.success("Protocolo criado"); },
    onError: (err) => { toast.error(err.message); },
  });
  const sendMut = trpc.protocolDocument.markSent.useMutation({
    onSuccess: () => { docs.refetch(); toast.success("Marcado como enviado"); },
  });

  const selectedPatient = (patients.data ?? []).find((p: any) => p.id === selectedPatientId);
  const pendingFlags = (flags.data ?? []).filter((f: any) => f.status === "pendente");
  const hasBlockingFlags = pendingFlags.length > 0;

  const handleDownloadPDF = useCallback((doc: any) => {
    generatePDF(doc, selectedPatient, flags.data ?? []);
  }, [selectedPatient, flags.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Protocolos e Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Prontuário completo do paciente — anamnese, flags, protocolos ativos, histórico de sessões e evolução clínica</p>
          <p className="text-muted-foreground text-sm mt-1">Gestao de protocolos clinicos, relatorios e envio ao paciente</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedPatientId?.toString() ?? ""} onValueChange={v => setSelectedPatientId(Number(v))}>
          <SelectTrigger className="w-[320px]"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
          <SelectContent>
            {(patients.data ?? []).map((p: any) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPatientId && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-1" /> Preview Clinico
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={hasBlockingFlags}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Protocolo
                  {hasBlockingFlags && <ShieldAlert className="h-4 w-4 ml-1 text-amber-300" />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Protocolo</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Titulo do documento" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Select value={form.documentType} onValueChange={v => setForm(f => ({ ...f, documentType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protocolo">Protocolo</SelectItem>
                      <SelectItem value="anamnese">Anamnese</SelectItem>
                      <SelectItem value="relatorio">Relatorio</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Faixa de score" value={form.scoreBand} onChange={e => setForm(f => ({ ...f, scoreBand: e.target.value }))} />
                    <Input type="number" placeholder="Score" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Assinado por (nome)" value={form.signedByName} onChange={e => setForm(f => ({ ...f, signedByName: e.target.value }))} />
                    <Input placeholder="CRM" value={form.signedByCRM} onChange={e => setForm(f => ({ ...f, signedByCRM: e.target.value }))} />
                  </div>
                  <Button className="w-full" disabled={!form.title || createMut.isPending} onClick={() => {
                    createMut.mutate({
                      patientId: selectedPatientId!, title: form.title,
                      documentType: form.documentType as any,
                      scoreBand: form.scoreBand || undefined,
                      score: form.score ? Number(form.score) : undefined,
                      signedByName: form.signedByName || undefined,
                      signedByCRM: form.signedByCRM || undefined,
                    });
                  }}>
                    {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Protocolo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Blocking flags warning */}
      {selectedPatientId && hasBlockingFlags && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Protocolo bloqueado — {pendingFlags.length} flag(s) clinica(s) pendente(s)
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  E necessario validar todas as flags clinicas antes de criar um novo protocolo. Acesse a pagina de Flags Clinicas para resolver.
                </p>
                <div className="mt-2 space-y-1">
                  {pendingFlags.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-amber-800 dark:text-amber-200">{f.flagType}: {f.description}</span>
                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">pendente</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Clinico Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Preview Clinico — {selectedPatient?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Flags Clinicas
              </h4>
              {(flags.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma flag registrada</p>
              ) : (
                <div className="space-y-1">
                  {(flags.data ?? []).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        {f.status === "pendente" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                        <span>{f.flagType}: {f.description}</span>
                      </div>
                      <Badge variant={f.status === "pendente" ? "destructive" : "secondary"} className="text-[10px]">{f.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Protocolos Existentes
              </h4>
              {(docs.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum protocolo registrado</p>
              ) : (
                <div className="space-y-1">
                  {(docs.data ?? []).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span>{d.title}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{d.documentType}</Badge>
                        {d.sentVia && d.sentVia !== "nenhum" && <Badge className="text-[10px] bg-green-100 text-green-700">Enviado</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium">Resumo</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                <div>Flags pendentes: <span className={pendingFlags.length > 0 ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>{pendingFlags.length}</span></div>
                <div>Flags validadas: <span className="font-medium">{(flags.data ?? []).filter((f: any) => f.status === "validado").length}</span></div>
                <div>Protocolos: <span className="font-medium">{(docs.data ?? []).length}</span></div>
                <div>Enviados: <span className="font-medium">{(docs.data ?? []).filter((d: any) => d.sentVia && d.sentVia !== "nenhum").length}</span></div>
              </div>
              {hasBlockingFlags && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Criacao de protocolo bloqueada ate validacao das flags
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!selectedPatientId ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Selecione um paciente para ver os protocolos</CardContent></Card>
      ) : docs.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (docs.data ?? []).length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum protocolo registrado para este paciente</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(docs.data ?? []).map((doc: any) => (
            <Card key={doc.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{doc.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{doc.documentType}</Badge>
                      {doc.scoreBand && <Badge className="bg-primary/10 text-primary text-xs">{doc.scoreBand}</Badge>}
                      {doc.score != null && <Badge variant="secondary" className="text-xs">Score: {doc.score}</Badge>}
                    </div>
                    {doc.signedByName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Assinado por {doc.signedByName} {doc.signedByCRM ? `(CRM ${doc.signedByCRM})` : ""}
                        {doc.signedAt && ` em ${new Date(doc.signedAt).toLocaleDateString("pt-BR")}`}
                      </p>
                    )}
                    {doc.sentVia && doc.sentVia !== "nenhum" && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        {doc.sentVia === "whatsapp" ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        Enviado via {doc.sentVia} em {doc.sentAt ? new Date(doc.sentAt).toLocaleDateString("pt-BR") : ""}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-1">
                    {/* PDF Download Button */}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(doc)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                    {(!doc.sentVia || doc.sentVia === "nenhum") && selectedPatient?.phone && (
                      <Button size="sm" variant="outline" onClick={() => {
                        const phone = selectedPatient.phone?.replace(/\D/g, "");
                        const msg = encodeURIComponent(`Ola ${selectedPatient.name}, segue seu protocolo: ${doc.title}. Acesse o portal para mais detalhes.`);
                        window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                        sendMut.mutate({ id: doc.id, sentVia: "whatsapp" });
                      }}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                      </Button>
                    )}
                    {(!doc.sentVia || doc.sentVia === "nenhum") && (
                      <Button size="sm" variant="outline" onClick={() => sendMut.mutate({ id: doc.id, sentVia: "email" })}>
                        <Mail className="h-3.5 w-3.5 mr-1" /> Email
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
