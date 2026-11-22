import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ValorAnimado } from "@/components/ui/ValorAnimado";
import { rotuloCategoria } from "@/lib/categorias";
import type { DadosDoPainel } from "@/lib/dashboard-mecanico";
import { formatBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";

type MechanicDashboardProps = {
  dados: DadosDoPainel | null;
  erro: boolean;
};

const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/** Abaixo disso, a taxa de aceite aparece em laranja. */
const ACEITE_BAIXO = 0.5;

function Esqueleto({ className = "h-24" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-100 motion-safe:animate-pulse ${className}`} />;
}

function Indicador({ rotulo, valor, detalhe, className = "" }: { rotulo: string; valor: ReactNode; detalhe: ReactNode; className?: string }) {
  return (
    <Card className={`flex flex-col gap-1 !p-4 ${className}`}>
      <p className="text-[13px] text-subtle">{rotulo}</p>
      <p className="text-2xl font-bold tabular-nums">{valor}</p>
      <div className="text-[13px] text-subtle">{detalhe}</div>
    </Card>
  );
}

function Comparacao({ atual, anterior }: { atual: number; anterior: number }) {
  const diferenca = atual - anterior;
  if (diferenca === 0) return <span>igual aos 7 dias anteriores</span>;
  const subiu = diferenca > 0;
  return (
    <span className={subiu ? "font-semibold text-ok-dark" : "font-semibold text-warn"}>
      {subiu ? "▲" : "▼"} {formatBRL(Math.abs(diferenca))}
      <span className="font-normal text-subtle"> em relação aos 7 dias anteriores</span>
    </span>
  );
}

function Grafico({ grafico }: { grafico: DadosDoPainel["grafico"] }) {
  const maior = Math.max(...grafico.map((d) => d.liquido), 1);
  return (
    <ol className="flex h-44 items-end gap-2 sm:gap-3" aria-label="Ganhos líquidos dos últimos 7 dias">
      {grafico.map(({ dia, liquido }, i) => {
        const hoje = i === grafico.length - 1;
        const rotulo = hoje ? "hoje" : diaDaSemana.format(dia).replace(".", "");
        return (
          <li key={dia.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="sr-only">
              {rotulo}: {formatBRL(liquido)}
            </span>
            {liquido > 0 && (
              <span aria-hidden="true" className="text-[11px] font-semibold whitespace-nowrap text-ink tabular-nums sm:text-xs">
                R$ {Math.round(liquido)}
              </span>
            )}
            <span
              aria-hidden="true"
              style={{ height: liquido > 0 ? `${Math.max((liquido / maior) * 100, 6)}%` : "2px" }}
              className={`w-full max-w-12 rounded-t-md transition-[height] duration-500 motion-reduce:transition-none ${
                liquido === 0 ? "bg-line" : hoje ? "bg-ok" : "bg-brand"
              }`}
            />
            <span aria-hidden="true" className={`text-xs capitalize ${hoje ? "font-bold text-ink" : "text-subtle"}`}>
              {rotulo}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** 0,7 → "42 s"; 6,4 → "6 min"; 95 → "1 h 35 min". */
function duracao(minutos: number) {
  if (minutos < 1) return `${Math.max(1, Math.round(minutos * 60))} s`;
  const inteiros = Math.round(minutos);
  if (inteiros < 60) return `${inteiros} min`;
  const horas = Math.floor(inteiros / 60);
  const resto = inteiros % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function TempoDeAtendimento({ tempos }: { tempos: DadosDoPainel["tempos"] }) {
  const semDados = tempos.resposta === null && tempos.chegada === null && tempos.atendimento === null;
  const atrasou = tempos.chegada !== null && tempos.chegadaEstimada !== null && tempos.chegada > tempos.chegadaEstimada;
  const linhas = [
    { rotulo: "Resposta", ajuda: "do pedido ao seu aceite", valor: tempos.resposta },
    { rotulo: "Chegada", ajuda: "da confirmação até chegar", valor: tempos.chegada },
    { rotulo: "Atendimento", ajuda: "da chegada à conclusão", valor: tempos.atendimento },
  ];

  if (semDados) return <p className="text-[15px] text-muted">Aparece depois dos primeiros atendimentos.</p>;

  return (
    <dl className="flex flex-col divide-y divide-line">
      {linhas.map((linha) => (
        <div key={linha.rotulo} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <dt>
            <span className="block font-semibold">{linha.rotulo}</span>
            <span className="block text-xs text-subtle">{linha.ajuda}</span>
          </dt>
          <dd className="text-right">
            <span className="block text-lg font-bold tabular-nums">{linha.valor === null ? "–" : duracao(linha.valor)}</span>
            {linha.rotulo === "Chegada" && tempos.chegadaEstimada !== null && (
              <span className={`block text-xs ${atrasou ? "font-semibold text-warn" : "text-subtle"}`}>
                você estima {duracao(tempos.chegadaEstimada)}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LinkVerHistorico() {
  return (
    <Link href="/mecanico/historico" className="text-sm font-semibold text-brand hover:text-brand-dark">
      Ver histórico →
    </Link>
  );
}

export function MechanicDashboard({ dados, erro }: MechanicDashboardProps) {
  if (erro && !dados) {
    return <p className="text-sm text-muted">Não foi possível carregar o resumo agora.</p>;
  }

  const taxa = dados && dados.aceite.recebidos > 0 ? dados.aceite.aceitos / dados.aceite.recebidos : null;
  const totalDaSemana = dados?.grafico.reduce((total, d) => total + d.liquido, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {dados ? (
          <>
            <Indicador
              rotulo="Hoje"
              valor={<ValorAnimado valor={dados.hoje.liquido} />}
              detalhe={`${dados.hoje.atendimentos} ${dados.hoje.atendimentos === 1 ? "atendimento" : "atendimentos"}`}
            />
            <Indicador
              rotulo="Últimos 7 dias"
              valor={formatBRL(dados.semana)}
              detalhe={<Comparacao atual={dados.semana} anterior={dados.semanaAnterior} />}
            />
            <Indicador
              rotulo="Este mês"
              valor={formatBRL(dados.mes.liquido)}
              detalhe={`${dados.mes.atendimentos} ${dados.mes.atendimentos === 1 ? "atendimento" : "atendimentos"}`}
            />
            <Indicador
              rotulo="Nota"
              valor={
                dados.media === null ? (
                  <span className="text-base font-semibold text-subtle">Sem avaliações ainda</span>
                ) : (
                  <>
                    <span className="text-star" aria-hidden="true">★</span> {dados.media.toFixed(1).replace(".", ",")}
                  </>
                )
              }
              detalhe={`${dados.totalDeAvaliacoes} ${dados.totalDeAvaliacoes === 1 ? "avaliação" : "avaliações"}`}
            />
            <Indicador
              className="col-span-2 sm:col-span-1"
              rotulo="Taxa de aceite (30 dias)"
              valor={taxa === null ? <span className="text-base font-semibold text-subtle">Sem chamados ainda</span> : `${Math.round(taxa * 100)}%`}
              detalhe={
                taxa === null ? (
                  "Aparece depois dos primeiros chamados."
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div className={`h-full rounded-full ${taxa < ACEITE_BAIXO ? "bg-warn" : "bg-ok"}`} style={{ width: `${taxa * 100}%` }} />
                    </div>
                    <span>
                      {dados.aceite.aceitos} de {dados.aceite.recebidos} chamados
                    </span>
                  </div>
                )
              }
            />
          </>
        ) : (
          [0, 1, 2, 3, 4].map((i) => <Esqueleto key={i} className={`h-28 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`} />)
        )}
      </div>
      {taxa !== null && (
        <p className="-mt-2 text-xs text-subtle">Na taxa de aceite, chamados sem resposta no prazo contam como não aceitos.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Ganhos dos últimos 7 dias</h2>
            {dados && <p className="text-sm text-muted">Total: <strong className="text-ink tabular-nums">{formatBRL(totalDaSemana)}</strong></p>}
          </div>
          {dados ? <Grafico grafico={dados.grafico} /> : <Esqueleto className="h-44" />}
          <p className="text-xs text-subtle">Valores líquidos, já sem a comissão de 10%. Gorjetas não entram.</p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Tempo de atendimento</h2>
            <p className="text-xs text-subtle">Médias dos últimos 30 dias</p>
          </div>
          {dados ? <TempoDeAtendimento tempos={dados.tempos} /> : <Esqueleto className="h-36" />}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Atendimentos recentes</h2>
            <LinkVerHistorico />
          </div>
          {!dados && <Esqueleto />}
          {dados?.recentes.length === 0 && <p className="text-[15px] text-muted">Nenhum atendimento concluído ainda.</p>}
          {dados && dados.recentes.length > 0 && (
            <ul className="flex flex-col divide-y divide-line">
              {dados.recentes.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/mecanico/historico/${a.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{rotuloCategoria(a.categoria)}</p>
                      <p className="truncate text-[13px] text-subtle">
                        {primeiroNome(a.ciclista)} · {dataCurta.format(new Date(a.concluidoEm))}
                      </p>
                    </div>
                    <span className="flex items-center gap-2 font-semibold tabular-nums">
                      {formatBRL(a.liquido)}
                      <span className="text-subtle" aria-hidden="true">›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Últimas avaliações</h2>
          {!dados && <Esqueleto />}
          {dados?.avaliacoes.length === 0 && <p className="text-[15px] text-muted">Sem avaliações ainda. Elas aparecem aqui depois dos atendimentos.</p>}
          {dados && dados.avaliacoes.length > 0 && (
            <ul className="flex flex-col gap-2">
              {dados.avaliacoes.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/mecanico/historico/${a.id}`}
                    className="block rounded-xl bg-surface p-3 hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <p className="text-star">
                      <span aria-hidden="true">
                        {"★".repeat(a.nota)}
                        <span className="text-subtle">{"★".repeat(5 - a.nota)}</span>
                      </span>
                      <span className="sr-only">{a.nota} de 5 estrelas</span>
                    </p>
                    {a.comentario && <p className="mt-1 text-sm leading-snug">“{a.comentario}”</p>}
                    <p className="mt-1 text-xs text-subtle">{primeiroNome(a.ciclista)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {dados && dados.gorjetas.quantidade > 0 && (
            <p className="mt-auto border-t border-line pt-3 text-sm text-muted">
              Gorjetas registradas (30 dias):{" "}
              <strong className="text-ink tabular-nums">{formatBRL(dados.gorjetas.total)}</strong> em {dados.gorjetas.quantidade}{" "}
              {dados.gorjetas.quantidade === 1 ? "atendimento" : "atendimentos"}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
