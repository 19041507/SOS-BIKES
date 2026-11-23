import Image from "next/image";
import Link from "next/link";
import { VoltarDoPerfil } from "./VoltarDoPerfil";
import { Card } from "@/components/ui/Card";
import { CATEGORIAS } from "@/lib/categorias";
import type { PerfilPublicoDoMecanico } from "@/lib/perfil-publico-mecanico";
import { iniciais } from "@/lib/pessoas";

function Avaliacao({ nota }: { nota: number }) {
  return (
    <span role="img" className="text-star" aria-label={`${String(nota).replace(".", ",")} de 5 estrelas`}>
      {"★".repeat(Math.round(nota))}
      <span className="text-line">{"★".repeat(5 - Math.round(nota))}</span>
    </span>
  );
}

export function PerfilPublicoMecanico({
  mecanico,
  podeSolicitar,
}: {
  mecanico: PerfilPublicoDoMecanico;
  podeSolicitar: boolean;
}) {
  const fotoPerfil = mecanico.fotos.find((foto) => foto.tipo === "perfil");
  const fotosTrabalho = mecanico.fotos.filter((foto) => foto.tipo === "trabalho");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <VoltarDoPerfil inicio={podeSolicitar ? "/ciclista" : "/mecanico"} />

      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {fotoPerfil ? (
          <Image
            src={fotoPerfil.url}
            alt={fotoPerfil.descricao}
            width={112}
            height={112}
            unoptimized
            className="size-24 shrink-0 rounded-full object-cover sm:size-28"
          />
        ) : (
          <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-brand-muted font-display text-3xl font-bold text-brand sm:size-28">
            {iniciais(mecanico.nome)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand">Perfil do mecânico</p>
          <h1 className="mt-1 break-words font-display text-3xl font-bold sm:text-4xl">{mecanico.nome}</h1>
          <p className="mt-1 break-words text-base text-muted">{mecanico.oficina ?? "Mecânico autônomo"}</p>
          {mecanico.bairro_regiao && (
            <p className="mt-2 text-sm text-muted">
              <span aria-hidden="true">⌖ </span>
              Atende em {mecanico.bairro_regiao}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {mecanico.media !== null ? (
              <span className="font-semibold">
                <Avaliacao nota={mecanico.media} />{" "}
                {String(mecanico.media).replace(".", ",")} ({mecanico.avaliacoes}{" "}
                {mecanico.avaliacoes === 1 ? "avaliação" : "avaliações"})
              </span>
            ) : (
              <span className="text-subtle">Sem avaliações ainda</span>
            )}
            <span className="text-subtle">
              {mecanico.atendimentos} {mecanico.atendimentos === 1 ? "atendimento concluído" : "atendimentos concluídos"}
            </span>
          </div>
        </div>
        {podeSolicitar && (
          <Link
            href={`/ciclista?mecanico=${encodeURIComponent(mecanico.id)}`}
            className="flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-ok px-5 text-center text-sm font-semibold text-white hover:bg-ok-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ok"
          >
            Solicitar atendimento
          </Link>
        )}
      </Card>

      <section aria-labelledby="especialidades-titulo">
        <Card className="flex flex-col gap-3">
          <h2 id="especialidades-titulo" className="font-display text-xl font-bold">Especialidades</h2>
          {mecanico.especialidades.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {mecanico.especialidades.map((especialidade) => {
                const categoria = CATEGORIAS.find((item) => item.id === especialidade);
                return categoria ? (
                  <li key={especialidade} className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-dark">
                    {categoria.label}
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">Ainda não informou especialidades.</p>
          )}
          {mecanico.servicos.length > 0 && (
            <div className="border-t border-line pt-3">
              <h3 className="text-sm font-semibold">Serviços oferecidos</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {mecanico.servicos.map((servico, indice) => (
                  <li key={`${indice}-${servico}`} className="max-w-full break-words rounded-full bg-surface px-3 py-1.5 text-sm text-muted">{servico}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby="fotos-titulo">
        <Card className="flex flex-col gap-3">
          <h2 id="fotos-titulo" className="font-display text-xl font-bold">Fotos dos trabalhos</h2>
          {fotosTrabalho.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotosTrabalho.map((foto) => (
                <li key={foto.id}>
                  <Image
                    src={foto.url}
                    alt={foto.descricao}
                    width={480}
                    height={360}
                    unoptimized
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  <p className="mt-1.5 break-words text-sm text-muted">{foto.descricao}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Ainda não publicou fotos de trabalhos.</p>
          )}
        </Card>
      </section>

      <section aria-labelledby="avaliacoes-titulo">
        <Card className="flex flex-col gap-3">
          <div>
            <h2 id="avaliacoes-titulo" className="font-display text-xl font-bold">Avaliações dos clientes</h2>
            <p className="mt-1 text-sm text-subtle">Comentários publicados com autorização de quem avaliou.</p>
          </div>
          {mecanico.avaliacoesPublicas.length > 0 ? (
            <ul className="divide-y divide-line">
              {mecanico.avaliacoesPublicas.map((avaliacao, indice) => (
                <li key={`${avaliacao.nota}-${indice}`} className="py-3 first:pt-0 last:pb-0">
                  <Avaliacao nota={avaliacao.nota} />
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{avaliacao.comentario}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Ainda não há comentários públicos.</p>
          )}
        </Card>
      </section>
    </main>
  );
}
