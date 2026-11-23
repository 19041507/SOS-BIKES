"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import {carregarPerfilCompleto} from "@/app/_actions/perfil-completo";
import {usePerfil} from "@/components/PerfilProvider";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {iniciais} from "@/lib/pessoas";
import {secoesDoPerfil,type BasePerfil,type SecaoPerfil} from "@/lib/perfil-completo/types";
import {TrocarSenha} from "../TrocarSenha";
import {Notificacoes} from "../Notificacoes";
import {FotosDoPerfil} from "../FotosDoPerfil";
import {DadosPessoais,OficinaPerfil,BicicletasPerfil,LocaisPerfil,FavoritosPerfil} from "./SecoesCadastro";
import {AcessibilidadePerfil,AjudaPerfil,StatusPerfil,AtividadePerfil,AvaliacaoPerfil} from "./SecoesInformativas";
import {RascunhosPerfil} from "./RascunhosPerfil";

const ICONES:Record<SecaoPerfil,string>={
  dados:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a8 8 0 0 1 16 0v2",
  bicicletas:"M5 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 16l5-9 5 9H5Zm5-9H7m8-3h3l2 8",
  locais:"M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  oficina:"M3 21h18M5 21V9m14 12V9M3 9l2-6h14l2 6H3Zm6 12v-7h6v7",
  publico:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  favoritos:"m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  avaliacao:"M4 3h16v14H9l-5 4V3Zm4 5h8m-8 4h5",
  acessibilidade:"M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4 9l8 2 8-2m-8 2v5m0 0-4 6m4-6 4 6",
  ajuda:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-3-13a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01",
  status:"M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6",
  atividade:"M2 12h5l3-8 4 16 3-8h5",
};

export function PerfilCompleto() {
  const perfil=usePerfil();
  const params=useSearchParams();
  const secoes=secoesDoPerfil(perfil.tipo);
  const selecionada=secoes.find(s=>s.id===params.get("secao"))??secoes[0];
  const [carregado,setBase]=useState<BasePerfil|null>(null);
  const base=carregado?.perfil.id===perfil.id?carregado:null;
  const [erro,setErro]=useState("");
  const [carregando,setCarregando]=useState(false);
  const versao=useRef(0);
  useEffect(()=>{
    let ativo=true;
    const atual=++versao.current;
    carregarPerfilCompleto().then(r=>{if(ativo&&versao.current===atual){if(r.ok)setBase(r.dados);else setErro(r.erro);}}).catch(()=>{if(ativo)setErro("Não foi possível carregar seu perfil.");});
    return()=>{ativo=false;versao.current=-1;};
  },[perfil.id]);
  async function atualizar() {
    const atual=++versao.current;
    setCarregando(true);setErro("");
    try {
      const r=await carregarPerfilCompleto();
      if(versao.current!==atual)return;
      if(r.ok)setBase(r.dados);else setErro(r.erro);
    }catch{if(versao.current===atual)setErro("Não foi possível atualizar os dados. Sua gravação anterior pode ter sido concluída.");}
    finally{if(versao.current===atual)setCarregando(false);}
  }
  const recarregar=()=>{void atualizar();};
  const atual=base?.perfil??perfil;
  // "Dados pessoais" não depende das tabelas novas: o formulário de nome/WhatsApp/oficina sempre aparece.
  const conteudo=selecionada.id==="dados"?<DadosPessoais base={base} atualizar={recarregar}/>:base?{
    oficina:<OficinaPerfil base={base} atualizar={recarregar}/>,
    // Fotos e comentários que os ciclistas veem antes de escolher (perfil público, #116).
    publico:<div className="flex flex-col gap-5">
      <Link href={`/mecanicos/${perfil.id}`} className="self-start font-semibold text-brand underline">Visualizar perfil público</Link>
      <FotosDoPerfil/>
    </div>,
    bicicletas:<BicicletasPerfil/>,
    locais:<LocaisPerfil/>,
    favoritos:<FavoritosPerfil base={base}/>,
    avaliacao:<AvaliacaoPerfil/>,
    acessibilidade:<AcessibilidadePerfil base={base} atualizar={recarregar}/>,
    ajuda:<AjudaPerfil mecanico={perfil.tipo==="mecanico"}/>,
    status:<StatusPerfil base={base}/>,
    atividade:<AtividadePerfil/>,
  }[selecionada.id]:null;
  return <RascunhosPerfil key={perfil.id}>
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-3 sm:p-6">
      <header className="flex min-w-0 items-center gap-4 rounded-2xl bg-brand p-5 text-white sm:p-7">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-xl font-bold">{iniciais(atual.nome)}</span>
        <div className="min-w-0"><p className="text-xs font-semibold tracking-wider text-white/80">{perfil.tipo==="mecanico"?"ESPAÇO DO MECÂNICO":"ESPAÇO DO CICLISTA"}</p><h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Meu perfil</h1><p className="mt-1 text-sm text-white/90">Seus dados, sua segurança e sua experiência no SOS Bikes.</p></div>
      </header>
      {erro&&<div role="alert" className="flex flex-col gap-3 rounded-xl bg-red-50 p-4 text-sm text-danger"><p>{erro}</p><Button variant="secondary" loading={carregando} onClick={recarregar} className="self-start">Tentar novamente</Button></div>}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Seções de Meu perfil" className="grid min-w-0 grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-2 sm:grid-cols-3 lg:grid-cols-1">
          {secoes.map(s=><Link key={s.id} href={`/${perfil.tipo}/perfil?secao=${s.id}`} scroll={false} aria-current={s.id===selecionada.id?"page":undefined}
            className={`flex min-h-12 min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${s.id===selecionada.id?"bg-brand text-white":"text-muted hover:bg-brand-soft hover:text-brand"}`}>
            <svg width="20" height="20" className="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONES[s.id]}/></svg><span>{s.titulo}</span>
          </Link>)}
        </nav>
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="min-w-0"><h2 className="mb-5 font-display text-xl font-bold">{selecionada.titulo}</h2>
            {conteudo??(!erro&&<p role="status">Carregando seus dados…</p>)}
          </Card>
          {selecionada.id==="dados"&&<TrocarSenha/>}
          <Notificacoes/>
        </div>
      </div>
    </main>
  </RascunhosPerfil>;
}
