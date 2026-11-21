"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Mensagem, StatusChamado } from "@/lib/supabase/database.types";

/** A conversa abre no aceite e fecha com o atendimento (o banco aplica a mesma regra). */
export const STATUS_COM_CHAT: StatusChamado[] = ["aceito", "a_caminho", "em_atendimento"];

export const TAMANHO_MAXIMO = 500;

export async function listarMensagens(chamadoId: string) {
  const { data, error } = await createClient()
    .from("mensagens")
    .select("*")
    .eq("chamado_id", chamadoId)
    .order("criado_em", { ascending: true });
  if (error || !data) throw new Error("Não foi possível carregar a conversa.");
  return data;
}

export async function enviarMensagem(chamadoId: string, texto: string) {
  const { data, error } = await createClient()
    .from("mensagens")
    .insert({ chamado_id: chamadoId, texto: texto.trim() })
    .select("*")
    .single();
  if (error || !data) throw new Error("Não foi possível enviar a mensagem.");
  return data;
}

export async function marcarComoLidas(chamadoId: string) {
  await createClient().rpc("marcar_mensagens_lidas", { chamado: chamadoId });
}

/** Junta pelo id e mantém a ordem do servidor: a mensagem enviada também volta pelo Realtime. */
function juntar(atuais: Mensagem[], nova: Mensagem) {
  const sem = atuais.filter((m) => m.id !== nova.id);
  return [...sem, nova].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
}

/**
 * Mensagens de um chamado, atualizadas em tempo real. `aoReceber` é chamado para cada
 * mensagem nova que chega pelo Realtime (não para as já carregadas).
 */
export function useMensagens(chamadoId: string, aoReceber?: (mensagem: Mensagem) => void) {
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null);
  const [erro, setErro] = useState(false);
  const callback = useRef(aoReceber);
  useEffect(() => {
    callback.current = aoReceber;
  });

  const carregar = useCallback(() => {
    setErro(false);
    listarMensagens(chamadoId)
      .then(setMensagens)
      .catch(() => setErro(true));
  }, [chamadoId]);

  useEffect(() => {
    listarMensagens(chamadoId)
      .then(setMensagens)
      .catch(() => setErro(true));
  }, [chamadoId]);

  useEffect(() => {
    const cliente = createClient();
    let ativo = true;
    let canal: ReturnType<typeof cliente.channel> | null = null;

    // Igual a useMudancasEmChamados: sem o token antes de assinar, o Realtime aplica o RLS
    // como anônimo e não entrega nada.
    cliente.realtime.setAuth().then(() => {
      if (!ativo) return;
      canal = cliente
        .channel(`mensagens:${chamadoId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "mensagens", filter: `chamado_id=eq.${chamadoId}` },
          (mudanca) => {
            if (mudanca.eventType === "DELETE") return;
            const mensagem = mudanca.new as Mensagem;
            setMensagens((atuais) => juntar(atuais ?? [], mensagem));
            if (mudanca.eventType === "INSERT") callback.current?.(mensagem);
          },
        )
        .subscribe();
    });

    return () => {
      ativo = false;
      if (canal) cliente.removeChannel(canal);
    };
  }, [chamadoId]);

  const adicionar = useCallback((mensagem: Mensagem) => {
    setMensagens((atuais) => juntar(atuais ?? [], mensagem));
  }, []);

  return { mensagens, erro, carregar, adicionar };
}
