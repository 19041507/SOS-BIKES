"use client";

import { useSearchParams } from "next/navigation";

/** Aviso do login quando o link de confirmação de e-mail não funcionou. */
export function AvisoConfirmacao() {
  const params = useSearchParams();
  if (params.get("confirmacao") !== "invalida") return null;

  return (
    <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-snug font-medium text-warn">
      O link de confirmação expirou ou já foi usado. Se você já confirmou, é só entrar com sua senha.
    </p>
  );
}
