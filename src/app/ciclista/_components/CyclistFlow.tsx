"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mapa, type PinDoMapa } from "@/components/Mapa";
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
  localizacaoDoMecanico,
  mudarChamado,
  useMudancasEmChamados,
  type ChamadoCompleto,
  type MecanicoDisponivel,
} from "@/lib/chamados";
import {
  enderecoDaPosicao,
  estadoDaPermissao,
  formatarDistancia,
  obterPosicao,
  pontoNoCaminho,
  posicaoDoChamado,
  type Posicao,
} from "@/lib/localizacao";
import { formatBRL } from "@/lib/money";
import { progressoDaChegada, useAgora, useMenosMovimento } from "@/lib/movimento";
import { iniciais, primeiroNome } from "@/lib/pessoas";
import { AtivarLocalizacao } from "./AtivarLocalizacao";
import { CyclistDashboard } from "./CyclistDashboard";
import { CategoryStep } from "./CategoryStep";
import { LocationStep } from "./LocationStep";
import { MechanicListStep } from "./MechanicListStep";
import { WaitingStep } from "./WaitingStep";
import { ProposalStep } from "./ProposalStep";
import { TrackingStep } from "./TrackingStep";
import { FinishedStep } from "./FinishedStep";
import { Button } from "@/components/ui/Button";

/** Etapas antes de existir um chamado; depois, a tela segue o status do chamado no banco. */
type Draft = "home" | "category" | "location" | "mechanics";

/** Marca, neste aparelho, que a tela de ativar a localização já foi mostrada. */
const LOCALIZACAO_PERGUNTADA = "sos-bikes:localizacao-perguntada";

function jaPerguntou() {
  try {
    return localStorage.getItem(LOCALIZACAO_PERGUNTADA) === "1";
  } catch {
    return false;
  }
}

function marcarPerguntado() {
  try {
    localStorage.setItem(LOCALIZACAO_PERGUNTADA, "1");
  } catch {}
}

/** No caminho, o pin para em 85% do trajeto para não cobrir o ciclista. */
const PERCURSO_MAXIMO = 0.85;

function textoDoMapa(chamado: ChamadoCompleto, nome: string, minutosRestantes: number | null) {
  switch (chamado.status) {
    case "aguardando":
      return `Aguardando resposta de ${nome}`;
    case "aceito":
      return `${nome} aceitou o chamado`;
    case "a_caminho":
      return minutosRestantes ? `${nome} chega em ~${minutosRestantes} min` : `${nome} deve chegar a qualquer momento`;
    case "em_atendimento":
      return "Mecânico no local";
    default:
      return "Atendimento concluído";
  }
}

function mensagem(erro: unknown) {
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente de novo.";
}

export function CyclistFlow({ mecanicoFavoritoId }: { mecanicoFavoritoId?: string } = {}) {
  const router = useRouter();
  const perfil = usePerfil();
  const avisar = useToast();
  const agora = useAgora();
  const menosMovimento = useMenosMovimento();
  /** Último chamado aplicado, para avisar só quando o status muda. */
  const ultimo = useRef<ChamadoCompleto | null>(null);
  // undefined = carregando o chamado atual
  const [chamado, setChamado] = useState<ChamadoCompleto | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(mecanicoFavoritoId ? "category" : "home");
  const [preferidoId, setPreferidoId] = useState(mecanicoFavoritoId ?? null);
  const [favoritoDaUrl, setFavoritoDaUrl] = useState(mecanicoFavoritoId);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [detalhes, setDetalhes] = useState("");
  const [endereco, setEndereco] = useState("");
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  /** Endereço achado pelo GPS, para preencher de novo ao recomeçar um pedido. */
  const [enderecoDoGps, setEnderecoDoGps] = useState("");
  const [perguntarLocalizacao, setPerguntarLocalizacao] = useState(false);
  /** A lista de mecânicos usa a posição mais recente sem recriar `carregarMecanicos`. */
  const posicaoAtual = useRef<Posicao | null>(null);
  const [origemDoMecanico, setOrigemDoMecanico] = useState<Posicao | null>(null);
  const [mecanicos, setMecanicos] = useState<MecanicoDisponivel[] | null>(null);
  const [recusaram, setRecusaram] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoInicio, setAvisoInicio] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // A navegação pode preservar esta tela. Um novo favorito inicia outro rascunho;
  // remover o parâmetro não remonta o fluxo nem perde o defeito/endereço escolhidos.
  if (favoritoDaUrl !== mecanicoFavoritoId) {
    setFavoritoDaUrl(mecanicoFavoritoId);
    if (mecanicoFavoritoId) {
      setPreferidoId(mecanicoFavoritoId);
      setDraft("category");
      setCategoria(null);
      setDetalhes("");
      setEndereco(enderecoDoGps);
      setAviso(null);
      setErro(null);
    }
  }

  const carregarMecanicos = useCallback(async () => {
    setMecanicos(null);
    try {
      setMecanicos(await listarMecanicosDisponiveis(posicaoAtual.current));
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
          // Quem recusou some da lista neste pedido; quem só não respondeu continua disponível.
          if (atual.status === "recusado") setRecusaram((ids) => [...ids, atual.mecanico_id]);
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

  /**
   * Guarda a posição, reordena a lista pela distância e preenche o endereço
   * (só se estiver vazio, a menos que `sobrescrever`). Devolve se achou o endereço.
   */
  const usarPosicao = useCallback(async (nova: Posicao, sobrescrever = false) => {
    posicaoAtual.current = nova;
    setPosicao(nova);
    listarMecanicosDisponiveis(nova).then(setMecanicos).catch(() => {});
    const endereco = await enderecoDaPosicao(nova);
    if (!endereco) return false;
    setEnderecoDoGps(endereco);
    setEndereco((atual) => (sobrescrever ? endereco : atual || endereco));
    return true;
  }, []);

  // A tela inicial já mostra quem está disponível (a lista começa como null = carregando).
  // Com a localização liberada, lê a posição sozinho; na primeira vez, explica antes de pedir.
  useEffect(() => {
    listarMecanicosDisponiveis()
      .then(setMecanicos)
      .catch(() => setMecanicos([]));
    estadoDaPermissao().then((estado) => {
      if (estado === "granted") obterPosicao().then(usarPosicao).catch(() => {});
      else if (estado === "prompt" && !jaPerguntou()) setPerguntarLocalizacao(true);
    });
  }, [usarPosicao]);

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

  // Depois do aceite, o mapa mostra o mecânico saindo da posição dele (aproximada).
  const chamadoId = chamado?.id;
  const comMecanico = chamado?.status === "aceito" || chamado?.status === "a_caminho" || chamado?.status === "em_atendimento";
  useEffect(() => {
    if (!chamadoId || !comMecanico) return;
    let ativo = true;
    localizacaoDoMecanico(chamadoId)
      .then((origem) => { if (ativo) setOrigemDoMecanico(origem); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [chamadoId, comMecanico]);

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
    router.replace("/ciclista", { scroll: false });
    setPreferidoId(null);
    setChamado(null);
    setDraft("home");
    setCategoria(null);
    setDetalhes("");
    setEndereco(enderecoDoGps);
    setRecusaram([]);
    setAviso(null);
    setErro(null);
    if (avisoParaInicio) setAvisoInicio(avisoParaInicio);
    carregarMecanicos();
    // A avaliação fica no fim de uma tela longa; o dashboard começa do topo.
    window.scrollTo({ top: 0 });
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
      aplicar(await abrirChamado({ ciclistaId: perfil.id, mecanicoId: mecanico.id, categoria, detalhes, endereco, posicao }));
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setSolicitando(null);
    }
  }

  const disponiveis = mecanicos?.filter((m) => !recusaram.includes(m.id) && (!preferidoId || m.id === preferidoId)) ?? null;
  const nomeDoMecanico = primeiroNome(chamado?.mecanico?.nome ?? "O mecânico");

  let chip = "Carregando…";
  let pins: PinDoMapa[] = [];
  let pontoDoCiclista: Posicao | null = posicao;
  let rota: { de: Posicao; ate: Posicao } | undefined;
  /** De onde o mecânico sai: fixa, para o mapa não reenquadrar a cada passo. */
  let origem: Posicao | null = null;
  if (chamado) {
    pontoDoCiclista = posicaoDoChamado(chamado);
    const { progresso, minutosRestantes } = progressoDaChegada(chamado.confirmado_em, chamado.tempo_chegada_min, agora);
    // Aguardando a resposta, a posição vem da lista em que o ciclista escolheu o mecânico.
    const daLista = mecanicos?.find((m) => m.id === chamado.mecanico_id);
    origem =
      origemDoMecanico && comMecanico
        ? origemDoMecanico
        : chamado.status === "aguardando" && daLista?.latitude != null && daLista.longitude != null
          ? { lat: daLista.latitude, lng: daLista.longitude }
          : null;
    if (origem && pontoDoCiclista) {
      // A caminho, o pin avança em direção ao ciclista conforme o tempo estimado passa.
      const noLocal = chamado.status === "em_atendimento";
      const avanco = noLocal ? PERCURSO_MAXIMO : chamado.status === "a_caminho" && !menosMovimento ? progresso * PERCURSO_MAXIMO : 0;
      const ponto = pontoNoCaminho(origem, pontoDoCiclista, avanco);
      pins = [{ id: chamado.mecanico_id, initials: iniciais(chamado.mecanico?.nome ?? "?"), rotulo: chamado.mecanico?.nome, ...ponto }];
      if (chamado.status === "a_caminho") rota = { de: ponto, ate: pontoDoCiclista };
    }
    chip = textoDoMapa(chamado, nomeDoMecanico, minutosRestantes);
  } else if (chamado === null) {
    pins = (disponiveis ?? []).flatMap((m) =>
      m.latitude != null && m.longitude != null
        ? [{
            id: m.id,
            initials: iniciais(m.nome),
            rotulo: m.distancia_km != null ? `${m.nome} · a ${formatarDistancia(m.distancia_km)}` : m.nome,
            lat: m.latitude,
            lng: m.longitude,
          }]
        : [],
    );
    chip =
      disponiveis === null
        ? "Carregando mecânicos…"
        : disponiveis.length === 0
          ? "Nenhum mecânico disponível agora"
          : `${disponiveis.length} ${disponiveis.length === 1 ? "mecânico disponível" : "mecânicos disponíveis"} agora`;
  }
  const enquadrar = [
    ...(pontoDoCiclista ? [pontoDoCiclista] : []),
    ...(chamado ? (origem ? [origem] : []) : pins),
  ];

  if (chamado === null && draft === "home" && perguntarLocalizacao) {
    return (
      <AtivarLocalizacao
        onAtivar={async () => {
          marcarPerguntado();
          try {
            await usarPosicao(await obterPosicao());
          } catch (e) {
            setAvisoInicio(mensagem(e));
          }
          setPerguntarLocalizacao(false);
        }}
        onAgoraNao={() => {
          marcarPerguntado();
          setPerguntarLocalizacao(false);
        }}
      />
    );
  }

  if (chamado === null && draft === "home") {
    return (
      <CyclistDashboard
        position={posicao}
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
  const mapaNoCelular = chamado || draft === "mechanics" ? "" : "hidden lg:flex";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap items-stretch gap-4 p-3 sm:p-4">
      <section className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 lg:w-auto lg:max-w-[480px] lg:flex-[1_1_400px]">
        {preferidoId && chamado === null && (draft === "category" || draft === "location") && (
          <p className="rounded-xl bg-brand-soft px-3.5 py-3 text-sm text-brand-dark">
            Novo pedido para seu mecânico favorito. Informe o defeito e o endereço; a disponibilidade será conferida antes do envio.
          </p>
        )}
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
            hasPosition={posicao !== null}
            onLocate={async () => {
              if (!(await usarPosicao(await obterPosicao(), true))) {
                throw new Error("Achamos sua localização, mas não o nome da rua. Digite o endereço ou uma referência.");
              }
            }}
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
            notice={aviso ?? (preferidoId ? disponiveis === null ? "Verificando a disponibilidade do seu mecânico favorito…" : disponiveis.length ? "Seu mecânico favorito está selecionado. Confirme em “Solicitar” para enviar o pedido." : "Seu mecânico favorito não está disponível agora. Você pode atualizar a lista ou escolher outro mecânico." : null)}
            error={erro}
            requesting={solicitando}
            onBack={() => setDraft("location")}
            onRefresh={carregarMecanicos}
            onChoose={solicitar}
          />
        )}

        {chamado === null && draft === "mechanics" && preferidoId && (
          <Button
            variant="secondary"
            onClick={() => {
              setPreferidoId(null);
              setAviso(null);
              setErro(null);
              router.replace("/ciclista", { scroll: false });
              void carregarMecanicos();
            }}
          >
            Ver outros mecânicos
          </Button>
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

      <Mapa
        className={`min-h-[260px] w-full min-w-0 sm:min-h-[360px] lg:min-h-[420px] lg:w-auto lg:flex-[999_1_480px] ${mapaNoCelular}`}
        ciclista={pontoDoCiclista}
        pins={pins}
        rota={rota}
        chip={chip}
        enquadrar={enquadrar}
      />
    </main>
  );
}
