import { Label } from "@/components/ui/label";

/**
 * FieldLabel — Componente reutilizável para labels com subtítulo explicativo.
 * Padrão UX PADCOM: todo campo tem nome principal + texto explicativo menor abaixo.
 * 
 * Alias Núcleo: rotulo_campo_descritivo
 */
export function FieldLabel({ title, subtitle, htmlFor }: { title: string; subtitle: string; htmlFor?: string }) {
  return (
    <div className="space-y-0.5 mb-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">{title}</Label>
      <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
    </div>
  );
}

/**
 * TableHeader — Componente reutilizável para cabeçalhos de tabela com subtítulo.
 * Padrão UX PADCOM: toda coluna de tabela tem nome + descrição do que contém.
 */
export function TableHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <th className="text-left py-2 px-3">
      <p className="font-medium text-muted-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground font-normal">{subtitle}</p>
    </th>
  );
}

/**
 * SectionHeader — Componente para cabeçalhos de seção com subtítulo.
 */
export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}
