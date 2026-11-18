"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";

type Tipo = "sucesso" | "info" | "aviso" | "erro";
type Toast = { id: number; tipo: Tipo; texto: string };

const ESTILOS: Record<Tipo, string> = {
  sucesso: "border-ok/30 bg-ok-soft text-ok-dark",
  info: "border-brand/30 bg-brand-soft text-brand-dark",
  aviso: "border-warn/30 bg-warn-soft text-warn",
  erro: "border-danger/30 bg-red-50 text-danger",
};

const DURACAO = 5000;

const ToastContext = createContext<((texto: string, tipo?: Tipo) => void) | null>(null);

/** Avisos flutuantes. No celular aparecem embaixo, centralizados; no computador, no canto. */
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fechar = useCallback((id: number) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const mostrar = useCallback(
    (texto: string, tipo: Tipo = "info") => {
      const id = Date.now() + Math.random();
      setToasts((lista) => [...lista.slice(-2), { id, tipo, texto }]);
      setTimeout(() => fechar(id), DURACAO);
    },
    [fechar],
  );

  return (
    <ToastContext value={mostrar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg motion-safe:animate-[toast-entrada_200ms_ease-out] ${ESTILOS[toast.tipo]}`}
          >
            <p className="flex-1 leading-snug">{toast.texto}</p>
            <button
              type="button"
              onClick={() => fechar(toast.id)}
              aria-label="Fechar aviso"
              className="-m-1 flex size-7 shrink-0 items-center justify-center rounded-lg opacity-70 hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const mostrar = use(ToastContext);
  if (!mostrar) throw new Error("useToast precisa estar dentro de <Toaster>.");
  return mostrar;
}
