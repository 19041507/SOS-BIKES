import { MapView, posicaoNoMapa } from "@/components/MapView";
import { rotuloCategoria } from "@/lib/categorias";
import type { ChamadoCompleto } from "@/lib/chamados";
import { formatBRL } from "@/lib/money";
import { iniciais, linksDeContato, primeiroNome } from "@/lib/pessoas";

type ActiveJobProps = {
  chamado: ChamadoCompleto;
  mechanicName: string;
  busy: boolean;
  onNext: () => void;
};

export function ActiveJob({ chamado, mechanicName, busy, onNext }: ActiveJobProps) {
  const aCaminho = chamado.status === "a_caminho";
  const nome = chamado.ciclista?.nome ?? "Ciclista";
  const contato = linksDeContato(chamado.ciclista?.telefone ?? null);
  const posicao = posicaoNoMapa(chamado.mecanico_id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] font-semibold text-ok">Atendimento confirmado por {primeiroNome(nome)}</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">{aCaminho ? `A caminho de ${primeiroNome(nome)}` : "Em atendimento"}</h2>
      </div>
      <MapView
        className="min-h-[200px]"
        pins={[{ id: chamado.mecanico_id, initials: iniciais(mechanicName), ...posicao }]}
        routeTo={aCaminho ? posicao : undefined}
        chip={aCaminho ? chamado.endereco : "Você está no local"}
      />
      <p className="text-[15px] text-slate-700">
        {nome} · {rotuloCategoria(chamado.categoria)} · estimativa {formatBRL(chamado.estimativa ?? 0)}
      </p>
      {contato ? (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={contato.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
          >
            Enviar mensagem
          </a>
          <a href={contato.ligacao} className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface">
            Ligar
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted">Este ciclista não cadastrou telefone.</p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onNext}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
      >
        {aCaminho ? "Cheguei ao local" : "Concluir atendimento"}
      </button>
    </div>
  );
}
