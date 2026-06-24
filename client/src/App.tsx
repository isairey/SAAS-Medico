import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Pacientes = lazy(() => import("./pages/Pacientes"));
const PacienteDetalhe = lazy(() => import("./pages/PacienteDetalhe"));
const AnamneseIntegrativa = lazy(() => import("./pages/AnamneseIntegrativa"));
const AnamneseEstetica = lazy(() => import("./pages/AnamneseEstetica"));
const RelatosDiarios = lazy(() => import("./pages/RelatosDiarios"));
const Prescricoes = lazy(() => import("./pages/Prescricoes"));
const Medicamentos = lazy(() => import("./pages/Medicamentos"));
const ExamesPage = lazy(() => import("./pages/Exames"));
const SessoesPage = lazy(() => import("./pages/Sessoes"));
const EvolucaoPage = lazy(() => import("./pages/Evolucao"));
const AlertasPage = lazy(() => import("./pages/Alertas"));
const FlagsClinicas = lazy(() => import("./pages/FlagsClinicas"));
const FunilPage = lazy(() => import("./pages/Funil"));
const MotorAcoesPage = lazy(() => import("./pages/MotorAcoes"));
const ConfigFluxoPage = lazy(() => import("./pages/ConfigFluxo"));
const ConsultorasPage = lazy(() => import("./pages/Consultoras"));
const PerguntasPage = lazy(() => import("./pages/Perguntas"));
const AuditoriaPage = lazy(() => import("./pages/Auditoria"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const SistemasClinico = lazy(() => import("./pages/SistemasClinico"));
const FilaEquipe = lazy(() => import("./pages/FilaEquipe"));
const Polifarmacia = lazy(() => import("./pages/Polifarmacia"));
const Protocolos = lazy(() => import("./pages/Protocolos"));
const Clinicas = lazy(() => import("./pages/Clinicas"));
const Governanca = lazy(() => import("./pages/Governanca"));
const Farmacias = lazy(() => import("./pages/Farmacias"));
const Confianca = lazy(() => import("./pages/Confianca"));
const WebhooksPage = lazy(() => import("./pages/Webhooks"));
const ScoreRegulatorio = lazy(() => import("./pages/ScoreRegulatorio"));
const Exportacao = lazy(() => import("./pages/Exportacao"));
const Agendamentos = lazy(() => import("./pages/Agendamentos"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Trello = lazy(() => import("./pages/Trello"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/pacientes" component={Pacientes} />
          <Route path="/pacientes/:id" component={PacienteDetalhe} />
          <Route path="/anamnese-integrativa" component={AnamneseIntegrativa} />
          <Route path="/anamnese-estetica" component={AnamneseEstetica} />
          <Route path="/relatos-diarios" component={RelatosDiarios} />
          <Route path="/prescricoes" component={Prescricoes} />
          <Route path="/medicamentos" component={Medicamentos} />
          <Route path="/exames" component={ExamesPage} />
          <Route path="/sessoes" component={SessoesPage} />
          <Route path="/evolucao" component={EvolucaoPage} />
          <Route path="/alertas" component={AlertasPage} />
          <Route path="/flags-clinicas" component={FlagsClinicas} />
          <Route path="/funil" component={FunilPage} />
          <Route path="/motor-acoes" component={MotorAcoesPage} />
          <Route path="/config-fluxo" component={ConfigFluxoPage} />
          <Route path="/consultoras" component={ConsultorasPage} />
          <Route path="/perguntas" component={PerguntasPage} />
          <Route path="/auditoria" component={AuditoriaPage} />
          <Route path="/sistemas-clinico" component={SistemasClinico} />
          <Route path="/fila-equipe" component={FilaEquipe} />
          <Route path="/polifarmacia" component={Polifarmacia} />
          <Route path="/protocolos" component={Protocolos} />
          <Route path="/clinicas" component={Clinicas} />
          <Route path="/governanca" component={Governanca} />
          <Route path="/farmacias" component={Farmacias} />
          <Route path="/confianca" component={Confianca} />
          <Route path="/webhooks" component={WebhooksPage} />
          <Route path="/score-regulatorio" component={ScoreRegulatorio} />
          <Route path="/exportacao" component={Exportacao} />
          <Route path="/agendamentos" component={Agendamentos} />
          <Route path="/notificacoes" component={Notificacoes} />
          <Route path="/trello" component={Trello} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Patient portal - public, no auth required */}
        <Route path="/portal/:token" component={PatientPortal} />
        <Route path="/portal/:token/:tab" component={PatientPortal} />
        {/* Slug-aware portal for multi-clinic branding */}
        <Route path="/c/:slug/:token" component={PatientPortal} />
        <Route path="/c/:slug/:token/:tab" component={PatientPortal} />
        {/* All other routes go through dashboard layout */}
        <Route component={DashboardRouter} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
