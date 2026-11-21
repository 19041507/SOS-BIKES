"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pedirNovaSenha } from "../../_actions/auth";
import { emailValido } from "@/lib/cadastro";

export function FormularioDeRecuperacao() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const linkInvalido = params.get("link") === "invalido";

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailValido(email.trim())) {
      setErro("Informe um e-mail válido.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await pedirNovaSenha(email);
      if ("erro" in resultado) setErro(resultado.erro);
      else setEnviadoPara(email.trim().toLowerCase());
    });
  }

  if (enviadoPara) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-2xl border border-line bg-ok-soft p-6">
        <h2 className="font-display text-xl font-bold text-ok-dark">Confira seu e-mail</h2>
        <p className="text-[15px] leading-relaxed text-ink">
          Se houver uma conta com <strong className="break-all">{enviadoPara}</strong>, você vai receber um link em alguns
          minutos.
        </p>
        <p className="text-sm text-muted">Não chegou? Confira a caixa de spam.</p>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl border border-field bg-white text-[15px] font-semibold text-ink hover:bg-surface"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      {linkInvalido && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-snug font-medium text-warn">
          O link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErro(null);
          }}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? "email-erro" : undefined}
          className="h-12 rounded-xl border border-field bg-white px-3.5 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
        />
        {erro && <p id="email-erro" className="text-[13px] text-danger">{erro}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded-xl bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Enviando…" : "Enviar link"}
      </button>
    </form>
  );
}
