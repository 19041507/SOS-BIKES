import { Conversa } from "@/components/chat/Conversa";
import { Mapa } from "@/components/Mapa";
import { rotuloCategoria } from "@/lib/categorias";
import type { ChamadoCompleto } from "@/lib/chamados";
import { linkDaRota, posicaoDoChamado, type Posicao } from "@/lib/localizacao";
import { formatBRL } from "@/lib/money";
import { iniciais, linksDeContato, primeiroNome } from "@/lib/pessoas";
import { Button } from "@/components/ui/Button";

type ActiveJobProps = {
  chamado: ChamadoCompleto;
  mechanicName: string;
  mechanicPosition: Posicao | null;
  busy: boolean;
  onNext: () => void;
};

export function ActiveJob({ chamado, mechanicName, mechanicPosition, busy, onNext }: ActiveJobProps) {
  const aCaminho = chamado.status === "a_caminho";
  const nome = chamado.ciclista?.nome ?? "Ciclista";
  const contato = linksDeContato(chamado.ciclista?.telefone ?? null);
  const local = posicaoDoChamado(chamado);
  const eu = aCaminho ? mechanicPosition : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] font-semibold text-ok">Atendimento confirmado por {primeiroNome(nome)}</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">{aCaminho ? `A caminho de ${primeiroNome(nome)}` : "Em atendimento"}</h2>
      </div>
      <Mapa
        className="min-h-[200px]"
        ciclista={local}
        pins={eu ? [{ id: chamado.mecanico_id, initials: iniciais(mechanicName), ...eu }] : []}
        rota={eu && local ? { de: eu, ate: local } : undefined}
        chip={aCaminho ? chamado.endereco : "Você está no local"}
        enquadrar={[...(local ? [local] : []), ...(eu ? [eu] : [])]}
      />
      {aCaminho && local && (
        <a
          href={linkDaRota(local)}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
        >
          Abrir rota no Google Maps
        </a>
      )}
      <p className="text-[15px] text-slate-700">
        {nome} · {rotuloCategoria(chamado.categoria)} · estimativa {formatBRL(chamado.estimativa ?? 0)}
      </p>
      <Conversa chamado={chamado} outraPessoa={nome} />
      {contato ? (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={contato.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
          >
            WhatsApp
          </a>
          <a href={contato.ligacao} className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface">
            Ligar
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted">Este ciclista não cadastrou telefone.</p>
      )}
      <Button
        size="lg"
        disabled={busy}
        onClick={onNext}
      >
        {aCaminho ? "Cheguei ao local" : "Concluir atendimento"}
      </Button>
    </div>
  );
}
