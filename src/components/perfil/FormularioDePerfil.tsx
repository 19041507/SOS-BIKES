"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { atualizarPerfil } from "@/app/_actions/perfil";
import { usePerfil } from "@/components/PerfilProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toaster";
import { formatarTelefone, normalizarTelefone } from "@/lib/cadastro";
import { CATEGORIAS, type Categoria } from "@/lib/categorias";
import { iniciais } from "@/lib/pessoas";

type Campo = "nome" | "telefone" | "oficina" | "bairro_regiao";
type CampoComErro = Campo | "especialidades" | "servicos" | "geral";

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
    bairro_regiao: perfil.bairro_regiao ?? "",
  });
  // `?? []`: se o código chegar antes da migration, as colunas novas ainda não existem.
  const [especialidades, setEspecialidades] = useState<Categoria[]>(perfil.especialidades ?? []);
  const [servicos, setServicos] = useState((perfil.servicos ?? []).join("\n"));
  const [erros, setErros] = useState<Partial<Record<CampoComErro, string>>>({});
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
    const servicosInformados = servicos.split(/\r?\n/).map((servico) => servico.trim()).filter(Boolean);
    if (servicosInformados.length > 8 || servicosInformados.some((servico) => servico.length > 80)) {
      novos.servicos = "Informe até 8 serviços, com no máximo 80 caracteres cada.";
    }
    const regiao = valores.bairro_regiao.trim();
    if (mecanico && regiao.length === 1) novos.bairro_regiao = "Informe pelo menos 2 caracteres.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    startTransition(async () => {
      const resultado = await atualizarPerfil({ ...valores, especialidades, servicos });
      if ("erros" in resultado) {
        setErros(resultado.erros);
        return;
      }
      avisar("Perfil atualizado.", "sucesso");
      // Recarrega o layout para o cabeçalho mostrar o nome novo.
      router.refresh();
    });
  }

  function alternarEspecialidade(categoria: Categoria) {
    setEspecialidades((atuais) =>
      atuais.includes(categoria)
        ? atuais.filter((atual) => atual !== categoria)
        : [...atuais, categoria],
    );
    setErros((atuais) => ({ ...atuais, especialidades: undefined, geral: undefined }));
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
        {mecanico && (
          <Link
            href={`/mecanicos/${perfil.id}`}
            className="ml-auto flex min-h-11 items-center rounded-xl border border-field bg-white px-3 text-sm font-semibold text-brand hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          >
            Visualizar perfil público
          </Link>
        )}
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

          {mecanico && (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold">Especialidades</legend>
                <p className="text-[13px] text-subtle">Selecione os tipos de reparo que você atende.</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {CATEGORIAS.map((categoria) => (
                    <label key={categoria.id} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={especialidades.includes(categoria.id)}
                        onChange={() => alternarEspecialidade(categoria.id)}
                        className="size-4 accent-brand"
                      />
                      {categoria.label}
                    </label>
                  ))}
                </div>
                {erros.especialidades && <p role="alert" className="text-[13px] text-danger">{erros.especialidades}</p>}
              </fieldset>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="servicos" className="text-sm font-semibold">
                  Serviços oferecidos <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <textarea
                  id="servicos"
                  rows={3}
                  value={servicos}
                  onChange={(event) => {
                    setServicos(event.target.value);
                    setErros((atuais) => ({ ...atuais, servicos: undefined, geral: undefined }));
                  }}
                  maxLength={648}
                  placeholder={"Uma linha por serviço\nEx.: revisão geral"}
                  aria-invalid={Boolean(erros.servicos)}
                  aria-describedby={erros.servicos ? "servicos-erro" : "servicos-ajuda"}
                  className="resize-y rounded-xl border border-field bg-white p-3.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
                />
                {erros.servicos ? (
                  <p id="servicos-erro" role="alert" className="text-[13px] text-danger">{erros.servicos}</p>
                ) : (
                  <p id="servicos-ajuda" className="text-[13px] text-subtle">Até 8 serviços, um por linha.</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="bairro_regiao" className="text-sm font-semibold">
                  Bairro ou região de atendimento <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <input
                  {...campo("bairro_regiao")}
                  minLength={2}
                  maxLength={80}
                  placeholder="Ex.: Boa Vista e região central"
                  autoComplete="address-level3"
                  className={inputClass}
                />
                {erros.bairro_regiao ? (
                  <p id="bairro_regiao-erro" role="alert" className="text-[13px] text-danger">{erros.bairro_regiao}</p>
                ) : (
                  <p className="text-[13px] text-subtle">Informe uma região aproximada, não um endereço pessoal.</p>
                )}
              </div>
            </>
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
