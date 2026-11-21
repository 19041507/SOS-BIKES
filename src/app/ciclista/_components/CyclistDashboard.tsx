import { useEffect, useState } from "react";
import { Mapa } from "@/components/Mapa";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CATEGORIAS, rotuloCategoria, type Categoria } from "@/lib/categorias";
import type { MecanicoDisponivel } from "@/lib/chamados";
import { resumoDoCiclista } from "@/lib/dashboard-ciclista";
import { formatBRL } from "@/lib/money";
import { iniciais, primeiroNome } from "@/lib/pessoas";

type Resumo = Awaited<ReturnType<typeof resumoDoCiclista>>;

type CyclistDashboardProps = {
  perfil: { id: string; nome: string };
  mechanics: MecanicoDisponivel[] | null;
  notice: string | null;
  onStart: (categoria?: Categoria) => void;
};

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="text-star" aria-label={`${nota} de 5 estrelas`}>
      {"★".repeat(nota)}
      <span className="text-line">{"★".repeat(5 - nota)}</span>
    </span>
  );
}

export function CyclistDashboard({ perfil, mechanics, notice, onStart }: CyclistDashboardProps) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erroResumo, setErroResumo] = useState(false);

  useEffect(() => {
    resumoDoCiclista(perfil.id)
      .then(setResumo)
      .catch(() => setErroResumo(true));
  }, [perfil.id]);

  const destaques = mechanics?.slice(0, 3) ?? [];
  const pins = (mechanics ?? []).flatMap((m) =>
    m.latitude != null && m.longitude != null
      ? [{ id: m.id, initials: iniciais(m.nome), rotulo: m.nome, lat: m.latitude, lng: m.longitude }]
      : [],
  );
  const total = mechanics?.length ?? 0;

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-3 sm:p-4 lg:grid-cols-3">
      <Card className="flex flex-col gap-5 lg:col-span-2">
        <div>
          <p className="text-sm font-semibold text-ok">Olá, {primeiroNome(perfil.nome)}!</p>
          <h1 className="mt-1 font-display text-3xl leading-tight font-bold sm:text-4xl">Sua bike deu problema no caminho?</h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            Informe o defeito e onde você está. Mostramos os mecânicos disponíveis para você escolher quem vai atender.
          </p>
        </div>
        <Button size="lg" onClick={() => onStart()} className="h-16 rounded-2xl text-lg sm:w-fit sm:px-10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Preciso de socorro
        </Button>
        <Link href="/ciclista/favoritos" className="flex min-h-11 w-fit items-center gap-2 rounded-lg px-1 text-[15px] font-semibold text-brand hover:underline">
          Ver meus mecânicos favoritos
        </Link>
        <div>
          <p className="text-sm font-semibold text-subtle">Ou vá direto pelo defeito:</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {CATEGORIAS.map((categoria) => (
              <li key={categoria.id}>
                <button
                  type="button"
                  onClick={() => onStart(categoria.id)}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl border border-field bg-white px-3 text-[15px] font-semibold transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {categoria.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {notice && (
          <p role="status" className="rounded-xl bg-ok-soft px-4 py-3 text-[15px] font-medium text-ok-dark">
            {notice}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Mecânicos disponíveis agora</h2>
          {mechanics && (
            <span className="text-3xl font-bold text-ok tabular-nums" aria-label={`${total} disponíveis`}>
              {total}
            </span>
          )}
        </div>
        {mechanics === null && (
          <ul className="flex flex-col gap-2" aria-label="Carregando mecânicos">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-14 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
            ))}
          </ul>
        )}
        {mechanics && total === 0 && (
          <p className="text-[15px] leading-relaxed text-muted">
            Nenhum mecânico disponível agora. Você ainda pode iniciar o pedido: a lista é atualizada na etapa de escolha.
          </p>
        )}
        {destaques.length > 0 && (
          <ul className="flex flex-col gap-2">
            {destaques.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
                  {iniciais(m.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.nome}</p>
                  <p className="truncate text-[13px] text-subtle">{m.oficina ?? "Mecânico autônomo"}</p>
                </div>
                <span className="text-sm font-semibold">
                  {m.media ? (
                    <>
                      <span className="text-star" aria-hidden="true">★</span> {String(m.media).replace(".", ",")}
                    </>
                  ) : (
                    <span className="text-xs font-medium text-subtle">Novo</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Mapa
        className="min-h-[240px] sm:min-h-[320px] lg:col-span-2"
        pins={pins}
        enquadrar={pins}
        chip={mechanics === null ? "Carregando…" : total === 0 ? "Nenhum mecânico disponível agora" : `${total} ${total === 1 ? "mecânico disponível" : "mecânicos disponíveis"} agora`}
      />

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Seu último atendimento</h2>
          {!resumo && !erroResumo && <div className="h-16 rounded-xl bg-slate-100 motion-safe:animate-pulse" />}
          {erroResumo && <p className="text-sm text-muted">Não foi possível carregar agora.</p>}
          {resumo && !resumo.ultimo && <p className="text-[15px] text-muted">Você ainda não teve atendimentos. Quando precisar, é só pedir socorro.</p>}
          {resumo?.ultimo && (
            <div className="flex flex-col gap-1.5 text-[15px]">
              <p className="font-semibold">
                {rotuloCategoria(resumo.ultimo.categoria)} · {formatBRL(resumo.ultimo.valor_final ?? 0)}
              </p>
              <p className="text-muted">
                {resumo.ultimo.mecanico?.nome ?? "Mecânico"}
                {resumo.ultimo.concluido_em && ` · ${dataCurta.format(new Date(resumo.ultimo.concluido_em))}`}
              </p>
              {resumo.ultimo.avaliacao ? (
                <p className="text-sm">
                  Sua nota: <Estrelas nota={resumo.ultimo.avaliacao.nota} />
                </p>
              ) : (
                <p className="text-sm text-subtle">Sem avaliação</p>
              )}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Este mês</h2>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[13px] text-subtle">Atendimentos</dt>
              <dd className="text-2xl font-bold tabular-nums">{resumo ? resumo.chamadosNoMes : "–"}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-subtle">Total pago</dt>
              <dd className="text-2xl font-bold tabular-nums">{resumo ? formatBRL(resumo.gastoNoMes) : "–"}</dd>
            </div>
          </dl>
          <p className="text-xs text-subtle">Valores pagos diretamente aos mecânicos, sem gorjetas.</p>
        </Card>
      </div>
    </main>
  );
}
