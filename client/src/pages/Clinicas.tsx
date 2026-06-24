import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Palette, Globe, Users, Crown, Settings, Copy, ExternalLink } from "lucide-react";

export default function Clinicas() {
  const { data: clinics, isLoading } = trpc.clinic.list.useQuery();
  const createMut = trpc.clinic.create.useMutation({ onSuccess: () => { toast.success("Clínica criada"); setOpen(false); utils.clinic.list.invalidate(); } });
  const updateMut = trpc.clinic.update.useMutation({ onSuccess: () => { toast.success("Clínica atualizada"); setEditOpen(false); utils.clinic.list.invalidate(); } });
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClinic, setEditClinic] = useState<any>(null);
  const [form, setForm] = useState({ slug: "", name: "", phone: "", email: "", cnpj: "", address: "", primaryColor: "#10553C", secondaryColor: "#D4AF37", plan: "starter" as "starter" | "pro" | "enterprise", maxPatients: 50, maxConsultants: 3 });

  const planLabels: Record<string, { label: string; color: string }> = {
    starter: { label: "Starter", color: "bg-zinc-100 text-zinc-700" },
    pro: { label: "Pro", color: "bg-blue-100 text-blue-700" },
    enterprise: { label: "Enterprise", color: "bg-amber-100 text-amber-700" },
  };

  const handleCreate = () => {
    if (!form.slug || !form.name) { toast.error("Slug e nome são obrigatórios"); return; }
    createMut.mutate({ ...form, email: form.email || undefined });
  };

  const handleUpdate = () => {
    if (!editClinic) return;
    updateMut.mutate({ id: editClinic.id, name: editClinic.name, slug: editClinic.slug, primaryColor: editClinic.primaryColor, secondaryColor: editClinic.secondaryColor, phone: editClinic.phone, email: editClinic.email || undefined, address: editClinic.address, cnpj: editClinic.cnpj, plan: editClinic.plan, maxPatients: editClinic.maxPatients, maxConsultants: editClinic.maxConsultants, isActive: editClinic.isActive });
  };

  const copyPortalUrl = (slug: string) => {
    const url = `${window.location.origin}/portal/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para a área de transferência");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-muted-foreground">Gerenciamento multi-clínica com branding configurável</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Clínica</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Clínica</DialogTitle>
              <p className="text-sm text-muted-foreground">Crie uma unidade clínica com branding próprio. O slug define a URL do portal do paciente.</p>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Slug (URL) *</Label>
                  <p className="text-xs text-muted-foreground">Identificador único na URL — só letras minúsculas, números e hífen</p>
                  <Input placeholder="minha-clinica" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
                  <p className="text-xs text-muted-foreground mt-1">/portal/{form.slug || "..."}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nome da Clínica *</Label>
                  <p className="text-xs text-muted-foreground">Nome comercial exibido no portal e relatórios</p>
                  <Input placeholder="Clínica Dr. Padua" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Telefone</Label>
                  <p className="text-xs text-muted-foreground">Contato principal da unidade</p>
                  <Input placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">E-mail</Label>
                  <p className="text-xs text-muted-foreground">E-mail para comunicações e notificações da clínica</p>
                  <Input type="email" placeholder="contato@clinica.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">CNPJ</Label>
                  <p className="text-xs text-muted-foreground">Cadastro Nacional de Pessoa Jurídica da unidade</p>
                  <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Plano</Label>
                  <p className="text-xs text-muted-foreground">Define limites de pacientes e consultoras</p>
                  <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter (50 pac. / 3 cons.)</SelectItem>
                      <SelectItem value="pro">Pro (200 pac. / 10 cons.)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (ilimitado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Endereço</Label>
                <p className="text-xs text-muted-foreground">Endereço físico da unidade clínica</p>
                <Input placeholder="Rua..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2"><Palette className="w-3 h-3" /> Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Palette className="w-3 h-3" /> Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: form.primaryColor }}>
                  {form.name?.charAt(0) || "C"}
                </div>
                <div>
                  <p className="font-medium">{form.name || "Preview"}</p>
                  <p className="text-xs text-muted-foreground">/{form.slug || "slug"}</p>
                </div>
                <div className="ml-auto w-4 h-4 rounded-full" style={{ backgroundColor: form.secondaryColor }} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? "Criando..." : "Criar Clínica"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>)}
        </div>
      ) : !clinics?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma clínica cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">Crie sua primeira clínica para habilitar multi-tenancy com branding personalizado.</p>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar Clínica</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinics.map((clinic: any) => (
            <Card key={clinic.id} className="overflow-hidden">
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${clinic.primaryColor || "#10553C"}, ${clinic.secondaryColor || "#D4AF37"})` }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: clinic.primaryColor || "#10553C" }}>
                      {clinic.name?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{clinic.name}</CardTitle>
                      <CardDescription className="text-xs">/{clinic.slug}</CardDescription>
                    </div>
                  </div>
                  <Badge className={planLabels[clinic.plan]?.color || ""}>{planLabels[clinic.plan]?.label || clinic.plan}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {clinic.phone && <p className="text-sm text-muted-foreground">{clinic.phone}</p>}
                {clinic.email && <p className="text-sm text-muted-foreground">{clinic.email}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Até {clinic.maxPatients} pacientes / {clinic.maxConsultants} consultoras</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copyPortalUrl(clinic.slug)}>
                    <Copy className="w-3 h-3 mr-1" /> Copiar URL
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditClinic({ ...clinic }); setEditOpen(true); }}>
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/portal/${clinic.slug}`, "_blank")}>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
          </DialogHeader>
          {editClinic && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug</Label>
                  <Input value={editClinic.slug} onChange={e => setEditClinic((c: any) => ({ ...c, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input value={editClinic.name} onChange={e => setEditClinic((c: any) => ({ ...c, name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input value={editClinic.phone || ""} onChange={e => setEditClinic((c: any) => ({ ...c, phone: e.target.value }))} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={editClinic.email || ""} onChange={e => setEditClinic((c: any) => ({ ...c, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ</Label>
                  <Input value={editClinic.cnpj || ""} onChange={e => setEditClinic((c: any) => ({ ...c, cnpj: e.target.value }))} />
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select value={editClinic.plan} onValueChange={v => setEditClinic((c: any) => ({ ...c, plan: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={editClinic.address || ""} onChange={e => setEditClinic((c: any) => ({ ...c, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={editClinic.primaryColor || "#10553C"} onChange={e => setEditClinic((c: any) => ({ ...c, primaryColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={editClinic.primaryColor || ""} onChange={e => setEditClinic((c: any) => ({ ...c, primaryColor: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={editClinic.secondaryColor || "#D4AF37"} onChange={e => setEditClinic((c: any) => ({ ...c, secondaryColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={editClinic.secondaryColor || ""} onChange={e => setEditClinic((c: any) => ({ ...c, secondaryColor: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Máx. Pacientes</Label>
                  <Input type="number" value={editClinic.maxPatients} onChange={e => setEditClinic((c: any) => ({ ...c, maxPatients: parseInt(e.target.value) || 50 }))} />
                </div>
                <div>
                  <Label>Máx. Consultoras</Label>
                  <Input type="number" value={editClinic.maxConsultants} onChange={e => setEditClinic((c: any) => ({ ...c, maxConsultants: parseInt(e.target.value) || 3 }))} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Label>Clínica Ativa</Label>
                </div>
                <Switch checked={editClinic.isActive} onCheckedChange={v => setEditClinic((c: any) => ({ ...c, isActive: v }))} />
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={updateMut.isPending}>
                {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
