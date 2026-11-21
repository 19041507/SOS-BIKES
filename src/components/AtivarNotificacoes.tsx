"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { ativarNotificacoes, estadoDasNotificacoes, type EstadoDasNotificacoes } from "@/lib/notificacoes";

type AtivarNotificacoesProps = {
  /** Separa a pergunta do mecânico e a do ciclista no mesmo aparelho. */
  perfil: "ciclista" | "mecanico";
  titulo: string;
  texto: string;
};

const chave = (perfil: string) => `sos-bikes:notificacoes-perguntadas:${perfil}`;

function jaPerguntou(perfil: string) {
  try {
    return localStorage.getItem(chave(perfil)) === "1";
  } catch {
    return false;
  }
}

function marcarPerguntado(perfil: string) {
  try {
    localStorage.setItem(chave(perfil), "1");
  } catch {}
}

/** Pergunta uma vez por aparelho se a pessoa quer receber os avisos com o app fechado. */
export function AtivarNotificacoes({ perfil, titulo, texto }: AtivarNotificacoesProps) {
  const avisar = useToast();
  const [estado, setEstado] = useState<EstadoDasNotificacoes | null>(null);
  const [ativando, setAtivando] = useState(false);

  useEffect(() => {
    if (jaPerguntou(perfil)) return;
    estadoDasNotificacoes()
      .then(setEstado)
      .catch(() => {});
  }, [perfil]);

  function fechar() {
    marcarPerguntado(perfil);
    setEstado(null);
  }

  if (estado !== "desativadas" && estado !== "instalar") return null;

  return (
    <section
      aria-labelledby="ativar-notificacoes-titulo"
      className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4 sm:flex-row sm:items-center"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="ativar-notificacoes-titulo" className="font-semibold text-brand-dark">{titulo}</h2>
        <p className="text-sm text-brand-dark/80">
          {estado === "instalar" ? "No iPhone, os avisos só chegam com o app instalado. Veja como instalar em Meu perfil." : texto}
        </p>
      </div>
      {estado === "instalar" ? (
        <Button variant="secondary" onClick={fechar}>Entendi</Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" disabled={ativando} onClick={fechar}>Agora não</Button>
          <Button
            loading={ativando}
            loadingText="Ativando…"
            onClick={async () => {
              setAtivando(true);
              try {
                const resultado = await ativarNotificacoes();
                if (resultado === "ativadas") avisar("Notificações ativadas.", "sucesso");
                else if (resultado === "bloqueadas") avisar("As notificações ficaram bloqueadas. Libere nas configurações do navegador.", "aviso");
              } catch (e) {
                avisar(e instanceof Error ? e.message : "Não foi possível ativar as notificações.", "erro");
              } finally {
                setAtivando(false);
                fechar();
              }
            }}
          >
            Ativar notificações
          </Button>
        </div>
      )}
    </section>
  );
}
