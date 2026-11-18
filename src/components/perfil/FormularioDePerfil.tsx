"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { atualizarPerfil } from "@/app/_actions/perfil";
import { usePerfil } from "@/components/PerfilProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toaster";
import { formatarTelefone, normalizarTelefone } from "@/lib/cadastro";
import { iniciais } from "@/lib/pessoas";

type Campo = "nome" | "telefone" | "oficina";

const inputClass =
  "h-12 w-full rounded-xl border border-field bg-white px-3.5 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

export function FormularioDePerfil() {
  const perfil = usePerfil();
  const router = useRouter();
  const avisar = useToast();
  const mecanico = perfil.tipo === "mecanico";
  const [valores, setValores] = useState<Record<Campo, string>>({
    nome: perfil.nome,
    telefone: formatarTelefone(perfil.telefone ?? ""),
    oficina: perfil.oficina ?? "",
  });
  const [erros, setErros] = useState<Partial<Record<Campo | "geral", string>>>({});
  const [salvando, startTransition] = useTransition();

  function alterar(campo: Campo, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: campo === "telefone" ? formatarTelefone(valor) : valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const novos: typeof erros = {};
    if (valores.nome.trim().length < 3) novos.nome = "Informe seu nome.";
    if (!normalizarTelefone(valores.telefone)) novos.telefone = "Informe o WhatsApp com DDD.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    startTransition(async () => {
      const resultado = await atualizarPerfil(valores);
      if ("erros" in resultado) {
        setErros(resultado.erros);
        return;
      }
      avisar("Perfil atualizado.", "sucesso");
      // Recarrega o layout para o cabeçalho mostrar o nome novo.
      router.refresh();
    });
  }

  const campo = (id: Campo) => ({
    id,
    value: valores[id],
    onChange: (event: ChangeEvent<HTMLInputElement>) => alterar(id, event.target.value),
    "aria-invalid": Boolean(erros[id]),
    "aria-describedby": erros[id] ? `${id}-erro` : undefined,
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xl font-bold text-brand">
          {iniciais(valores.nome || perfil.nome)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Meu perfil</h1>
          <p className="text-[15px] text-muted">{mecanico ? "Mecânico" : "Ciclista"}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={salvar} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-sm font-semibold">Nome completo</label>
            <input {...campo("nome")} autoComplete="name" className={inputClass} />
            {erros.nome && <p id="nome-erro" className="text-[13px] text-danger">{erros.nome}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="telefone" className="text-sm font-semibold">WhatsApp</label>
            <input {...campo("telefone")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(81) 99999-0000" className={inputClass} />
            {erros.telefone ? (
              <p id="telefone-erro" className="text-[13px] text-danger">{erros.telefone}</p>
            ) : (
              <p className="text-[13px] text-subtle">
                {mecanico ? "Os ciclistas usam esse número para falar com você durante o atendimento." : "O mecânico usa esse número para falar com você durante o atendimento."}
              </p>
            )}
          </div>

          {mecanico && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="oficina" className="text-sm font-semibold">
                Oficina <span className="font-normal text-subtle">(opcional)</span>
              </label>
              <input {...campo("oficina")} autoComplete="organization" className={inputClass} />
              <p className="text-[13px] text-subtle">Em branco, você aparece como &quot;Mecânico autônomo&quot;.</p>
            </div>
          )}

          {erros.geral && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
              {erros.geral}
            </p>
          )}

          <Button type="submit" size="lg" loading={salvando} loadingText="Salvando…" className="sm:w-fit sm:px-10">
            Salvar alterações
          </Button>
        </form>
      </Card>
    </main>
  );
}
