import type { MecanicoDisponivel } from "@/lib/chamados";
import { formatarDistancia } from "@/lib/localizacao";
import { iniciais } from "@/lib/pessoas";
import { StepHeader } from "./StepHeader";
import { Button } from "@/components/ui/Button";
import { SalvarMecanico } from "@/components/SalvarMecanico";

type MechanicListStepProps = {
  mechanics: MecanicoDisponivel[] | null;
  notice: string | null;
  error: string | null;
  requesting: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onChoose: (mechanic: MecanicoDisponivel) => void;
};

function Avaliacao({ mechanic }: { mechanic: MecanicoDisponivel }) {
  if (!mechanic.avaliacoes) return <span>Novo na plataforma</span>;
  return (
    <span>
      <span className="text-star" aria-hidden="true">★</span> {String(mechanic.media).replace(".", ",")}{" "}
      ({mechanic.avaliacoes} {mechanic.avaliacoes === 1 ? "avaliação" : "avaliações"})
    </span>
  );
}

export function MechanicListStep({ mechanics, notice, error, requesting, onBack, onRefresh, onChoose }: MechanicListStepProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <StepHeader eyebrow="Etapa 3 de 3" title="Escolha um mecânico" onBack={onBack} />
      {notice && (
        <div role="status" className="rounded-xl bg-warn-soft px-3.5 py-3 text-sm leading-snug font-medium text-warn">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm leading-snug font-medium text-danger">
          {error}
        </div>
      )}

      {mechanics === null && (
        <ul className="flex flex-col gap-3" aria-label="Carregando mecânicos">
          {[0, 1, 2].map((item) => (
            <li key={item} className="h-[76px] rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
          ))}
        </ul>
      )}

      {mechanics?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-field px-4 py-8 text-center">
          <p className="font-semibold">Nenhum mecânico disponível agora</p>
          <p className="text-sm text-muted">Os mecânicos aparecem aqui quando ficam disponíveis no painel deles.</p>
          <Button
            variant="secondary"
            size="md"
            onClick={onRefresh}
          >
            Atualizar lista
          </Button>
        </div>
      )}

      {mechanics && mechanics.length > 0 && (
        <ul className="flex flex-col gap-3">
          {mechanics.map((mechanic) => (
            <li key={mechanic.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
                {iniciais(mechanic.nome)}
              </span>
              <div className="min-w-0 flex-[1_1_150px]">
                <p className="truncate font-semibold">{mechanic.nome}</p>
                <p className="mt-0.5 text-[13px] text-subtle">
                  {mechanic.oficina ?? "Mecânico autônomo"}
                  {mechanic.distancia_km != null && ` · a ${formatarDistancia(mechanic.distancia_km)}`}
                </p>
                <p className="text-[13px] text-subtle">
                  <Avaliacao mechanic={mechanic} />
                  {mechanic.atendimentos > 0 && ` · ${mechanic.atendimentos} ${mechanic.atendimentos === 1 ? "atendimento" : "atendimentos"}`}
                </p>
              </div>
              <SalvarMecanico mecanico={{ ...mechanic, disponivel: true }} />
              <button
                type="button"
                disabled={requesting !== null}
                onClick={() => onChoose(mechanic)}
                className="h-11 w-full rounded-xl bg-ok px-5 text-[15px] font-semibold text-white hover:bg-ok-dark disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {requesting === mechanic.id ? "Enviando…" : "Solicitar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[13px] leading-normal text-subtle">
        O mecânico escolhido informa o preço estimado e o tempo de chegada. Você confirma antes do atendimento começar.
      </p>
    </div>
  );
}
