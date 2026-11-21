"use client";

import { useSearchParams } from "next/navigation";

/** Avisos do login: link de confirmação que não funcionou e senha recém-alterada. */
export function AvisoConfirmacao() {
  const params = useSearchParams();
  if (params.get("senha") === "alterada") {
    return (
      <p role="status" className="rounded-xl bg-ok-soft px-4 py-3 text-sm leading-snug font-medium text-ok-dark">
        Senha alterada. Entre com a senha nova.
      </p>
    );
  }
  if (params.get("confirmacao") !== "invalida") return null;

  return (
    <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-snug font-medium text-warn">
      O link de confirmação expirou ou já foi usado. Se você já confirmou, é só entrar com sua senha.
    </p>
  );
}
