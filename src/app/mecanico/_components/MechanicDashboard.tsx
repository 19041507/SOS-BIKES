import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { rotuloCategoria } from "@/lib/categorias";
import type { DadosDoPainel } from "@/lib/dashboard-mecanico";
import { formatBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";

type MechanicDashboardProps = {
  dados: DadosDoPainel | null;
  erro: boolean;
  online: boolean;
  busy: boolean;
  onGoOnline: () => void;
};

const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function Esqueleto({ className = "h-24" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-100 motion-safe:animate-pulse ${className}`} />;
}

function Grafico({ grafico }: { grafico: DadosDoPainel["grafico"] }) {
  const maior = Math.max(...grafico.map((d) => d.liquido), 1);
  return (
    <ol className="flex h-36 items-end gap-2" aria-label="Ganhos líquidos dos últimos 7 dias">
      {grafico.map(({ dia, liquido }, i) => {
        const hoje = i === grafico.length - 1;
        return (
          <li key={dia.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="sr-only">
              {diaDaSemana.format(dia)}: {formatBRL(liquido)}
            </span>
            <span
              aria-hidden="true"
              title={formatBRL(liquido)}
              style={{ height: `${Math.max((liquido / maior) * 100, liquido > 0 ? 6 : 2)}%` }}
              className={`w-full max-w-10 rounded-t-md transition-[height] duration-500 ${hoje ? "bg-ok" : "bg-brand-muted"}`}
            />
            <span aria-hidden="true" className={`text-xs capitalize ${hoje ? "font-bold text-ink" : "text-subtle"}`}>
              {hoje ? "hoje" : diaDaSemana.format(dia).replace(".", "")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function MechanicDashboard({ dados, erro, online, busy, onGoOnline }: MechanicDashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      {online ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-ok-soft px-4 py-3.5 text-ok-dark">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full rounded-full bg-ok opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-3 rounded-full bg-ok" />
          </span>
          <p className="text-[15px] font-medium">Você está disponível. Os chamados aparecem aqui assim que um ciclista escolher você.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-field px-4 py-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[15px] text-muted">
            <strong className="text-ink">Você está indisponível.</strong> Fique disponível para aparecer na lista dos ciclistas.
          </p>
          <Button variant="success" onClick={onGoOnline} loading={busy}>
            Ficar disponível
          </Button>
        </div>
      )}

      {erro && <p className="text-sm text-muted">Não foi possível carregar o resumo agora.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Ganhos</h2>
          {dados ? (
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[13px] text-subtle">Últimos 7 dias</dt>
                <dd className="text-2xl font-bold tabular-nums">{formatBRL(dados.semana)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-subtle">Este mês</dt>
                <dd className="text-2xl font-bold tabular-nums">{formatBRL(dados.mes)}</dd>
              </div>
            </dl>
          ) : (
            <Esqueleto className="h-14" />
          )}
          <p className="text-xs text-subtle">Valores líquidos, já sem a comissão de 10%. Gorjetas não entram.</p>
        </Card>

        <Card className="flex flex-col gap-3 sm:col-span-2 xl:col-span-1 xl:row-span-2">
          <h2 className="font-display text-lg font-bold">Últimos 7 dias</h2>
          {dados ? <Grafico grafico={dados.grafico} /> : <Esqueleto className="h-36" />}
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Taxa de aceite</h2>
          {dados ? (
            dados.taxaDeAceite === null ? (
              <p className="text-[15px] text-muted">Aparece depois dos primeiros chamados.</p>
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums">{Math.round(dados.taxaDeAceite * 100)}%</p>
                <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-ok" style={{ width: `${dados.taxaDeAceite * 100}%` }} />
                </div>
                <p className="text-xs text-subtle">Chamados aceitos nos últimos 30 dias, entre os recebidos.</p>
              </>
            )
          ) : (
            <Esqueleto className="h-16" />
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Atendimentos recentes</h2>
          {!dados && <Esqueleto />}
          {dados?.recentes.length === 0 && <p className="text-[15px] text-muted">Nenhum atendimento concluído ainda.</p>}
          {dados && dados.recentes.length > 0 && (
            <ul className="flex flex-col divide-y divide-line">
              {dados.recentes.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{rotuloCategoria(a.categoria)}</p>
                    <p className="truncate text-[13px] text-subtle">
                      {primeiroNome(a.ciclista)} · {dataCurta.format(new Date(a.concluidoEm))}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatBRL(a.liquido)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3 sm:col-span-2 xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Últimas avaliações</h2>
            {dados?.media != null && (
              <p className="text-sm text-muted">
                <span className="text-star" aria-hidden="true">★</span>{" "}
                <strong className="text-ink">{dados.media.toFixed(1).replace(".", ",")}</strong> de média em {dados.totalDeAvaliacoes}{" "}
                {dados.totalDeAvaliacoes === 1 ? "avaliação" : "avaliações"}
              </p>
            )}
          </div>
          {!dados && <Esqueleto />}
          {dados?.avaliacoes.length === 0 && <p className="text-[15px] text-muted">Sem avaliações ainda. Elas aparecem aqui depois dos atendimentos.</p>}
          {dados && dados.avaliacoes.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-3">
              {dados.avaliacoes.map((a) => (
                <li key={a.id} className="rounded-xl bg-surface p-3">
                  <p className="text-star" aria-label={`${a.nota} de 5 estrelas`}>
                    {"★".repeat(a.nota)}
                    <span className="text-line">{"★".repeat(5 - a.nota)}</span>
                  </p>
                  {a.comentario && <p className="mt-1 text-sm leading-snug">“{a.comentario}”</p>}
                  <p className="mt-1 text-xs text-subtle">{primeiroNome(a.ciclista)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
