"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapView, posicaoNoMapa } from "@/components/MapView";
import { usePerfil } from "@/components/PerfilProvider";
import { useToast } from "@/components/ui/Toaster";
import { rotuloCategoria, type Categoria } from "@/lib/categorias";
import {
  PRAZO_RESPOSTA,
  abrirChamado,
  avaliarChamado,
  buscarChamado,
  chamadoAtualDoCiclista,
  listarMecanicosDisponiveis,
  mudarChamado,
  useMudancasEmChamados,
  type ChamadoCompleto,
  type MecanicoDisponivel,
} from "@/lib/chamados";
import { formatBRL } from "@/lib/money";
import { iniciais, primeiroNome } from "@/lib/pessoas";
import { CyclistDashboard } from "./CyclistDashboard";
import { CategoryStep } from "./CategoryStep";
import { LocationStep } from "./LocationStep";
import { MechanicListStep } from "./MechanicListStep";
import { WaitingStep } from "./WaitingStep";
import { ProposalStep } from "./ProposalStep";
import { TrackingStep } from "./TrackingStep";
import { FinishedStep } from "./FinishedStep";

/** Etapas antes de existir um chamado; depois, a tela segue o status do chamado no banco. */
type Draft = "home" | "category" | "location" | "mechanics";

function textoDoMapa(chamado: ChamadoCompleto, nome: string) {
  switch (chamado.status) {
    case "aguardando":
      return `Aguardando resposta de ${nome}`;
    case "aceito":
      return `${nome} aceitou o chamado`;
    case "a_caminho":
      return `${nome} chega em ${chamado.tempo_chegada_min} min`;
    case "em_atendimento":
      return "Mecânico no local";
    default:
      return "Atendimento concluído";
  }
}

function mensagem(erro: unknown) {
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente de novo.";
}

export function CyclistFlow() {
  const perfil = usePerfil();
  const avisar = useToast();
  /** Último chamado aplicado, para avisar só quando o status muda. */
  const ultimo = useRef<ChamadoCompleto | null>(null);
  // undefined = carregando o chamado atual
  const [chamado, setChamado] = useState<ChamadoCompleto | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>("home");
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [detalhes, setDetalhes] = useState("");
  const [endereco, setEndereco] = useState("");
  const [mecanicos, setMecanicos] = useState<MecanicoDisponivel[] | null>(null);
  const [recusaram, setRecusaram] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoInicio, setAvisoInicio] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregarMecanicos = useCallback(async () => {
    setMecanicos(null);
    try {
      setMecanicos(await listarMecanicosDisponiveis());
    } catch (e) {
      setMecanicos([]);
      setErro(mensagem(e));
    }
  }, []);

  /** Leva a tela para o lugar certo conforme o status que veio do banco. */
  const aplicar = useCallback(
    (atual: ChamadoCompleto | null) => {
      if (!atual) {
        setChamado(null);
        return;
      }
      const nome = primeiroNome(atual.mecanico?.nome ?? "O mecânico");
      const anterior = ultimo.current;
      ultimo.current = atual;
      if (anterior?.id === atual.id && anterior.status !== atual.status) {
        if (atual.status === "aceito") {
          avisar(`${nome} aceitou seu chamado: ${formatBRL(atual.estimativa ?? 0)} · chega em ${atual.tempo_chegada_min} min.`, "sucesso");
        } else if (atual.status === "em_atendimento") {
          avisar(`${nome} chegou ao local.`, "info");
        } else if (atual.status === "concluido") {
          avisar("Atendimento concluído. Conte como foi!", "sucesso");
        }
      }
      switch (atual.status) {
        case "recusado":
        case "expirado":
          setChamado(null);
          setRecusaram((ids) => [...ids, atual.mecanico_id]);
          setAviso(
            atual.status === "recusado"
              ? `${nome} não pode atender agora. Escolha outro mecânico.`
              : `${nome} não respondeu a tempo. Escolha outro mecânico.`,
          );
          setDraft("mechanics");
          carregarMecanicos();
          break;
        case "cancelado":
          setChamado(null);
          break;
        case "concluido":
          setChamado(atual.avaliacao ? null : atual);
          break;
        default:
          setChamado(atual);
      }
    },
    [carregarMecanicos, avisar],
  );

  // A tela inicial já mostra quem está disponível (a lista começa como null = carregando).
  useEffect(() => {
    listarMecanicosDisponiveis()
      .then(setMecanicos)
      .catch(() => setMecanicos([]));
  }, []);

  useEffect(() => {
    chamadoAtualDoCiclista(perfil.id)
      .then(aplicar)
      .catch((e) => {
        setChamado(null);
        setErro(mensagem(e));
      });
  }, [perfil.id, aplicar]);

  useEffect(() => {
    if (!avisoInicio) return;
    const timer = setTimeout(() => setAvisoInicio(null), 5000);
    return () => clearTimeout(timer);
  }, [avisoInicio]);

  // Respostas do mecânico chegam em tempo real.
  useMudancasEmChamados(`ciclista_id=eq.${perfil.id}`, () => {
    if (chamado) buscarChamado(chamado.id).then(aplicar).catch(() => {});
  });

  // Sem resposta no prazo (contado desde a criação), o chamado expira e o ciclista volta para a lista.
  useEffect(() => {
    if (chamado?.status !== "aguardando") return;
    const restante = PRAZO_RESPOSTA * 1000 - (Date.now() - new Date(chamado.criado_em).getTime());
    const timer = setTimeout(() => {
      mudarChamado(chamado.id, { status: "expirado" })
        .then(aplicar)
        .catch(() => buscarChamado(chamado.id).then(aplicar));
    }, Math.max(restante, 0));
    return () => clearTimeout(timer);
  }, [chamado, aplicar]);

  async function executar(acao: () => Promise<ChamadoCompleto>, depois?: () => void) {
    setOcupado(true);
    setErro(null);
    try {
      aplicar(await acao());
      depois?.();
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setOcupado(false);
    }
  }

  function recomecar(avisoParaInicio?: string) {
    setChamado(null);
    setDraft("home");
    setCategoria(null);
    setDetalhes("");
    setEndereco("");
    setRecusaram([]);
    setAviso(null);
    setErro(null);
    if (avisoParaInicio) setAvisoInicio(avisoParaInicio);
    carregarMecanicos();
  }

  function voltarParaLista(avisoDaLista?: string) {
    setChamado(null);
    setAviso(avisoDaLista ?? null);
    setDraft("mechanics");
    carregarMecanicos();
  }

  async function solicitar(mecanico: MecanicoDisponivel) {
    if (!categoria) return;
    setSolicitando(mecanico.id);
    setAviso(null);
    setErro(null);
    try {
      aplicar(await abrirChamado({ ciclistaId: perfil.id, mecanicoId: mecanico.id, categoria, detalhes, endereco }));
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setSolicitando(null);
    }
  }

  const disponiveis = mecanicos?.filter((m) => !recusaram.includes(m.id)) ?? null;
  const nomeDoMecanico = primeiroNome(chamado?.mecanico?.nome ?? "O mecânico");

  let chip = "Carregando…";
  let pins: { id: string; initials: string; x: number; y: number }[] = [];
  let rota: { x: number; y: number } | undefined;
  if (chamado) {
    const posicao = posicaoNoMapa(chamado.mecanico_id);
    pins = [{ id: chamado.mecanico_id, initials: iniciais(chamado.mecanico?.nome ?? "?"), ...posicao }];
    chip = textoDoMapa(chamado, nomeDoMecanico);
    if (chamado.status === "a_caminho" || chamado.status === "em_atendimento") rota = posicao;
  } else if (chamado === null) {
    pins = (disponiveis ?? []).map((m) => ({ id: m.id, initials: iniciais(m.nome), ...posicaoNoMapa(m.id) }));
    chip =
      disponiveis === null
        ? "Carregando mecânicos…"
        : disponiveis.length === 0
          ? "Nenhum mecânico disponível agora"
          : `${disponiveis.length} ${disponiveis.length === 1 ? "mecânico disponível" : "mecânicos disponíveis"} agora`;
  }

  if (chamado === null && draft === "home") {
    return (
      <CyclistDashboard
        perfil={perfil}
        mechanics={disponiveis}
        notice={avisoInicio}
        onStart={(atalho) => {
          setAvisoInicio(null);
          if (atalho) {
            setCategoria(atalho);
            setDraft("location");
          } else {
            setDraft("category");
          }
        }}
      />
    );
  }

  // No celular, o mapa só aparece quando mostra algo útil (a escolha do mecânico ou o chamado).
  const mapaNoCelular = chamado || draft === "mechanics" ? "" : "hidden lg:block";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap items-stretch gap-4 p-3 sm:p-4">
      <section className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 lg:w-auto lg:max-w-[480px] lg:flex-[1_1_400px]">
        {chamado === undefined && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
            <div className="h-6 w-2/3 rounded bg-slate-100 motion-safe:animate-pulse" />
            <div className="h-24 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
            <div className="h-14 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
          </div>
        )}

        {chamado === null && draft === "category" && (
          <CategoryStep
            selected={categoria}
            details={detalhes}
            onSelect={setCategoria}
            onDetailsChange={setDetalhes}
            onBack={() => recomecar()}
            onNext={() => setDraft("location")}
          />
        )}
        {chamado === null && draft === "location" && (
          <LocationStep
            categoryLabel={categoria ? rotuloCategoria(categoria) : ""}
            address={endereco}
            onAddressChange={setEndereco}
            onBack={() => setDraft("category")}
            onNext={() => {
              setDraft("mechanics");
              carregarMecanicos();
            }}
          />
        )}
        {chamado === null && draft === "mechanics" && (
          <MechanicListStep
            mechanics={disponiveis}
            notice={aviso}
            error={erro}
            requesting={solicitando}
            onBack={() => setDraft("location")}
            onRefresh={carregarMecanicos}
            onChoose={solicitar}
          />
        )}

        {chamado?.status === "aguardando" && (
          <WaitingStep
            chamado={chamado}
            limitSeconds={PRAZO_RESPOSTA}
            cancelling={ocupado}
            onCancel={() =>
              executar(
                () => mudarChamado(chamado.id, { status: "cancelado", motivo_cancelamento: "Cancelado antes da resposta do mecânico" }),
                () => voltarParaLista(),
              )
            }
          />
        )}
        {chamado?.status === "aceito" && (
          <ProposalStep
            chamado={chamado}
            busy={ocupado}
            onConfirm={() => executar(() => mudarChamado(chamado.id, { status: "a_caminho" }))}
            onChooseAnother={() =>
              executar(
                () => mudarChamado(chamado.id, { status: "cancelado", motivo_cancelamento: "Escolheu outro mecânico" }),
                () => voltarParaLista(),
              )
            }
          />
        )}
        {(chamado?.status === "a_caminho" || chamado?.status === "em_atendimento") && (
          <TrackingStep
            chamado={chamado}
            busy={ocupado}
            onCancel={(motivo) =>
              executar(
                () => mudarChamado(chamado.id, { status: "cancelado", motivo_cancelamento: motivo }),
                () => recomecar("Chamado cancelado."),
              )
            }
          />
        )}
        {chamado?.status === "concluido" && (
          <FinishedStep
            chamado={chamado}
            busy={ocupado}
            error={erro}
            onConfirm={async (avaliacao) => {
              setOcupado(true);
              setErro(null);
              try {
                await avaliarChamado({ chamadoId: chamado.id, ...avaliacao });
                recomecar("Assistência finalizada. Obrigado pela avaliação!");
              } catch (e) {
                setErro(mensagem(e));
              } finally {
                setOcupado(false);
              }
            }}
          />
        )}

        {chamado && erro && chamado.status !== "concluido" && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
            {erro}
          </p>
        )}
      </section>

      <MapView
        className={`min-h-[260px] w-full min-w-0 sm:min-h-[360px] lg:min-h-[420px] lg:w-auto lg:flex-[999_1_480px] ${mapaNoCelular}`}
        pins={pins}
        chip={chip}
        routeTo={rota}
      />
    </main>
  );
}
