"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LegalLinks } from "@/components/LegalLinks";
import { FavoritosProvider } from "@/components/FavoritosProvider";
import { ListaDeFavoritos } from "@/components/ListaDeFavoritos";
import { Button } from "@/components/ui/Button";
import { iniciais } from "@/lib/pessoas";
import { PerfilProvider } from "@/components/PerfilProvider";
import { Toaster, useToast } from "@/components/ui/Toaster";
import { MapView, posicaoNoMapa } from "@/components/MapView";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { DetalheDoChamado } from "@/components/historico/DetalheDoChamado";
import { CyclistDashboard } from "../ciclista/_components/CyclistDashboard";
import { CategoryStep } from "../ciclista/_components/CategoryStep";
import { LocationStep } from "../ciclista/_components/LocationStep";
import { MechanicListStep } from "../ciclista/_components/MechanicListStep";
import { WaitingStep } from "../ciclista/_components/WaitingStep";
import { ProposalStep } from "../ciclista/_components/ProposalStep";
import { TrackingStep } from "../ciclista/_components/TrackingStep";
import { FinishedStep } from "../ciclista/_components/FinishedStep";
import { ListaDeChamados } from "../ciclista/chamados/_components/ListaDeChamados";
import { MechanicDashboard } from "../mecanico/_components/MechanicDashboard";
import { AvailabilityCard } from "../mecanico/_components/AvailabilityCard";
import { IncomingCall } from "../mecanico/_components/IncomingCall";
import { ActiveJob } from "../mecanico/_components/ActiveJob";
import { CloseJob } from "../mecanico/_components/CloseJob";
import { JobSummary } from "../mecanico/_components/JobSummary";
import { EmptyState } from "../mecanico/_components/EmptyState";
import { HistoricoDoMecanico } from "../mecanico/historico/_components/HistoricoDoMecanico";
import { BrandPanel } from "../_components/BrandPanel";
import { LoginForm } from "../_components/LoginForm";
import { SignupForm } from "../cadastro/_components/SignupForm";
import { rotuloCategoria, type Categoria } from "@/lib/categorias";
import { parseBRL } from "@/lib/money";
import type { avaliarCiclista, ChamadoCompleto } from "@/lib/chamados";
import type { AvaliacaoCiclista } from "@/lib/supabase/database.types";
import type { dadosDaPrevia } from "./dados";

const TELAS = [
  ["login", "Login"], ["cadastro", "Cadastro"],
  ["ciclista", "Ciclista · Início"],
  ["ciclista-defeito", "Ciclista · Escolher defeito"],
  ["ciclista-local", "Ciclista · Localização"],
  ["ciclista-mecanicos", "Ciclista · Escolher mecânico"],
  ["ciclista-espera", "Ciclista · Aguardando resposta"],
  ["ciclista-proposta", "Ciclista · Confirmar estimativa"],
  ["ciclista-caminho", "Ciclista · Acompanhar chegada"],
  ["ciclista-servico", "Ciclista · Em atendimento"],
  ["ciclista-avaliacao", "Ciclista · Avaliar atendimento"],
  ["ciclista-chamados", "Ciclista · Meus chamados"],
  ["ciclista-favoritos", "Ciclista · Mecânicos favoritos"],
  ["ciclista-detalhe", "Ciclista · Detalhes do chamado"],
  ["ciclista-perfil", "Ciclista · Meu perfil"],
  ["mecanico", "Mecânico · Painel"],
  ["mecanico-novo", "Mecânico · Novo chamado"],
  ["mecanico-espera", "Mecânico · Estimativa enviada"],
  ["mecanico-caminho", "Mecânico · A caminho"],
  ["mecanico-servico", "Mecânico · Em atendimento"],
  ["mecanico-concluir", "Mecânico · Registrar valor final"],
  ["mecanico-resumo", "Mecânico · Atendimento concluído"],
  ["mecanico-historico", "Mecânico · Histórico"],
  ["mecanico-detalhe", "Mecânico · Detalhes do chamado"],
  ["mecanico-perfil", "Mecânico · Meu perfil"],
] as const;

type Dados = ReturnType<typeof dadosDaPrevia>;
type Pedido = { categoria: Categoria; detalhes: string; endereco: string; mecanicoId: string; favorito: boolean };

function assinar(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
const lerTela = () => window.location.hash.slice(1) || "ciclista";
const telaInicial = () => "ciclista";
function ir(tela: string) { window.location.hash = tela; }

export function Previa({ dados }: { dados: Dados }) {
  const [avaliacoes, setAvaliacoes] = useState<Record<string, AvaliacaoCiclista>>({});
  const avaliarNaPrevia: typeof avaliarCiclista = async ({ chamadoId, nota, comentario }) => {
    const avaliacao = { chamado_id: chamadoId, nota, comentario: comentario.trim() || null, criado_em: new Date().toISOString() };
    setAvaliacoes(atuais => ({ ...atuais, [chamadoId]: avaliacao }));
    return avaliacao;
  };
  const dadosAtuais: Dados = {
    ...dados,
    chamado: { ...dados.chamado, avaliacao_ciclista: avaliacoes[dados.chamado.id] ?? dados.chamado.avaliacao_ciclista },
    historico: dados.historico.map(chamado => ({ ...chamado, avaliacao_ciclista: avaliacoes[chamado.id] ?? chamado.avaliacao_ciclista })),
  };
  const [pedido, setPedido] = useState<Pedido>({ categoria: "pneu", detalhes: dados.chamado.detalhes ?? "", endereco: dados.chamado.endereco, mecanicoId: dados.mecanico.id, favorito: false });
  const alterarPedido = (mudanca: Partial<Pedido>) => setPedido(atual => ({ ...atual, ...mudanca }));
  const selecionada = useSyncExternalStore(assinar, lerTela, telaInicial);
  const [telaSelecionada, chamadoId] = selecionada.split("/");
  const tela = TELAS.some(([id]) => id === telaSelecionada) ? telaSelecionada : "ciclista";
  const chamadoSelecionado = dadosAtuais.historico.find(chamado => chamado.id === chamadoId) ?? dadosAtuais.historico[0];
  const mecanico = tela.startsWith("mecanico");
  const perfil = mecanico ? dados.mecanico : dados.ciclista;
  const publica = tela === "login" || tela === "cadastro";

  return (
    <div className="preview-page flex min-h-dvh flex-col">
      <div className="preview-toolbar border-b border-brand/20 bg-brand-soft px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand">Prévia local</p>
            <p className="text-xs text-muted">Dados fictícios. Nenhuma alteração é salva.</p>
          </div>
          <label htmlFor="tela-previa" className="sr-only">Visualizar tela</label>
          <select id="tela-previa" value={tela} onChange={e => ir(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-field bg-white px-3 text-sm font-medium sm:w-80">
            {TELAS.map(([id, titulo]) => <option key={id} value={id}>{titulo}</option>)}
          </select>
        </div>
      </div>
      <Toaster>
        <PerfilProvider perfil={perfil}>
          <FavoritosProvider initialFavoritos={dados.favoritos} catalogoPrevia={dados.catalogoFavoritos}>
            <Conteudo key={selecionada} dados={dadosAtuais} tela={tela} publica={publica} mecanico={mecanico} chamadoSelecionado={chamadoSelecionado} pedido={pedido} alterarPedido={alterarPedido} onAvaliarCiclista={avaliarNaPrevia} />
          </FavoritosProvider>
        </PerfilProvider>
      </Toaster>
    </div>
  );
}

function Conteudo({ dados, tela, publica, mecanico, chamadoSelecionado, pedido, alterarPedido, onAvaliarCiclista }: { dados: Dados; tela: string; publica: boolean; mecanico: boolean; chamadoSelecionado: ChamadoCompleto; pedido: Pedido; alterarPedido: (mudanca: Partial<Pedido>) => void; onAvaliarCiclista: typeof avaliarCiclista }) {
  const avisar = useToast();
  const perfil = mecanico ? dados.mecanico : dados.ciclista;
  const { categoria, detalhes, endereco } = pedido;
  const setCategoria = (categoria: Categoria) => alterarPedido({ categoria });
  const setDetalhes = (detalhes: string) => alterarPedido({ detalhes });
  const setEndereco = (endereco: string) => alterarPedido({ endereco });
  const [online, setOnline] = useState(true);
  const [estimativa, setEstimativa] = useState("25");
  const [tempo, setTempo] = useState("6");
  const [valor, setValor] = useState("30");
  const [motivo, setMotivo] = useState(dados.chamado.motivo_variacao ?? "");
  const caminho = mecanico ? "mecanico" : "ciclista";
  const escolhido = dados.mechanics.find(m => m.id === pedido.mecanicoId) ?? dados.mechanics[0];
  const chamado: ChamadoCompleto = {
    ...dados.chamado, categoria, detalhes, endereco,
    mecanico_id: escolhido.id, mecanico: escolhido,
    criado_em: new Date(dados.agora).toISOString(),
    confirmado_em: new Date(dados.agora).toISOString(),
    status: tela.endsWith("servico") || tela.endsWith("concluir") ? "em_atendimento" : "a_caminho",
  };
  const posicao = posicaoNoMapa(escolhido.id);
  const pins = [{ id: escolhido.id, initials: iniciais(escolhido.nome), ...posicao }];
  const aviso = () => avisar("Prévia: nenhuma alteração foi salva.", "info");
  let conteudo: ReactNode;

  switch (tela) {
    case "login":
    case "cadastro":
      conteudo = (
        <main className="auth-page grid min-h-dvh flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
          <section className="auth-form-panel flex flex-col justify-center bg-white px-6 py-8 sm:px-12 lg:py-12">
            <div className="auth-form-content mx-auto flex w-full max-w-sm flex-col gap-8">
              <div>
                <h1 className="font-display text-3xl font-bold">{tela === "login" ? "Entrar" : "Criar conta"}</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{tela === "login" ? "Acesse sua conta para pedir socorro ou atender chamados." : "Cadastre-se para pedir socorro ou atender ciclistas perto de você."}</p>
              </div>
              {tela === "login" ? <LoginForm onLogin={async ({ perfil }) => { ir(perfil); return { erro: "" }; }} /> : <SignupForm onSignup={async ({ perfil }) => { ir(perfil); return { confirmarEmail: "" }; }} />}
              <div className="flex flex-col gap-2">
              <button className="min-h-11 text-[15px] font-semibold text-brand" onClick={() => ir(tela === "login" ? "cadastro" : "login")}>
                {tela === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
              </button>
              {tela === "login" && <LegalLinks />}
              </div>
            </div>
          </section>
          <BrandPanel />
        </main>
      );
      break;
    case "ciclista":
      conteudo = <CyclistDashboard perfil={perfil} mechanics={dados.mechanics} initialResumo={dados.resumo} notice={null} onStart={categoria => { alterarPedido({ categoria: categoria ?? "pneu", favorito: false }); ir(categoria ? "ciclista-local" : "ciclista-defeito"); }} />;
      break;
    case "ciclista-chamados": conteudo = <ListaDeChamados initialChamados={dados.historico} />; break;
    case "ciclista-favoritos": conteudo = <ListaDeFavoritos />; break;
    case "mecanico-historico": conteudo = <HistoricoDoMecanico initialChamados={dados.historico} />; break;
    case "ciclista-perfil":
    case "mecanico-perfil": conteudo = <FormularioDePerfil />; break;
    case "ciclista-detalhe":
    case "mecanico-detalhe":
      conteudo = <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-3 sm:p-4"><DetalheDoChamado chamado={chamadoSelecionado} visao={caminho} onAvaliarCiclista={onAvaliarCiclista} /></main>;
      break;
    case "ciclista-defeito": conteudo = <CategoryStep selected={categoria} details={detalhes} onSelect={setCategoria} onDetailsChange={setDetalhes} onBack={() => ir("ciclista")} onNext={() => ir("ciclista-local")} />; break;
    case "ciclista-local": conteudo = <LocationStep categoryLabel={rotuloCategoria(categoria)} address={endereco} onAddressChange={setEndereco} onBack={() => ir("ciclista-defeito")} onNext={() => ir("ciclista-mecanicos")} />; break;
    case "ciclista-mecanicos": conteudo = <>
      <MechanicListStep mechanics={pedido.favorito ? dados.mechanics.filter(m => m.id === pedido.mecanicoId) : dados.mechanics} notice={pedido.favorito ? "Seu mecânico favorito está selecionado. Confirme em “Solicitar” para enviar o pedido." : null} error={null} requesting={null} onBack={() => ir("ciclista-local")} onRefresh={aviso} onChoose={m => { alterarPedido({ mecanicoId: m.id }); ir("ciclista-espera"); }} />
      {pedido.favorito && <Button variant="secondary" onClick={() => alterarPedido({ favorito: false })}>Ver outros mecânicos</Button>}
    </>; break;
    case "ciclista-espera": conteudo = <WaitingStep chamado={chamado} limitSeconds={60} cancelling={false} onCancel={() => ir("ciclista-mecanicos")} />; break;
    case "ciclista-proposta": conteudo = <ProposalStep chamado={chamado} busy={false} onConfirm={() => ir("ciclista-caminho")} onChooseAnother={() => ir("ciclista-mecanicos")} />; break;
    case "ciclista-caminho":
    case "ciclista-servico": conteudo = <TrackingStep chamado={chamado} busy={false} onCancel={() => ir("ciclista")} />; break;
    case "ciclista-avaliacao": conteudo = <FinishedStep chamado={{ ...dados.chamado, mecanico_id: escolhido.id, mecanico: escolhido }} busy={false} error={null} onConfirm={() => { aviso(); ir("ciclista"); }} />; break;
    case "mecanico": conteudo = <MechanicDashboard dados={dados.painel} erro={false} />; break;
    case "mecanico-novo": conteudo = <IncomingCall chamado={chamado} totalSeconds={60} queued={1} estimate={estimativa} eta={tempo} busy={false} onEstimateChange={setEstimativa} onEtaChange={setTempo} onDecline={() => ir("mecanico")} onAccept={() => ir("mecanico-espera")} />; break;
    case "mecanico-espera": conteudo = <EmptyState title="Estimativa enviada" description="R$ 25,00 · chegada em 6 min. Aguardando Ana confirmar o atendimento." />; break;
    case "mecanico-caminho":
    case "mecanico-servico": conteudo = <ActiveJob chamado={chamado} mechanicName={perfil.nome} busy={false} onNext={() => ir(tela === "mecanico-caminho" ? "mecanico-servico" : "mecanico-concluir")} />; break;
    case "mecanico-concluir": conteudo = <CloseJob estimate={25} finalPrice={valor} reason={motivo} priceChanged={parseBRL(valor) !== 25} canFinish={parseBRL(valor) > 0 && (parseBRL(valor) === 25 || Boolean(motivo.trim()))} busy={false} onFinalPriceChange={setValor} onReasonChange={setMotivo} onFinish={() => ir("mecanico-resumo")} />; break;
    case "mecanico-resumo": conteudo = <JobSummary chamado={dados.chamado} onBack={() => ir("mecanico")} onAvaliarCiclista={onAvaliarCiclista} />; break;
  }

  const etapaCiclista = tela.startsWith("ciclista-") && !["ciclista-perfil", "ciclista-chamados", "ciclista-detalhe", "ciclista-favoritos"].includes(tela);
  const painelMecanico = tela.startsWith("mecanico") && !["mecanico-perfil", "mecanico-historico", "mecanico-detalhe"].includes(tela);
  const mapaMobile = !["ciclista-defeito", "ciclista-local"].includes(tela);

  return (
    <div className="flex flex-1 flex-col"
      onSubmitCapture={event => {
        if (tela === "login" || tela === "cadastro") return;
        event.preventDefault();
        event.stopPropagation();
        const form = event.target as HTMLFormElement;
        if (publica) {
          const mecanicoMarcado = form.querySelector<HTMLInputElement>('input[type="radio"][value="mecanico"]')?.checked;
          ir(mecanicoMarcado ? "mecanico" : "ciclista");
        } else if (form.querySelector('button[type="submit"]')?.textContent?.trim() === "Sair") ir("login");
        else aviso();
      }}
      onClickCapture={event => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest("a");
        if (!link) return;
        const destino = new URL(link.href, window.location.origin);
        if (destino.origin !== window.location.origin) return;
        const rota = destino.pathname;
        const favoritoId = destino.searchParams.get("mecanico");
        const alvo = rota === "/" ? "login" : rota === "/cadastro" ? "cadastro"
          : rota === "/ciclista" ? favoritoId ? "ciclista-defeito" : "ciclista" : rota === "/mecanico" ? "mecanico"
          : rota === "/ciclista/favoritos" ? "ciclista-favoritos"
          : rota === "/ciclista/perfil" ? "ciclista-perfil" : rota === "/mecanico/perfil" ? "mecanico-perfil"
          : rota === "/ciclista/chamados" ? "ciclista-chamados" : rota === "/mecanico/historico" ? "mecanico-historico"
          : rota.startsWith("/ciclista/chamados/") ? `ciclista-detalhe/${rota.split("/").pop()}` : rota.startsWith("/mecanico/historico/") ? `mecanico-detalhe/${rota.split("/").pop()}` : null;
        if (alvo) {
          if (favoritoId) alterarPedido({ mecanicoId: favoritoId, favorito: true });
          event.preventDefault();
          event.stopPropagation();
          link.closest("details")?.removeAttribute("open");
          ir(alvo);
        }
      }}>
      {!publica && <AppHeader badge={mecanico ? "Mecânico" : undefined} user={{ initials: mecanico ? "LF" : "AS", name: mecanico ? "Lucas · Oficina BikeFast" : "Ana" }} links={mecanico ? [
        { href: "/mecanico", label: "Painel", exato: true }, { href: "/mecanico/historico", label: "Histórico" }, { href: "/mecanico/perfil", label: "Meu perfil" },
      ] : [
        { href: "/ciclista", label: "Pedir socorro", exato: true }, { href: "/ciclista/chamados", label: "Meus chamados" }, { href: "/ciclista/favoritos", label: "Favoritos" }, { href: "/ciclista/perfil", label: "Meu perfil" },
      ]} />}
      {etapaCiclista ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap items-stretch gap-4 p-3 sm:p-4">
          <section className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 lg:w-auto lg:max-w-[480px] lg:flex-[1_1_400px]">{conteudo}</section>
          <MapView className={`min-h-[260px] w-full min-w-0 sm:min-h-[360px] lg:min-h-[420px] lg:w-auto lg:flex-[999_1_480px] ${mapaMobile ? "" : "hidden lg:block"}`} pins={pins} routeTo={tela.includes("caminho") ? posicao : undefined} chip={tela === "ciclista-mecanicos" ? "3 mecânicos disponíveis agora" : "Socorro perto de você"} />
        </main>
      ) : painelMecanico ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 sm:p-4">
          <AvailabilityCard online={online} busy={false} hasActiveCall={tela !== "mecanico" && tela !== "mecanico-resumo"} onToggle={() => setOnline(!online)} />
          <section className={`flex w-full min-w-0 flex-col gap-4 ${tela === "mecanico" ? "" : "mx-auto min-h-[420px] max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-6"}`}>{conteudo}</section>
        </main>
      ) : conteudo}
      {!publica && <footer className="border-t border-line bg-white px-4 py-2"><LegalLinks /></footer>}
    </div>
  );
}
