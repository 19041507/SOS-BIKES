"use client";

import { useState } from "react";
import { ocultarComentarioPublico } from "@/lib/chamados";
import { Button } from "./ui/Button";

export function OcultarComentarioPublico({ chamadoId }: { chamadoId: string }) {
  const [oculto, setOculto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function ocultar() {
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await ocultarComentarioPublico(chamadoId);
      setOculto(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ocultar o comentário.");
    } finally {
      setSalvando(false);
    }
  }

  if (oculto) {
    return <p role="status" className="text-sm text-ok-dark">Comentário ocultado do perfil público.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" disabled={salvando} onClick={() => void ocultar()}>
        {salvando ? "Ocultando…" : "Ocultar comentário do perfil público"}
      </Button>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
    </div>
  );
}
