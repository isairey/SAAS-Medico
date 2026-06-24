import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, Users, ClipboardList, Stethoscope, Sparkles,
  FileHeart, Pill, Bell, Settings, LogOut, PanelLeft, Activity,
  UserCog, FlaskConical, CalendarCheck, TrendingUp, ShieldAlert,
  Tablets, GitBranch, Heart, ListTodo, FileText, AlertTriangle,
  Building2, Cog, Filter, BarChart3, Store, ShieldCheck, Webhook, Scale, FileSpreadsheet,
  Calendar, BellRing, Trello
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Pacientes", path: "/pacientes" },
  { icon: Stethoscope, label: "Anamnese Integrativa", path: "/anamnese-integrativa" },
  { icon: Sparkles, label: "Anamnese Estética", path: "/anamnese-estetica" },
  { icon: FileHeart, label: "Relatos Diários", path: "/relatos-diarios" },
  { icon: Pill, label: "Prescrições", path: "/prescricoes" },
  { icon: Tablets, label: "Medicamentos", path: "/medicamentos" },
  { icon: FlaskConical, label: "Exames", path: "/exames" },
  { icon: CalendarCheck, label: "Sessões", path: "/sessoes" },
  { icon: TrendingUp, label: "Evolução", path: "/evolucao" },
  { icon: Bell, label: "Alertas", path: "/alertas" },
  { icon: ShieldAlert, label: "Flags Clínicas", path: "/flags-clinicas" },
  { icon: GitBranch, label: "Funil", path: "/funil" },
  { icon: Cog, label: "Motor de Ações", path: "/motor-acoes" },
  { icon: Filter, label: "Config. Fluxo", path: "/config-fluxo" },
  { icon: UserCog, label: "Consultoras", path: "/consultoras" },
  { icon: ClipboardList, label: "Perguntas", path: "/perguntas" },
  { icon: Heart, label: "Sistemas Clínico", path: "/sistemas-clinico" },
  { icon: ListTodo, label: "Fila da Equipe", path: "/fila-equipe" },
  { icon: AlertTriangle, label: "Polifarmácia", path: "/polifarmacia" },
  { icon: FileText, label: "Protocolos", path: "/protocolos" },
  { icon: Building2, label: "Clínicas", path: "/clinicas" },
  { icon: BarChart3, label: "Governança", path: "/governanca" },
  { icon: Store, label: "Farmácias", path: "/farmacias" },
  { icon: ShieldCheck, label: "Confiança", path: "/confianca" },
  { icon: Webhook, label: "Webhooks", path: "/webhooks" },
  { icon: Scale, label: "Score Regulatório", path: "/score-regulatorio" },
  { icon: FileSpreadsheet, label: "Exportação CSV", path: "/exportacao" },
  { icon: Calendar, label: "Agendamentos", path: "/agendamentos" },
  { icon: BellRing, label: "Notificações", path: "/notificacoes" },
  { icon: Trello, label: "Trello", path: "/trello" },
  { icon: Activity, label: "Auditoria", path: "/auditoria" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-card rounded-2xl shadow-xl border">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center text-card-foreground">
              PADCOM GLOBAL
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
              Sistema de Anamnese e Acompanhamento Clínico Integrado. Faça login para acessar o painel.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            Entrar no Sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => location === item.path || (item.path !== "/" && location.startsWith(item.path)));
  const isMobile = useIsMobile();

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold tracking-tight truncate text-primary">
                    PADCOM
                  </span>
                  <span className="text-xs font-medium text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                    GLOBAL
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 space-y-0.5">
              {menuItems.map(item => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 transition-all font-normal text-[13px]"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || ""}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-semibold text-sm text-foreground">{activeMenuItem?.label ?? "PADCOM"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
