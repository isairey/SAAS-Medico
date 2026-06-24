import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserCog, Plus, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ConsultorasPage() {
  const { data: consultants, isLoading } = trpc.consultant.list.useQuery();
  const createMutation = trpc.consultant.create.useMutation();
  const updateMutation = trpc.consultant.update.useMutation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "enfermeira" as string, specialization: "" });

  const handleCreate = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    try {
      await createMutation.mutateAsync(form as any);
      toast.success("Consultora cadastrada!");
      utils.consultant.list.invalidate();
      setOpen(false);
      setForm({ name: "", email: "", phone: "", role: "enfermeira", specialization: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleAccess = async (id: number, current: boolean) => {
    await updateMutation.mutateAsync({ id, isActive: !current });
    utils.consultant.list.invalidate();
    toast.success(current ? "Acesso revogado" : "Acesso concedido");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" /> Consultoras</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie o acesso de profissionais autorizados — enfermeiros, biomédicos, nutricionistas e outros que operam na clínica</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Consultora</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Consultora / Profissional</DialogTitle>
              <p className="text-sm text-muted-foreground">Cadastre um profissional da saúde que atuará na clínica. A função define o que ele pode prescrever conforme o Score Competência Reguladora.</p>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1"><Label className="text-sm font-semibold">Nome Completo *</Label><p className="text-xs text-muted-foreground">Nome profissional conforme registro no conselho de classe</p><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">E-mail Profissional</Label><p className="text-xs text-muted-foreground">E-mail para notificações de validação e cascata</p><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Telefone / WhatsApp</Label><p className="text-xs text-muted-foreground">Contato para alertas urgentes e validações</p><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-semibold">Função / Categoria Profissional</Label><p className="text-xs text-muted-foreground">Define quais itens este profissional pode prescrever</p>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enfermeira">Enfermeira</SelectItem>
                      <SelectItem value="biomedica">Biomédica</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                      <SelectItem value="esteticista">Esteticista</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-sm font-semibold">Especialização</Label><p className="text-xs text-muted-foreground">Área de atuação principal — ex: Estética, Integrativa, Ortomolecular</p><Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="text-center p-8 text-muted-foreground">Carregando...</div> : !consultants?.length ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhuma consultora cadastrada</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultants.map((c: any) => (
            <Card key={c.id} className={`transition-all ${c.isActive ? "hover:shadow-md" : "opacity-60"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.isActive ? <Shield className="h-4 w-4 text-green-600" /> : <ShieldOff className="h-4 w-4 text-gray-400" />}
                    <Switch checked={c.isActive} onCheckedChange={() => toggleAccess(c.id, c.isActive)} />
                  </div>
                </div>
                {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                <div className="mt-3 pt-3 border-t">
                  <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">
                    {c.isActive ? "Acesso Ativo" : "Acesso Revogado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
