import { Card } from "@/components/ui/Card";
import { StatusBadge, rotuloStatus } from "@/components/ui/StatusBadge";
import { rotuloCategoria } from "@/lib/categorias";
import type { ChamadoCompleto } from "@/lib/chamados";
import { AvaliarCiclista } from "@/components/AvaliarCiclista";
import { formatBRL } from "@/lib/money";
import { iniciais, linksDeContato } from "@/lib/pessoas";
import { dataEHora, hora } from "./datas";

type DetalheDoChamadoProps = {
  chamado: ChamadoCompleto;
  /** Quem está vendo: muda a outra pessoa mostrada e os valores (o mecânico vê comissão e líquido). */
  visao: "ciclista" | "mecanico";
};

function etapas(chamado: ChamadoCompleto) {
  const lista: { rotulo: string; quando: string | null }[] = [
    { rotulo: "Pedido enviado", quando: chamado.criado_em },
    { rotulo: "Aceito pelo mecânico", quando: chamado.aceito_em },
    { rotulo: "Confirmado pelo ciclista", quando: chamado.confirmado_em },
    { rotulo: "Mecânico no local", quando: chamado.chegada_em },
    { rotulo: "Atendimento concluído", quando: chamado.concluido_em },
  ];
  const feitas = lista.filter((e) => e.quando);
  if (chamado.encerrado_em) feitas.push({ rotulo: rotuloStatus(chamado.status), quando: chamado.encerrado_em });
  return feitas;
}

export function DetalheDoChamado({ chamado, visao }: DetalheDoChamadoProps) {
  const outra = visao === "ciclista" ? chamado.mecanico : chamado.ciclista;
  const nomeDaOutra = outra?.nome ?? (visao === "ciclista" ? "Mecânico" : "Ciclista");
  const contato = linksDeContato(outra?.telefone ?? null);
  const valorFinal = chamado.valor_final;
  const comissao = chamado.comissao ?? 0;
  const mudouPreco = valorFinal !== null && chamado.estimativa !== null && valorFinal !== chamado.estimativa;
  const linhaDoTempo = etapas(chamado);
  const encerrado = ["recusado", "cancelado", "expirado"].includes(chamado.status);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-subtle">{dataEHora.format(new Date(chamado.criado_em))}</p>
              <h1 className="mt-0.5 font-display text-2xl font-bold">{rotuloCategoria(chamado.categoria)}</h1>
            </div>
            <StatusBadge status={chamado.status} />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[13px] text-subtle">Endereço</dt>
              <dd className="font-medium">{chamado.endereco}</dd>
            </div>
            {chamado.detalhes && (
              <div>
                <dt className="text-[13px] text-subtle">Detalhes</dt>
                <dd className="font-medium">“{chamado.detalhes}”</dd>
              </div>
            )}
            {chamado.motivo_cancelamento && (
              <div className="sm:col-span-2">
                <dt className="text-[13px] text-subtle">Motivo do cancelamento</dt>
                <dd className="font-medium">{chamado.motivo_cancelamento}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold">Linha do tempo</h2>
          <ol className="flex flex-col">
            {linhaDoTempo.map((etapa, i) => {
              const ultima = i === linhaDoTempo.length - 1;
              const corDoPonto = ultima && encerrado ? "bg-slate-400" : "bg-ok";
              return (
                <li key={etapa.rotulo} className="flex gap-3">
                  <div className="flex flex-col items-center" aria-hidden="true">
                    <span className={`mt-1 size-3 shrink-0 rounded-full ${corDoPonto}`} />
                    {!ultima && <span className="w-0.5 flex-1 bg-line" />}
                  </div>
                  <div className={ultima ? "" : "pb-4"}>
                    <p className="font-semibold">{etapa.rotulo}</p>
                    <p className="text-[13px] text-subtle">{hora.format(new Date(etapa.quando!))}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">{visao === "ciclista" ? "Mecânico" : "Ciclista"}</h2>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
              {iniciais(nomeDaOutra)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{nomeDaOutra}</p>
              {visao === "ciclista" && <p className="truncate text-[13px] text-subtle">{chamado.mecanico?.oficina ?? "Mecânico autônomo"}</p>}
            </div>
          </div>
          {contato && (
            <div className="grid grid-cols-2 gap-2">
              <a href={contato.whatsapp} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-field text-sm font-semibold hover:bg-surface">
                WhatsApp
              </a>
              <a href={contato.ligacao} className="flex h-11 items-center justify-center rounded-xl border border-field text-sm font-semibold hover:bg-surface">
                Ligar
              </a>
            </div>
          )}
        </Card>

        {(chamado.estimativa !== null || valorFinal !== null) && (
          <Card className="flex flex-col gap-1">
            <h2 className="mb-2 font-display text-lg font-bold">Valores</h2>
            <dl className="divide-y divide-line text-[15px]">
              {chamado.estimativa !== null && (
                <div className={`flex justify-between py-2 ${mudouPreco ? "text-muted" : ""}`}>
                  <dt>Estimativa</dt>
                  <dd>{formatBRL(chamado.estimativa)}</dd>
                </div>
              )}
              {valorFinal !== null && (
                <div className="flex justify-between py-2 font-bold">
                  <dt>Valor final</dt>
                  <dd>{formatBRL(valorFinal)}</dd>
                </div>
              )}
              {visao === "mecanico" && valorFinal !== null && (
                <>
                  <div className="flex justify-between py-2 text-muted">
                    <dt>Comissão (10%)</dt>
                    <dd>− {formatBRL(comissao)}</dd>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-ok-dark">
                    <dt>Líquido</dt>
                    <dd>{formatBRL(valorFinal - comissao)}</dd>
                  </div>
                </>
              )}
            </dl>
            {mudouPreco && chamado.motivo_variacao && (
              <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">Motivo da variação: {chamado.motivo_variacao}</p>
            )}
          </Card>
        )}

        {chamado.status === "concluido" && (
          <Card className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-bold">{visao === "mecanico" ? "Avaliação recebida do ciclista" : "Sua avaliação do mecânico"}</h2>
            {chamado.avaliacao ? (
              <>
                <p className="text-xl text-star" aria-label={`${chamado.avaliacao.nota} de 5 estrelas`}>
                  {"★".repeat(chamado.avaliacao.nota)}
                  <span className="text-line">{"★".repeat(5 - chamado.avaliacao.nota)}</span>
                </p>
                {chamado.avaliacao.comentario && <p className="text-[15px]">“{chamado.avaliacao.comentario}”</p>}
                {chamado.avaliacao.gorjeta ? (
                  <p className="text-sm text-muted">Gorjeta registrada: {formatBRL(chamado.avaliacao.gorjeta)}</p>
                ) : null}
              </>
            ) : (
              <p className="text-[15px] text-muted">Sem avaliação.</p>
            )}
          </Card>
        )}
        {chamado.status === "concluido" && (
          <Card className="flex flex-col gap-2">
            {visao === "mecanico" ? (
              <AvaliarCiclista key={chamado.id} chamado={chamado} />
            ) : (
              <>
                <h2 className="font-display text-lg font-bold">Avaliação recebida do mecânico</h2>
                {chamado.avaliacao_ciclista ? (
                  <>
                    <p className="text-xl text-star" aria-label={`${chamado.avaliacao_ciclista.nota} de 5 estrelas`}>
                      {"★".repeat(chamado.avaliacao_ciclista.nota)}
                      <span className="text-line">{"★".repeat(5 - chamado.avaliacao_ciclista.nota)}</span>
                    </p>
                    {chamado.avaliacao_ciclista.comentario && (
                      <p className="break-words text-[15px]">{chamado.avaliacao_ciclista.comentario}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">O mecânico ainda não avaliou este atendimento.</p>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
