"use client";

type ClearDataModalProps = {
  open: boolean;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearDataModal({ open, value, loading, onChange, onCancel, onConfirm }: ClearDataModalProps) {
  if (!open) return null;

  const canConfirm = value.trim().toUpperCase() === "LIMPAR" && !loading;

  return (
    <div className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4">
      <div className="ui-modal-surface w-full max-w-md border p-5">
        <h3 className="text-lg font-semibold tracking-tight text-text">Tem certeza?</h3>
        <p className="mt-2 text-sm text-muted">
          Todos os aniversários salvos localmente neste dispositivo serão apagados. Esta ação não pode ser desfeita.
        </p>
        <p className="mt-3 text-xs text-muted">Digite &quot;LIMPAR&quot; para confirmar.</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite LIMPAR"
          className="mt-2 w-full rounded-xl border border-border/80 bg-surface2/60 px-3 py-2 text-sm text-text outline-none ring-0 placeholder:text-muted/70 focus:border-border focus-visible:ring-2 focus-visible:ring-primary/35"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="ui-cta-secondary rounded-xl border px-3 py-2 text-sm disabled:opacity-70 focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="rounded-xl bg-danger px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-95"
          >
            {loading ? "Limpando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
