"use client";

import { useState, useTransition, type FormEvent } from "react";
import { definirNovaSenha } from "../../_actions/auth";
import { SENHA_MINIMA } from "@/lib/cadastro";

type Erros = { senha?: string; confirmacao?: string; geral?: string };

const inputClass =
  "h-12 w-full rounded-xl border border-field bg-white pr-12 pl-3.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

export function FormularioDeNovaSenha() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [pending, startTransition] = useTransition();

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const novos: Erros = {};
    if (senha.length < SENHA_MINIMA) novos.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    else if (confirmacao !== senha) novos.confirmacao = "As senhas não são iguais.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    startTransition(async () => {
      // Em caso de sucesso, a action sai da conta e volta para o login.
      const resultado = await definirNovaSenha(senha);
      setErros({ geral: resultado.erro });
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-semibold">Nova senha</label>
        <div className="relative">
          <input
            id="senha"
            type={mostrar ? "text" : "password"}
            autoComplete="new-password"
            value={senha}
            onChange={(event) => {
              setSenha(event.target.value);
              setErros({});
            }}
            aria-invalid={Boolean(erros.senha)}
            aria-describedby={erros.senha ? "senha-erro" : "senha-dica"}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {mostrar && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
        {erros.senha ? (
          <p id="senha-erro" className="text-[13px] text-danger">{erros.senha}</p>
        ) : (
          <p id="senha-dica" className="text-[13px] text-subtle">Mínimo de {SENHA_MINIMA} caracteres.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmacao" className="text-sm font-semibold">Confirmar senha</label>
        <input
          id="confirmacao"
          type={mostrar ? "text" : "password"}
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => {
            setConfirmacao(event.target.value);
            setErros({});
          }}
          aria-invalid={Boolean(erros.confirmacao)}
          aria-describedby={erros.confirmacao ? "confirmacao-erro" : undefined}
          className={inputClass}
        />
        {erros.confirmacao && <p id="confirmacao-erro" className="text-[13px] text-danger">{erros.confirmacao}</p>}
      </div>

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
          {erros.geral}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded-xl bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
