"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePerfil } from "@/components/PerfilProvider";
import { useToast } from "@/components/ui/Toaster";
import { rotuloCategoria } from "@/lib/categorias";
import {
  PRAZO_RESPOSTA,
  buscarChamado,
  chamadosEmAndamentoDoMecanico,
  definirDisponibilidade,
  mudarChamado,
  salvarMinhaLocalizacao,
  useMudancasEmChamados,
  type ChamadoCompleto,
} from "@/lib/chamados";
import { distanciaKm, obterPosicao, type Posicao } from "@/lib/localizacao";
import { dadosDoPainel, type DadosDoPainel } from "@/lib/dashboard-mecanico";
import { formatBRL, parseBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";
import { AvailabilityCard } from "./AvailabilityCard";
import { EmptyState } from "./EmptyState";
import { MechanicDashboard } from "./MechanicDashboard";
import { IncomingCall } from "./IncomingCall";
import { ActiveJob } from "./ActiveJob";
import { Conversa } from "@/components/chat/Conversa";
import { AtivarNotificacoes } from "@/components/AtivarNotificacoes";
import { tocarAviso } from "@/lib/som";
import { CloseJob } from "./CloseJob";
import { JobSummary } from "./JobSummary";

function mensagem(erro: unknown) {
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente de novo.";
}

/** O chamado que o mecânico está atendendo vem antes dos que aguardam resposta. */
function chamadoEmFoco(chamados: ChamadoCompleto[]) {
  return chamados.find((c) => c.status !== "aguardando") ?? chamados[0] ?? null;
}

export function MechanicPanel() {
  const perfil = usePerfil();
  const avisar = useToast();
  /** Chamados já mostrados, para avisar só dos novos (null = ainda não carregou a primeira vez). */
  const vistos = useRef<Set<string> | null>(null);
  const [online, setOnline] = useState(perfil.disponivel);
  const [chamados, setChamados] = useState<ChamadoCompleto[] | null>(null);
  const [painel, setPainel] = useState<DadosDoPainel | null>(null);
  const [erroPainel, setErroPainel] = useState(false);
  const [concluido, setConcluido] = useState<ChamadoCompleto | null>(null);
  const [fechando, setFechando] = useState(false);
  const [estimativa, setEstimativa] = useState("");
  const [tempo, setTempo] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [minhaPosicao, setMinhaPosicao] = useState<Posicao | null>(null);
  const emFoco = useRef<ChamadoCompleto | null>(null);

  const atual = chamados ? chamadoEmFoco(chamados) : null;
  const aguardandoNaFila = chamados ? chamados.filter((c) => c.status === "aguardando" && c.id !== atual?.id).length : 0;

  const carregarResumo = useCallback(() => {
    dadosDoPainel(perfil.id)
      .then((dados) => {
        setPainel(dados);
        setErroPainel(false);
      })
      .catch(() => setErroPainel(true));
  }, [perfil.id]);

  /** Recarrega os chamados e avisa se o que estava na tela saiu da lista (cancelado ou expirado). */
  const carregarChamados = useCallback(async () => {
    try {
      const lista = await chamadosEmAndamentoDoMecanico(perfil.id);
      const anterior = emFoco.current;
      if (anterior && !lista.some((c) => c.id === anterior.id)) {
        const final = await buscarChamado(anterior.id);
        const nome = primeiroNome(final.ciclista?.nome ?? "O ciclista");
        if (final.status === "cancelado") {
          setAviso(`${nome} cancelou o chamado. Motivo: ${final.motivo_cancelamento}.`);
        } else if (final.status === "expirado") {
          setAviso(`O chamado de ${nome} expirou porque não foi respondido a tempo.`);
        }
        setFechando(false);
      }
      if (vistos.current) {
        for (const novo of lista.filter((c) => c.status === "aguardando" && !vistos.current?.has(c.id))) {
          tocarAviso(true);
          avisar(`Novo chamado de ${primeiroNome(novo.ciclista?.nome ?? "um ciclista")}: ${rotuloCategoria(novo.categoria)}.`, "info");
        }
      }
      vistos.current = new Set(lista.map((c) => c.id));
      setChamados(lista);
    } catch (e) {
      setChamados([]);
      setErro(mensagem(e));
    }
  }, [perfil.id, avisar]);

  useEffect(() => {
    emFoco.current = atual;
  }, [atual]);

  useEffect(() => {
    carregarChamados();
    carregarResumo();
  }, [carregarChamados, carregarResumo]);

  /** Última posição gravada no banco, para não gravar a cada leitura do GPS. */
  const ultimaSalva = useRef<{ posicao: Posicao; em: number } | null>(null);

  /**
   * Mostra a posição e grava no banco quando ele se moveu mais de 100 m (no máximo 1 vez
   * por minuto) ou a cada ~4 min parado: a lista dos ciclistas ignora posições com mais de 30 min.
   */
  const salvarPosicao = useCallback(async (posicao: Posicao, forcar = false) => {
    setMinhaPosicao(posicao);
    const ultima = ultimaSalva.current;
    const passou = ultima ? Date.now() - ultima.em : Infinity;
    const moveu = ultima ? distanciaKm(ultima.posicao, posicao) >= 0.1 : true;
    if (!forcar && !(moveu && passou >= 60_000) && passou < 4 * 60_000) return;
    ultimaSalva.current = { posicao, em: Date.now() };
    await salvarMinhaLocalizacao(posicao);
  }, []);

  // Disponível com o painel aberto: acompanha o GPS (o navegador pede a permissão, se faltar).
  // Site não roda em segundo plano, então com a tela fechada a posição envelhece e some da lista.
  useEffect(() => {
    if (!online || !("geolocation" in navigator)) return;
    const acompanhamento = navigator.geolocation.watchPosition(
      ({ coords }) => salvarPosicao({ lat: coords.latitude, lng: coords.longitude }).catch(() => {}),
      (erro) => {
        if (erro.code === erro.PERMISSION_DENIED) {
          setAviso("Sem a localização, você aparece no fim da lista dos ciclistas, sem a distância.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 },
    );
    // Parado, o GPS pode não avisar nada: relê a cada 4 min para a posição não vencer.
    const relogio = setInterval(() => {
      obterPosicao().then((posicao) => salvarPosicao(posicao)).catch(() => {});
    }, 4 * 60_000);
    return () => {
      navigator.geolocation.clearWatch(acompanhamento);
      clearInterval(relogio);
    };
  }, [online, salvarPosicao]);

  // Novos chamados e respostas do ciclista chegam em tempo real.
  useMudancasEmChamados(`mecanico_id=eq.${perfil.id}`, carregarChamados);

  // Chamado sem resposta no prazo (contado desde a criação) expira.
  useEffect(() => {
    if (atual?.status !== "aguardando") return;
    const restante = PRAZO_RESPOSTA * 1000 - (Date.now() - new Date(atual.criado_em).getTime());
    const timer = setTimeout(() => {
      mudarChamado(atual.id, { status: "expirado" })
        .catch(() => {})
        .finally(carregarChamados);
    }, Math.max(restante, 0));
    return () => clearTimeout(timer);
  }, [atual, carregarChamados]);

  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setOcupado(false);
      carregarChamados();
    }
  }

  async function alternarDisponibilidade() {
    const proximo = !online;
    setOnline(proximo);
    setOcupado(true);
    // Pede a localização ainda dentro do toque: o Safari pode ignorar o pedido depois de um await.
    const localizacao = proximo
      ? obterPosicao().then((posicao) => salvarPosicao(posicao, true)).catch(() =>
          setAviso("Sem a localização, você aparece no fim da lista dos ciclistas, sem a distância."),
        )
      : null;
    try {
      await definirDisponibilidade(perfil.id, proximo);
      await localizacao;
    } catch (e) {
      setOnline(!proximo);
      setErro(mensagem(e));
    } finally {
      setOcupado(false);
    }
  }

  /** Abre o registro do valor final, já preenchido com a estimativa. */
  function abrirConclusao() {
    if (!valorFinal) setValorFinal(String(estimativaAtual).replace(".", ","));
    setFechando(true);
  }

  function limparFormulario() {
    setEstimativa("");
    setTempo("");
    setValorFinal("");
    setMotivo("");
    setFechando(false);
  }

  // Sem chamado na tela, a seção mostra o dashboard (cards próprios, sem o card em volta).
  const ocioso = !concluido && chamados !== null && !atual;
  const estimativaAtual = atual?.estimativa ?? 0;
  const valorFinalNumero = parseBRL(valorFinal);
  const precoMudou = valorFinalNumero !== estimativaAtual;
  const podeConcluir = valorFinalNumero > 0 && (!precoMudou || motivo.trim() !== "");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <AvailabilityCard online={online} busy={ocupado} hasActiveCall={Boolean(atual)} onToggle={alternarDisponibilidade} />
      {online && (
        <AtivarNotificacoes
          perfil="mecanico"
          titulo="Receba chamados com o app fechado"
          texto="Avisamos no celular quando um ciclista escolher você. Você tem 1 minuto para responder."
        />
      )}

      <section
        className={`flex w-full min-w-0 flex-col gap-4 ${
          ocioso ? "" : "mx-auto min-h-[420px] max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-6"
        }`}
      >
        {aviso && (
          <p role="status" className="rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
            {aviso}
          </p>
        )}
        {erro && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
            {erro}
          </p>
        )}

        {chamados === null && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando chamados">
            <div className="h-6 w-1/2 rounded bg-slate-100 motion-safe:animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
          </div>
        )}

        {concluido && (
          <JobSummary
            chamado={concluido}
            onBack={() => {
              setConcluido(null);
              limparFormulario();
              // A avaliação do ciclista chega depois da conclusão e não passa pelo canal de chamados.
              carregarResumo();
            }}
          />
        )}

        {ocioso && (
          <MechanicDashboard dados={painel} erro={erroPainel} />
        )}

        {!concluido && atual?.status === "aguardando" && (
          <IncomingCall
            key={atual.id}
            chamado={atual}
            totalSeconds={PRAZO_RESPOSTA}
            queued={aguardandoNaFila}
            estimate={estimativa}
            eta={tempo}
            busy={ocupado}
            mechanicPosition={minhaPosicao}
            onEstimateChange={setEstimativa}
            onEtaChange={setTempo}
            onDecline={() => executar(() => mudarChamado(atual.id, { status: "recusado" })).then(limparFormulario)}
            onAccept={() =>
              executar(() =>
                mudarChamado(atual.id, {
                  status: "aceito",
                  estimativa: parseBRL(estimativa),
                  tempo_chegada_min: Number(tempo),
                }),
              ).then(() => setValorFinal(estimativa))
            }
          />
        )}

        {!concluido && atual?.status === "aceito" && (
          <>
            <EmptyState
              title="Estimativa enviada"
              description={`${formatBRL(estimativaAtual)} · chegada em ${atual.tempo_chegada_min} min. Aguardando ${primeiroNome(atual.ciclista?.nome ?? "o ciclista")} confirmar o atendimento.`}
            />
            <Conversa chamado={atual} outraPessoa={atual.ciclista?.nome ?? "Ciclista"} />
          </>
        )}

        {!concluido && !fechando && (atual?.status === "a_caminho" || atual?.status === "em_atendimento") && (
          <ActiveJob
            chamado={atual}
            mechanicName={perfil.nome}
            mechanicPosition={minhaPosicao}
            busy={ocupado}
            onNext={() =>
              atual.status === "a_caminho"
                ? executar(() => mudarChamado(atual.id, { status: "em_atendimento" }))
                : abrirConclusao()
            }
          />
        )}

        {!concluido && fechando && atual?.status === "em_atendimento" && (
          <CloseJob
            estimate={estimativaAtual}
            finalPrice={valorFinal}
            reason={motivo}
            priceChanged={precoMudou}
            canFinish={podeConcluir}
            busy={ocupado}
            onFinalPriceChange={setValorFinal}
            onReasonChange={setMotivo}
            onFinish={() =>
              executar(async () => {
                const final = await mudarChamado(atual.id, {
                  status: "concluido",
                  valor_final: valorFinalNumero,
                  motivo_variacao: precoMudou ? motivo.trim() : null,
                });
                setConcluido(final);
                carregarResumo();
              })
            }
          />
        )}
      </section>
    </main>
  );
}
