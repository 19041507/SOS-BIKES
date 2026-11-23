"use client";

import { useId, useState } from "react";

type CampoSenhaProps = {
  titulo: string;
  valor: string;
  alterar: (valor: string) => void;
  atual?: boolean;
  erro?: string;
};

export function CampoSenha({ titulo, valor, alterar, atual, erro }: CampoSenhaProps) {
  const id = useId();
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{titulo}</label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          autoComplete={atual ? "current-password" : "new-password"}
          value={valor}
          onChange={event => alterar(event.target.value)}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="h-12 w-full min-w-0 rounded-xl border border-field bg-white pr-12 pl-3.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
        />
        <button
          type="button"
          onClick={() => setVisivel(!visivel)}
          aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${titulo.toLocaleLowerCase("pt-BR")}`}
          aria-pressed={visivel}
          className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visivel && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
      {erro && <p id={`${id}-erro`} className="text-[13px] text-danger">{erro}</p>}
    </div>
  );
}
