"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePerfil } from "@/components/PerfilProvider";
import { useToast } from "@/components/ui/Toaster";
import { hora } from "@/components/historico/datas";
import { STATUS_COM_CHAT, TAMANHO_MAXIMO, enviarMensagem, marcarComoLidas, useMensagens } from "@/lib/mensagens";
import { conterTabNoDialogo } from "@/lib/foco";
import { useTituloDeAlerta } from "@/lib/movimento";
import { tocarAviso } from "@/lib/som";
import { iniciais, primeiroNome } from "@/lib/pessoas";
import type { StatusChamado } from "@/lib/supabase/database.types";

const RESPOSTAS_RAPIDAS = {
  ciclista: ["Estou aqui", "Pode me ligar?"],
  mecanico: ["Estou a caminho", "Cheguei"],
};

type Pendente = { id: string; texto: string; falhou: boolean };

type ConversaProps = {
  chamado: { id: string; status: StatusChamado };
  /** Nome de quem está do outro lado da conversa. */
  outraPessoa: string;
};

/** Botão "Conversar" (com as não lidas) e o painel do chat do chamado. */
export function Conversa({ chamado, outraPessoa }: ConversaProps) {
  const perfil = usePerfil();
  const avisar = useToast();
  const [aberta, setAberta] = useState(false);
  const abertaAgora = useRef(aberta);
  const botaoAbrir = useRef<HTMLButtonElement>(null);
  const restaurarFoco = useRef(false);

  useEffect(() => {
    abertaAgora.current = aberta;
  }, [aberta]);

  useEffect(() => {
    if (!aberta && restaurarFoco.current) {
      botaoAbrir.current?.focus();
      restaurarFoco.current = false;
    }
  }, [aberta]);

  const { mensagens, erro, carregar, adicionar } = useMensagens(chamado.id, (mensagem) => {
    if (mensagem.autor_id !== perfil.id) tocarAviso();
    if (mensagem.autor_id !== perfil.id && !abertaAgora.current) {
      avisar(`${primeiroNome(outraPessoa)}: ${mensagem.texto}`, "info");
    }
  });
  const naoLidas = (mensagens ?? []).filter((m) => m.autor_id !== perfil.id && !m.lida_em).length;
  useTituloDeAlerta(naoLidas > 0 && !aberta, `(${naoLidas}) Nova mensagem · SOS Bikes`);
  const emAndamento = STATUS_COM_CHAT.includes(chamado.status);

  // Com o painel aberto, tudo o que chega já conta como lido.
  useEffect(() => {
    if (aberta && naoLidas > 0) marcarComoLidas(chamado.id).catch(() => {});
  }, [aberta, naoLidas, chamado.id]);

  // Depois do atendimento, o botão só aparece se houve conversa.
  if (!emAndamento && !mensagens?.length) return null;

  return (
    <>
      <button
        ref={botaoAbrir}
        type="button"
        onClick={() => setAberta(true)}
        className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
        {emAndamento ? `Conversar com ${primeiroNome(outraPessoa)}` : "Ver conversa"}
        {naoLidas > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand">
            {naoLidas}
            <span className="sr-only"> {naoLidas === 1 ? "mensagem não lida" : "mensagens não lidas"}</span>
          </span>
        )}
      </button>

      {aberta && (
        <PainelDaConversa
          chamado={chamado}
          outraPessoa={outraPessoa}
          mensagens={mensagens}
          erro={erro}
          onRecarregar={carregar}
          onEnviada={adicionar}
          onFechar={() => {
            restaurarFoco.current = true;
            setAberta(false);
          }}
        />
      )}
    </>
  );
}

type PainelProps = ConversaProps & {
  mensagens: ReturnType<typeof useMensagens>["mensagens"];
  erro: boolean;
  onRecarregar: () => void;
  onEnviada: ReturnType<typeof useMensagens>["adicionar"];
  onFechar: () => void;
};

function PainelDaConversa({ chamado, outraPessoa, mensagens, erro, onRecarregar, onEnviada, onFechar }: PainelProps) {
  const perfil = usePerfil();
  const [texto, setTexto] = useState("");
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const dialogo = useRef<HTMLElement>(null);
  const aberto = STATUS_COM_CHAT.includes(chamado.status);
  const total = (mensagens?.length ?? 0) + pendentes.length;

  useEffect(() => {
    campo.current?.focus();
  }, []);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [total]);

  async function enviar(conteudo: string, pendenteId?: string) {
    const limpo = conteudo.trim();
    if (!limpo) return;
    const id = pendenteId ?? crypto.randomUUID();
    setPendentes((atuais) =>
      pendenteId ? atuais.map((p) => (p.id === id ? { ...p, falhou: false } : p)) : [...atuais, { id, texto: limpo, falhou: false }],
    );
    try {
      onEnviada(await enviarMensagem(chamado.id, limpo));
      setPendentes((atuais) => atuais.filter((p) => p.id !== id));
    } catch {
      setPendentes((atuais) => atuais.map((p) => (p.id === id ? { ...p, falhou: true } : p)));
    }
  }

  function enviarDoCampo() {
    const conteudo = texto;
    setTexto("");
    void enviar(conteudo);
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink/40 sm:items-stretch sm:justify-end"
      onClick={(event) => {
        if (event.target === event.currentTarget) onFechar();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onFechar();
        conterTabNoDialogo(event, dialogo.current);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversa-titulo"
        ref={dialogo}
        tabIndex={-1}
        className="flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-full sm:max-w-md sm:rounded-none motion-safe:animate-[toast-entrada_200ms_ease-out]"
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
            {iniciais(outraPessoa)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="conversa-titulo" className="truncate font-semibold">{outraPessoa}</h2>
            <p className="text-xs text-subtle">{aberto ? "Conversa do atendimento" : "Conversa encerrada com o atendimento"}</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar conversa"
            className="flex size-11 items-center justify-center rounded-full text-subtle hover:bg-surface hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-surface px-4 py-4" aria-live="polite">
          {mensagens === null && !erro && (
            <div className="flex flex-col gap-2" role="status" aria-label="Carregando conversa">
              <div className="h-10 w-2/3 rounded-2xl bg-slate-200 motion-safe:animate-pulse" />
              <div className="h-10 w-1/2 self-end rounded-2xl bg-slate-200 motion-safe:animate-pulse" />
            </div>
          )}
          {erro && (
            <div className="m-auto flex flex-col items-center gap-2 text-center text-sm text-muted">
              Não foi possível carregar a conversa.
              <button type="button" onClick={onRecarregar} className="min-h-11 font-semibold text-brand underline">
                Tentar de novo
              </button>
            </div>
          )}
          {mensagens?.length === 0 && pendentes.length === 0 && (
            <p className="m-auto max-w-[16rem] text-center text-sm text-muted">
              {aberto ? `Mande a primeira mensagem para ${primeiroNome(outraPessoa)}.` : "Nenhuma mensagem neste atendimento."}
            </p>
          )}
          {mensagens?.map((mensagem) => {
            const minha = mensagem.autor_id === perfil.id;
            return (
              <Balao key={mensagem.id} minha={minha} texto={mensagem.texto}>
                {hora.format(new Date(mensagem.criado_em))}
                {minha && mensagem.lida_em && " · Lida"}
              </Balao>
            );
          })}
          {pendentes.map((pendente) => (
            <Balao key={pendente.id} minha texto={pendente.texto} falhou={pendente.falhou}>
              {pendente.falhou ? (
                <button type="button" onClick={() => void enviar(pendente.texto, pendente.id)} className="font-semibold underline">
                  Não enviada · Tentar de novo
                </button>
              ) : (
                "Enviando…"
              )}
            </Balao>
          ))}
          <div ref={fim} />
        </div>

        {aberto && (
          <footer className="flex flex-col gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-wrap gap-2">
              {RESPOSTAS_RAPIDAS[perfil.tipo].map((resposta) => (
                <button
                  key={resposta}
                  type="button"
                  onClick={() => void enviar(resposta)}
                  className="min-h-9 rounded-full border border-brand/30 bg-brand-soft px-3 text-[13px] font-semibold text-brand-dark hover:bg-brand-muted"
                >
                  {resposta}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                enviarDoCampo();
              }}
            >
              <label htmlFor="mensagem" className="sr-only">Mensagem</label>
              <textarea
                ref={campo}
                id="mensagem"
                rows={1}
                maxLength={TAMANHO_MAXIMO}
                value={texto}
                placeholder="Escreva uma mensagem…"
                onChange={(event) => setTexto(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    enviarDoCampo();
                  }
                }}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-field px-3.5 py-2.5 text-[15px] outline-none field-sizing-content placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                disabled={!texto.trim()}
                aria-label="Enviar mensagem"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-dark disabled:bg-[#a9bcd8]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
            {texto.length > TAMANHO_MAXIMO - 50 && (
              <p className="text-right text-xs text-subtle">{texto.length}/{TAMANHO_MAXIMO}</p>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}

function Balao({ minha, texto, falhou, children }: { minha: boolean; texto: string; falhou?: boolean; children: ReactNode }) {
  return (
    <div className={`flex max-w-[80%] flex-col gap-0.5 ${minha ? "items-end self-end" : "items-start self-start"}`}>
      <p
        className={`rounded-2xl px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap ${
          minha ? `rounded-br-md text-white ${falhou ? "bg-danger" : "bg-brand"}` : "rounded-bl-md bg-white text-ink shadow-sm"
        }`}
      >
        {texto}
      </p>
      <span className={`px-1 text-[11px] ${falhou ? "text-danger" : "text-subtle"}`}>{children}</span>
    </div>
  );
}
