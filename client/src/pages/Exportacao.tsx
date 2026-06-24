import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Users, ShoppingCart, AlertTriangle, Pill, Building2, ShieldCheck, ClipboardList, Microscope, UserCheck, FileText, Table2 } from "lucide-react";

const ENTITIES = [
  { value: "patients", label: "Pacientes", icon: Users, description: "Dados cadastrais de todos os pacientes" },
  { value: "leads", label: "Leads de Entrada", icon: ShoppingCart, description: "Leads capturados por todos os braços de entrada (E1-E6)" },
  { value: "prescriptions", label: "Prescrições", icon: Pill, description: "Prescrições médicas com componentes e status" },
  { value: "dispatches", label: "Despachos Farmácia", icon: Building2, description: "Despachos de prescrição para farmácias parceiras" },
  { value: "alerts", label: "Alertas Clínicos", icon: AlertTriangle, description: "Alertas gerados pelo motor clínico" },
  { value: "consultants", label: "Consultoras", icon: UserCheck, description: "Equipe de consultoras e profissionais" },
  { value: "pharmacies", label: "Farmácias Parceiras", icon: Building2, description: "Cadastro de farmácias parceiras" },
  { value: "validations", label: "Cascata de Validação", icon: ShieldCheck, description: "Registros da cascata de validação com certificados" },
  { value: "sessions", label: "Sessões de Anamnese", icon: ClipboardList, description: "Sessões de anamnese com scores e status" },
  { value: "exams", label: "Exames", icon: Microscope, description: "Exames laboratoriais e de imagem" },
] as const;

type ExportFormat = "csv" | "xlsx";

export default function Exportacao() {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [isExporting, setIsExporting] = useState(false);

  const preview = trpc.export.preview.useQuery(
    { entity: selectedEntity as any },
    { enabled: !!selectedEntity }
  );

  const exportCsv = trpc.export.csv.useMutation({
    onSuccess: (data) => {
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exportação CSV concluída: ${data.rowCount} registros`);
      setIsExporting(false);
    },
    onError: (err) => {
      toast.error(`Erro na exportação: ${err.message}`);
      setIsExporting(false);
    },
  });

  const exportXlsx = trpc.export.xlsx.useMutation({
    onSuccess: (data) => {
      // Convert base64 to Blob
      const binaryStr = atob(data.xlsxBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exportação Excel concluída: ${data.rowCount} registros`);
      setIsExporting(false);
    },
    onError: (err) => {
      toast.error(`Erro na exportação: ${err.message}`);
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    if (!selectedEntity) {
      toast.error("Selecione uma entidade para exportar");
      return;
    }
    setIsExporting(true);
    if (format === "xlsx") {
      exportXlsx.mutate({ entity: selectedEntity as any });
    } else {
      exportCsv.mutate({ entity: selectedEntity as any });
    }
  };

  const selectedInfo = ENTITIES.find(e => e.value === selectedEntity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          Exportação de Dados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exporte dados do sistema em formato CSV ou Excel (XLSX), compatível com Excel, Google Sheets e outros softwares de planilha.
        </p>
      </div>

      {/* Entity Selection + Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Entidade e Formato</CardTitle>
          <CardDescription>
            Escolha qual conjunto de dados deseja exportar e em qual formato. Cabeçalhos são traduzidos para português automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Entidade</label>
              <p className="text-xs text-muted-foreground">Conjunto de dados a exportar</p>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a entidade..." />
                </SelectTrigger>
                <SelectContent>
                  {ENTITIES.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      <span className="flex items-center gap-2">
                        <e.icon className="h-4 w-4" />
                        {e.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Formato</label>
              <p className="text-xs text-muted-foreground">Tipo de arquivo para download</p>
              <div className="flex gap-2">
                <Button
                  variant={format === "xlsx" ? "default" : "outline"}
                  className={format === "xlsx" ? "bg-emerald-600 hover:bg-emerald-700 flex-1" : "flex-1"}
                  onClick={() => setFormat("xlsx")}
                >
                  <Table2 className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant={format === "csv" ? "default" : "outline"}
                  className={format === "csv" ? "bg-emerald-600 hover:bg-emerald-700 flex-1" : "flex-1"}
                  onClick={() => setFormat("csv")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </Button>
              </div>
            </div>
          </div>

          {selectedInfo && (
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <selectedInfo.icon className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">{selectedInfo.label}</span>
                {preview.data && (
                  <Badge variant="secondary">{preview.data.count} registros</Badge>
                )}
                <Badge variant="outline" className="ml-auto">
                  {format === "xlsx" ? "Excel" : "CSV"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{selectedInfo.description}</p>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={!selectedEntity || isExporting}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {format === "xlsx" ? "Excel" : "CSV"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Available Entities Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Entidades Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ENTITIES.map(e => (
            <Card
              key={e.value}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedEntity === e.value ? "ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}
              onClick={() => setSelectedEntity(e.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${selectedEntity === e.value ? "bg-emerald-100 dark:bg-emerald-900" : "bg-muted"}`}>
                    <e.icon className={`h-5 w-5 ${selectedEntity === e.value ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{e.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1">Informações sobre a exportação</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Excel (.xlsx):</strong> Formato nativo do Microsoft Excel com colunas auto-dimensionadas</li>
            <li>• <strong>CSV (.csv):</strong> Formato texto com codificação UTF-8 BOM para compatibilidade universal</li>
            <li>• Cabeçalhos são traduzidos para português automaticamente</li>
            <li>• Campos de data são formatados em ISO 8601 (AAAA-MM-DD)</li>
            <li>• Campos JSON são serializados como texto para preservar estrutura</li>
            <li>• Limite máximo de 10.000 registros por exportação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
