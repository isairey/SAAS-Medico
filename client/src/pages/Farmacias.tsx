import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Building2, Settings2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Farmacias() {
  const utils = trpc.useUtils();
  const { data: pharmacies, isLoading } = trpc.pharmacy.list.useQuery({});
  const { data: deliveryConfig } = trpc.recipeDelivery.get.useQuery({});
  const createPharmacy = trpc.pharmacy.create.useMutation({
    onSuccess: () => { utils.pharmacy.list.invalidate(); toast.success("Farmácia cadastrada"); setShowCreate(false); },
  });
  const upsertDelivery = trpc.recipeDelivery.upsert.useMutation({
    onSuccess: () => { utils.recipeDelivery.get.invalidate(); toast.success("Configuração salva"); },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", cnpj: "", email: "", phone: "", address: "", city: "", state: "",
    contactPerson: "", commissionPercent: "30", integrationModel: "manual" as const,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farmácias Parceiras</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie farmácias e configure o destino das receitas
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Farmácia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Farmácia</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Contato</Label>
                <Input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>UF</Label>
                <Input value={form.state} maxLength={2} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input value={form.commissionPercent} onChange={e => setForm(f => ({ ...f, commissionPercent: e.target.value }))} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={form.integrationModel} onValueChange={v => setForm(f => ({ ...f, integrationModel: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="drive">Drive</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createPharmacy.mutate(form)}
                disabled={!form.name || createPharmacy.isPending}
              >
                {createPharmacy.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delivery Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Configuração de Entrega de Receitas</CardTitle>
          </div>
          <CardDescription>Defina para onde as receitas são enviadas automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Destino da Receita</Label>
              <Select
                value={deliveryConfig?.deliveryTarget || "ambos"}
                onValueChange={v => upsertDelivery.mutate({ deliveryTarget: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Só Paciente</SelectItem>
                  <SelectItem value="farmacia">Só Farmácia</SelectItem>
                  <SelectItem value="ambos">Paciente + Farmácia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={deliveryConfig?.sendViaEmail ?? true}
                onCheckedChange={v => upsertDelivery.mutate({ sendViaEmail: v })}
              />
              <Label>Enviar por Email</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={deliveryConfig?.sendViaWhatsapp ?? false}
                onCheckedChange={v => upsertDelivery.mutate({ sendViaWhatsapp: v })}
              />
              <Label>Enviar por WhatsApp</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pharmacies?.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    {p.city && <p className="text-xs text-muted-foreground">{p.city}/{p.state}</p>}
                  </div>
                </div>
                <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                  {p.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {p.cnpj && <p>CNPJ: {p.cnpj}</p>}
                {p.email && <p>Email: {p.email}</p>}
                {p.phone && <p>Tel: {p.phone}</p>}
                {p.contactPerson && <p>Contato: {p.contactPerson}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Comissão: {p.commissionPercent || "30"}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {p.integrationModel || "manual"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!pharmacies || pharmacies.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma farmácia cadastrada. Clique em "Nova Farmácia" para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
