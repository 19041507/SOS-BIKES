"use client";

import { Button } from "./Button";

type ConfirmacaoProps = {
  texto: string;
  confirmar: string;
  cancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

/** Confirmação na própria tela (mesmo visual do aviso de ficar indisponível), no lugar do `window.confirm`. */
export function Confirmacao({ texto, confirmar, cancelar = "Cancelar", onConfirmar, onCancelar }: ConfirmacaoProps) {
  return (
    <div role="alertdialog" aria-label={confirmar} className="flex flex-col gap-2.5 rounded-xl bg-warn-soft p-3 text-sm text-warn">
      <p>{texto}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onCancelar}>{cancelar}</Button>
        <Button variant="danger" onClick={onConfirmar}>{confirmar}</Button>
      </div>
    </div>
  );
}
