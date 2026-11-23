"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { trocarSenha } from "@/app/_actions/auth";
import { SENHA_MINIMA } from "@/lib/cadastro";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { CampoSenha } from "./CampoSenha";

type Campos = "atual" | "nova" | "confirmacao";

export function TrocarSenha() {
  const [valores, setValores] = useState({ atual: "", nova: "", confirmacao: "" });
  const [erros, setErros] = useState<Partial<Record<Campos | "geral", string>>>({});
  const [salvando, iniciar] = useTransition();
  const [revisao, setRevisao] = useState(0);
  const ocupado = useRef(false);
  const avisar = useToast();

  function alterar(campo: Campos, valor: string) {
    setValores(atuais => ({ ...atuais, [campo]: valor }));
    setErros(atuais => ({ ...atuais, [campo]: undefined, confirmacao: undefined, geral: undefined }));
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado.current) return;
    const novos: typeof erros = {};
    if (!valores.atual) novos.atual = "Informe sua senha atual.";
    if (valores.nova.length < SENHA_MINIMA) novos.nova = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    if (valores.nova !== valores.confirmacao) novos.confirmacao = "As senhas não são iguais.";
    setErros(novos);
    if (Object.keys(novos).length) return;
    ocupado.current = true;
    iniciar(async () => {
      try {
        const resultado = await trocarSenha({ atual: valores.atual, nova: valores.nova });
        if ("erro" in resultado) {
          setErros({ geral: resultado.erro });
          return;
        }
        setValores({ atual: "", nova: "", confirmacao: "" });
        setRevisao(atual => atual + 1);
        avisar("Senha alterada.", "sucesso");
      } catch {
        setErros({ geral: "Não foi possível alterar a senha. Tente de novo." });
      } finally {
        ocupado.current = false;
      }
    });
  }

  return (
    <Card>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h14v11H5ZM8 10V7a4 4 0 0 1 8 0v3" /></svg>
        </span>
        <div><h2 className="font-display text-xl font-bold">Senha</h2><p className="mt-1 text-sm text-muted">Altere sua senha sem sair da conta.</p></div>
      </div>
      <form onSubmit={salvar} noValidate>
        <fieldset disabled={salvando} className="flex min-w-0 flex-col gap-4">
          <legend className="sr-only">Trocar senha</legend>
          <CampoSenha key={`atual-${revisao}`} titulo="Senha atual" atual valor={valores.atual} alterar={valor => alterar("atual", valor)} erro={erros.atual} />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <CampoSenha key={`nova-${revisao}`} titulo="Nova senha" valor={valores.nova} alterar={valor => alterar("nova", valor)} erro={erros.nova} />
            <CampoSenha key={`confirmacao-${revisao}`} titulo="Confirmar senha" valor={valores.confirmacao} alterar={valor => alterar("confirmacao", valor)} erro={erros.confirmacao} />
          </div>
          <p className="text-[13px] text-subtle">Mínimo de {SENHA_MINIMA} caracteres. Não compartilhe sua senha.</p>
          {erros.geral && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{erros.geral}</p>}
          <Button type="submit" loading={salvando} loadingText="Trocando senha…" className="w-full sm:w-fit">Trocar senha</Button>
        </fieldset>
      </form>
    </Card>
  );
}
