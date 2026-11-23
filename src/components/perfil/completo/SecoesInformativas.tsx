"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {carregarResumoAvaliacoes} from "@/app/_actions/perfil-completo";
import type {BasePerfil} from "@/lib/perfil-completo/types";
import {pendenciasPerfil} from "@/lib/perfil-completo/status";
import type {StatusChamado} from "@/lib/supabase/database.types";
import {rotuloStatus} from "@/components/ui/StatusBadge";
import {EditorPerfil} from "./EditorPerfil";
import {ListaPerfil} from "./ListaPerfil";

export function AcessibilidadePerfil({base,atualizar}:{base:BasePerfil;atualizar:()=>void}) {
  return <div className="flex flex-col gap-4">
    <p className="text-sm text-muted">Preferências salvas na sua conta e aplicadas à área logada. As configurações do seu aparelho continuam valendo.</p>
    <EditorPerfil operacao="preferencias" campos={[
      {id:"texto_ampliado",titulo:"Texto ampliado",tipo:"checkbox"},
      {id:"alto_contraste",titulo:"Alto contraste",tipo:"checkbox"},
      {id:"reduzir_movimentos",titulo:"Reduzir movimentos",tipo:"checkbox"},
    ]} iniciais={{texto_ampliado:String(base.privados?.texto_ampliado??false),alto_contraste:String(base.privados?.alto_contraste??false),reduzir_movimentos:String(base.privados?.reduzir_movimentos??false)}} aoSalvar={atualizar}/>
  </div>;
}
/** O banco registra "Chamado: <status>"; aqui vira o mesmo rótulo do histórico. */
function rotuloAtividade(tipo:string|undefined) {
  const status=tipo?.match(/^Chamado: (\w+)$/)?.[1];
  return status?`Chamado: ${rotuloStatus(status as StatusChamado)}`:tipo;
}
const formatarNota=(nota:number)=>nota.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});

export function StatusPerfil({base}:{base:BasePerfil}) {
  const pendencias=pendenciasPerfil(base.perfil,base.oficina);
  return <div className="flex flex-col gap-4 text-sm leading-relaxed">
    <p className="font-semibold">{pendencias.length?"Cadastro com informações pendentes":"Dados obrigatórios do cadastro preenchidos"}</p>
    {pendencias.length>0&&<ul className="list-disc pl-5">{pendencias.map(p=><li key={p}>{p}</li>)}</ul>}
    {pendencias.length>0&&<p>Complete em <Link href={`/${base.perfil.tipo}/perfil?secao=${pendencias.some(p=>p.includes("oficina"))?"oficina":"dados"}`} scroll={false} className="font-semibold text-brand underline">{pendencias.some(p=>p.includes("oficina"))?"Minha oficina":"Dados pessoais"}</Link>.</p>}
    <p>Este status informa somente se os dados obrigatórios estão preenchidos. O SOS Bikes não verifica documentos. Não representa aprovação, punição ou selo de confiança.</p>
    <p>CPF, idade e fotos são opcionais. Uma pendência não bloqueia seus atendimentos existentes.</p>
    <Link href="/termos" className="font-semibold text-brand underline">Consultar termos de uso</Link>
  </div>;
}
export function AjudaPerfil({mecanico}:{mecanico:boolean}) {
  const assuntos=[
    ["Dados e segurança","Edite nome e WhatsApp em Dados pessoais. CPF e idade são opcionais e privados. Para trocar a senha, informe a senha atual, a nova e a confirmação no card Senha."],
    [mecanico?"Oficina e disponibilidade":"Bicicletas e locais",mecanico?"Autônomos não precisam de CNPJ. Vinculados informam nome e CNPJ da oficina. No painel, controle sua disponibilidade para receber chamados. Endereço e fachada cadastrados aqui são privados.":"Cadastre várias bicicletas com modelo e foto. Salve locais e consulte os endereços usados nos seus chamados. Esses cadastros não tornam bicicleta ou local obrigatórios para pedir socorro."],
    ["Atendimentos",mecanico?"No painel, receba o pedido e informe estimativa e tempo de chegada. Acompanhe as etapas e registre o valor final ao concluir.":"Em Pedir socorro, escolha o defeito, informe sua localização e selecione um mecânico disponível. Confira a estimativa antes de confirmar e acompanhe as etapas."],
    ["Favoritos",mecanico?"Adicione à sua lista privada clientes que já participaram dos seus chamados. Favoritar não permite enviar mensagens fora das regras do atendimento.":"Salve mecânicos na lista do pedido e consulte seus favoritos aqui. Chamar novamente inicia um novo pedido para o mecânico escolhido, sujeito à disponibilidade."],
    ["Mensagens e avaliações","Mensagens ficam restritas aos participantes do chamado. O envio é permitido durante o atendimento; depois, a conversa é somente leitura. Sua avaliação mostra notas reais recebidas em chamados concluídos."],
    ["Notificações e instalação","Ative avisos no card Notificações, quando o navegador permitir. No iPhone, instale o app pela opção Adicionar à Tela de Início do Safari. Notificações bloqueadas precisam ser liberadas nas configurações do navegador."],
    ["Acessibilidade e atividade","Salve preferências de texto, contraste e movimento. Sua atividade mostra os eventos registrados de cadastro e chamados, não um histórico de todos os cliques."],
  ];
  return <div className="flex flex-col gap-4 text-sm leading-relaxed">
    {assuntos.map(([titulo,texto])=><details key={titulo} className="rounded-xl border border-line p-4"><summary className="cursor-pointer font-semibold">{titulo}</summary><p className="mt-3 text-muted">{texto}</p></details>)}
    <p>O SOS Bikes é um projeto acadêmico desenvolvido por estudantes do curso de Administração da FICR. Não é um serviço comercial e não há canal de atendimento.</p>
    <div className="flex flex-wrap gap-4"><Link href="/termos" className="text-brand underline">Termos</Link><Link href="/privacidade" className="text-brand underline">Privacidade</Link></div>
  </div>;
}
export function AtividadePerfil() {
  return <div className="flex flex-col gap-4">
    <p className="text-sm text-muted">Eventos reais de cadastro e situação dos seus chamados. Não inclui todos os cliques e não é uma auditoria completa.</p>
    <ListaPerfil secao="atividade" vazio="Nenhuma atividade registrada.">{item=><>
      <p className="font-semibold">{rotuloAtividade(item.tipo)}</p><time className="text-sm text-muted" dateTime={item.criado_em}>{new Date(item.criado_em).toLocaleString("pt-BR")}</time>
    </>}</ListaPerfil>
  </div>;
}
export function AvaliacaoPerfil() {
  const [resumo,setResumo]=useState<{quantidade:number;media:number|null}|null>(null);
  const [erro,setErro]=useState("");
  useEffect(()=>{
    let ativo=true;
    carregarResumoAvaliacoes().then(r=>{if(ativo){if(r.ok)setResumo(r.dados);else setErro(r.erro);}}).catch(()=>{if(ativo)setErro("Não foi possível carregar a média.");});
    return()=>{ativo=false;};
  },[]);
  return <div className="flex flex-col gap-4">
    <p className="text-sm text-muted">Avaliações recebidas dos outros participantes em atendimentos concluídos.</p>
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    {resumo&&<p className="rounded-xl bg-brand-soft p-4 font-semibold text-brand">{resumo.quantidade&&resumo.media!==null?`${formatarNota(resumo.media)} / 5 · ${resumo.quantidade} ${resumo.quantidade===1?"avaliação recebida":"avaliações recebidas"}`:"Sem avaliações ainda"}</p>}
    <ListaPerfil secao="avaliacao" vazio="Você ainda não recebeu avaliações.">{item=><>
      <p className="font-semibold"><span aria-hidden="true" className="text-star">{"★".repeat(item.nota??0)}</span> <span className="text-sm font-normal"><span className="sr-only">Nota </span>{item.nota}/5</span></p>
      {item.comentario&&<p className="mt-2 text-sm break-words">{item.comentario}</p>}
      <time dateTime={item.criado_em} className="text-sm text-muted">{new Date(item.criado_em).toLocaleDateString("pt-BR")}</time>
    </>}</ListaPerfil>
  </div>;
}
