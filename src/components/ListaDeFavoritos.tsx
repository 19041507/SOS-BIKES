"use client";

import { useEffect } from "react";
import { useFavoritos } from "./FavoritosProvider";
import { SalvarMecanico } from "./SalvarMecanico";
import { Button, ButtonLink } from "./ui/Button";
import { iniciais } from "@/lib/pessoas";

export function ListaDeFavoritos() {
  const { favoritos, carregando, erro, atualizar } = useFavoritos();
  const ordenados = [...favoritos].sort(
    (a, b) => Number(b.disponivel) - Number(a.disponivel) || a.nome.localeCompare(b.nome),
  );

  useEffect(() => {
    void atualizar();
  }, [atualizar]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mecânicos favoritos</h1>
          <p className="mt-1 text-[15px] text-muted">
            Encontre quem você salvou e peça socorro novamente.
          </p>
        </div>
        <Button variant="secondary" loading={carregando} onClick={() => void atualizar()}>
          Atualizar lista
        </Button>
      </div>
      <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
        Ao chamar novamente, você informa o defeito e o endereço.
        O mecânico precisa aceitar e enviar uma nova estimativa.
      </p>
      {erro && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-danger">
          {erro} Use “Atualizar lista” para tentar novamente.
        </p>
      )}
      {carregando && (
        <div
          className="h-28 rounded-2xl bg-slate-100 motion-safe:animate-pulse"
          aria-label="Carregando favoritos"
        />
      )}
      {!carregando && !erro && ordenados.length === 0 && (
        <div className={
          "flex flex-col items-center gap-3 rounded-2xl border border-dashed " +
          "border-field px-4 py-10 text-center"
        }>
          <p className="font-semibold">Você ainda não salvou nenhum mecânico</p>
          <p className="max-w-md text-sm text-muted">
            Use “Salvar mecânico” na lista de mecânicos ou depois de um atendimento
            para encontrá-lo aqui.
          </p>
          <ButtonLink href="/ciclista" variant="secondary">Pedir socorro</ButtonLink>
        </div>
      )}
      {!carregando && !erro && ordenados.length > 0 && (
        <ul className="flex flex-col gap-3">
          {ordenados.map((mecanico) => (
            <li
              key={mecanico.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4"
            >
              <span className={
                "flex size-12 shrink-0 items-center justify-center rounded-full " +
                "bg-brand-muted font-bold text-brand"
              }>
                {iniciais(mecanico.nome)}
              </span>
              <div className="min-w-0 flex-[1_1_180px]">
                <h2 className="break-words font-semibold">{mecanico.nome}</h2>
                <p className="text-sm text-subtle">{mecanico.oficina ?? "Mecânico autônomo"}</p>
                <p className={`mt-1 text-sm font-semibold ${mecanico.disponivel ? "text-ok-dark" : "text-subtle"}`}>
                  {mecanico.disponivel ? "Disponível agora" : "Indisponível no momento"}
                </p>
                {mecanico.media !== null && (
                  <p className="mt-1 text-[13px] text-subtle">
                    <span className="text-star" aria-label="Nota">★</span>{" "}
                    {String(mecanico.media).replace(".", ",")} · {mecanico.avaliacoes} avaliações
                  </p>
                )}
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <SalvarMecanico mecanico={mecanico} />
                {mecanico.disponivel ? (
                  <ButtonLink
                    href={`/ciclista?mecanico=${encodeURIComponent(mecanico.id)}`}
                    variant="success"
                  >
                    Chamar novamente
                  </ButtonLink>
                ) : <Button disabled>Indisponível</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
