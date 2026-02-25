import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { FieldError, FieldGroup, FieldHelper, FieldLabel, SelectField, TextArea, TextInput } from "@/components/ui/Field";

export const metadata: Metadata = {
  title: "Styleguide"
};

const palette = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface2", "bg-surface2"],
  ["text", "bg-text"],
  ["muted", "bg-muted"],
  ["border", "bg-border"],
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["lilac", "bg-lilac"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"]
] as const;

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-14 rounded-lg border border-border shadow-sm ${className}`} />
      <div>
        <p className="text-xs font-medium text-text">{name}</p>
        <p className="text-[11px] text-muted">{className}</p>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-md">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full glow-coral blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full glow-lilac blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Warm Premium Celebration</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-text sm:text-5xl">Lembra. Design System</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Tokens, componentes e padrões de UI para evolução visual consistente no app sem trocar stack.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Paleta</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {palette.map(([name, className]) => (
              <Swatch key={name} name={name} className={className} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Tipografia e tokens</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-muted">Display</p>
              <p className="text-4xl font-semibold tracking-tight text-text">Nunca mais esqueça aniversários.</p>
            </div>
            <div>
              <p className="text-xs text-muted">Body</p>
              <p className="text-sm text-muted">Tom caloroso, premium e humano com alto contraste e espaços mais respirados.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip as="span" variant="subtle">radius-sm 10px</Chip>
              <Chip as="span" variant="subtle">radius-md 14px</Chip>
              <Chip as="span" variant="subtle">radius-lg 18px</Chip>
              <Chip as="span" variant="subtle">radius-xl 24px</Chip>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-md border border-border bg-surface p-3 shadow-sm">shadow-sm</div>
              <div className="rounded-md border border-border bg-surface p-3 shadow-md">shadow-md</div>
              <div className="rounded-md border border-border bg-surface p-3 shadow-lg">shadow-lg</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card variant="elevated" className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Buttons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        <Card variant="elevated" className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Chips / Badges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip as="span">Default</Chip>
            <Chip as="span" variant="subtle">Subtle</Chip>
            <Chip as="span" variant="accent">Accent</Chip>
            <Chip as="span" variant="warning">Warning</Chip>
            <Chip as="span" variant="danger">Danger</Chip>
            <Chip interactive>Interactive</Chip>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card variant="bento" className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Inputs</h2>
          <div className="mt-4 space-y-4">
            <FieldGroup>
              <FieldLabel htmlFor="sg-name">Nome</FieldLabel>
              <TextInput id="sg-name" placeholder="Ex.: Ana Silva" />
              <FieldHelper>Campo padrão com focus ring.</FieldHelper>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="sg-category">Categoria</FieldLabel>
              <SelectField id="sg-category" defaultValue="Amigos">
                <option>Amigos</option>
                <option>Família</option>
                <option>Trabalho</option>
              </SelectField>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="sg-notes">Observações</FieldLabel>
              <TextArea id="sg-notes" placeholder="Notas sobre preferências de mensagem" />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="sg-error">Exemplo com erro</FieldLabel>
              <TextInput id="sg-error" hasError defaultValue="" placeholder="Campo inválido" />
              <FieldError>Preencha este campo corretamente.</FieldError>
            </FieldGroup>
          </div>
        </Card>

        <Card variant="bento" className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Alerts + Motion</h2>
          <div className="mt-4 space-y-3">
            <Alert variant="info">Você quis dizer “Curso de Inglês”?</Alert>
            <Alert variant="success">Aniversário salvo com sucesso.</Alert>
            <Alert variant="warning">Sessão expirada, entre novamente.</Alert>
            <Alert variant="danger">Não foi possível salvar agora.</Alert>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Card variant="elevated" className="p-4">
              <p className="text-sm font-medium text-text">Hover lift</p>
              <p className="mt-1 text-xs text-muted">Passe o mouse para ver micro-movimento e sombra.</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-text">Transições</p>
              <p className="mt-1 text-xs text-muted">Padrão: 150ms/250ms com `--ease`.</p>
            </Card>
          </div>
        </Card>
      </section>
    </div>
  );
}
