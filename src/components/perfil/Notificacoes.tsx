"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ativarNotificacoes, desativarNotificacoes, estadoDasNotificacoes, type EstadoDasNotificacoes } from "@/lib/notificacoes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

const TEXTOS = {
  ativadas: "Você recebe avisos do atendimento com o app fechado.",
  desativadas: "Receba avisos de chamados e mensagens com o app fechado.",
  bloqueadas: "As notificações estão bloqueadas. Libere nas configurações do navegador.",
  instalar: "No iPhone, instale o app para receber notificações.",
};

export function Notificacoes() {
  const [estado, setEstado] = useState<EstadoDasNotificacoes | null>(null);
  const [erro, setErro] = useState("");
  const [alterando, setAlterando] = useState(false);
  const montado = useRef(true);
  const ocupado = useRef(false);
  const consulta = useRef(0);
  const avisar = useToast();

  const consultar = useCallback(async () => {
    if (ocupado.current) return;
    const numero = ++consulta.current;
    try {
      const novo = await estadoDasNotificacoes();
      if (montado.current && numero === consulta.current) {
        setEstado(novo);
        setErro("");
      }
    } catch {
      if (montado.current && numero === consulta.current) setErro("Não foi possível consultar as notificações. Tente de novo.");
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    let ativo = true;
    const numero = ++consulta.current;
    estadoDasNotificacoes().then(novo => {
      if (ativo && numero === consulta.current) {
        setEstado(novo);
        setErro("");
      }
    }).catch(() => {
      if (ativo && numero === consulta.current) setErro("Não foi possível consultar as notificações. Tente de novo.");
    });
    const aoVoltar = () => { if (document.visibilityState === "visible") void consultar(); };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      montado.current = false;
      ativo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [consultar]);

  async function alternar() {
    if (ocupado.current || (estado !== "ativadas" && estado !== "desativadas")) return;
    ocupado.current = true;
    consulta.current++;
    setAlterando(true);
    setErro("");
    try {
      if (estado === "ativadas") {
        await desativarNotificacoes();
        const novo = await estadoDasNotificacoes();
        if (!montado.current) return;
        setEstado(novo);
        if (novo === "ativadas") throw new Error("desativacao_nao_confirmada");
        avisar("Notificações desativadas.", "sucesso");
      } else {
        const novo = await ativarNotificacoes();
        if (!montado.current) return;
        setEstado(novo);
        if (novo === "ativadas") avisar("Notificações ativadas.", "sucesso");
      }
    } catch {
      if (montado.current) {
        setEstado(null);
        setErro("Não foi possível atualizar as notificações. Tente de novo.");
      }
    } finally {
      ocupado.current = false;
      if (montado.current) setAlterando(false);
    }
  }

  if (estado === "indisponivel" || (estado === null && !erro)) return null;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold">Notificações</h2>
          {estado && <p className="mt-1 text-sm leading-relaxed text-muted">{TEXTOS[estado]}</p>}
          {estado === "instalar" && <a href="#instalar-app" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-2">Instale o SOS Bikes no celular</a>}
        </div>
      </div>
      {erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{erro}</p>}
      {(estado === "ativadas" || estado === "desativadas") && <Button className="mt-5 w-full sm:w-fit" variant={estado === "ativadas" ? "secondary" : "primary"} onClick={alternar} loading={alterando} loadingText="Atualizando…">{estado === "ativadas" ? "Desativar" : "Ativar notificações"}</Button>}
      {erro && <Button variant="secondary" className="mt-3 w-full sm:w-fit" disabled={alterando} onClick={() => void consultar()}>Atualizar estado</Button>}
    </Card>
  );
}
