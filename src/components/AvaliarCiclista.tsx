"use client";

import { useId, useState } from "react";
import { avaliarCiclista, type ChamadoCompleto } from "@/lib/chamados";
import { primeiroNome } from "@/lib/pessoas";
import { Button } from "./ui/Button";

type Props = {
  chamado: ChamadoCompleto;
};

/** Usado no encerramento e nos detalhes para permitir avaliar depois. */
export function AvaliarCiclista({ chamado }: Props) {
  const id = useId();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(chamado.avaliacao_ciclista);
  if (chamado.status !== "concluido") return null;
  if (enviada) return (
    <section className="flex flex-col gap-2" aria-label="Sua avaliação do ciclista">
      <h3 className="font-display text-lg font-bold">Sua avaliação do ciclista</h3>
      <p className="text-xl text-star" aria-label={`${enviada.nota} de 5 estrelas`}>
        {"★".repeat(enviada.nota)}
        <span className="text-line">{"★".repeat(5 - enviada.nota)}</span>
      </p>
      {enviada.comentario && (
        <p className="break-words text-sm text-muted">{enviada.comentario}</p>
      )}
      <p role="status" className="text-sm font-semibold text-ok-dark">
        Avaliação enviada.
      </p>
    </section>
  );

  async function enviar() {
    if (!nota || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      setEnviada(await avaliarCiclista({ chamadoId: chamado.id, nota, comentario }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${id}-titulo`}>
      <div>
        <h3 id={`${id}-titulo`} className="font-display text-lg font-bold">
          Avalie o ciclista
        </h3>
        <p className="mt-1 text-sm text-muted">
          Como foi atender {primeiroNome(chamado.ciclista?.nome ?? "o ciclista")}?
        </p>
      </div>
      <p id={`${id}-nota`} className="text-sm font-semibold">
        Sua nota <span className="font-normal text-subtle">(obrigatória)</span>
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-nota`}
        aria-describedby={nota === 0 ? `${id}-ajuda` : undefined}
        className="-mt-2 flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={salvando}
            aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
            aria-pressed={valor <= nota}
            onClick={() => setNota(valor)}
            className="flex size-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-brand"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill={valor <= nota ? "var(--color-star)" : "none"}
              stroke="var(--color-star)"
              strokeWidth="1.6"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
      <label htmlFor={`${id}-comentario`} className="text-sm font-semibold">
        Comentário <span className="font-normal text-subtle">(opcional)</span>
      </label>
      <textarea
        id={`${id}-comentario`}
        rows={3}
        disabled={salvando}
        value={comentario}
        onChange={(event) => setComentario(event.target.value)}
        className="resize-none rounded-xl border border-field p-3 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      {erro && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-danger">{erro}</p>
      )}
      {nota === 0 && (
        <p id={`${id}-ajuda`} className="text-sm text-muted">
          Escolha de 1 a 5 estrelas para enviar.
        </p>
      )}
      <Button
        fullWidth
        loading={salvando}
        loadingText="Enviando…"
        disabled={nota === 0}
        aria-describedby={nota === 0 ? `${id}-ajuda` : undefined}
        onClick={() => void enviar()}
      >
        Enviar avaliação do ciclista
      </Button>
    </section>
  );
}
