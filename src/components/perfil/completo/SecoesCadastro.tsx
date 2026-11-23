"use client";

import { useRef, useState } from "react";
import {useFavoritos} from "@/components/FavoritosProvider";
import { salvarSecaoPerfil } from "@/app/_actions/perfil-completo";
import { removerFavorito } from "@/lib/favoritos";
import type { BasePerfil } from "@/lib/perfil-completo/types";
import { Button } from "@/components/ui/Button";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { EditorPerfil, type CampoEditor } from "./EditorPerfil";
import { FotoPerfil } from "./FotoPerfil";
import { ListaPerfil } from "./ListaPerfil";

// Nome, WhatsApp e oficina ficam no FormularioDePerfil (regras do cadastro); aqui só os dados privados.
export const CAMPOS_PESSOAIS:CampoEditor[]=[
  {id:"cpf",titulo:"CPF (opcional e privado)",max:14,tipo:"password"},
  {id:"idade",titulo:"Idade (opcional e privada)",tipo:"number"},
];
const CAMPOS_BIKE:CampoEditor[]=[{id:"modelo",titulo:"Modelo da bicicleta",max:100,obrigatorio:true},{id:"apelido",titulo:"Apelido (opcional)",max:80},{id:"cor",titulo:"Cor (opcional)",max:40}];
const CAMPOS_LOCAL:CampoEditor[]=[{id:"nome",titulo:"Nome do local",max:80,obrigatorio:true},{id:"endereco",titulo:"Endereço",max:200,obrigatorio:true}];

/** Sem `base` (dados privados indisponíveis), nome, WhatsApp e oficina continuam editáveis. */
export function DadosPessoais({base,atualizar}:{base:BasePerfil|null;atualizar:()=>void}) {
  const [mostrar,setMostrar]=useState(false);
  return <div className="flex flex-col gap-6">
    <FormularioDePerfil embutido/>
    {base&&<section className="flex flex-col gap-5 border-t border-line pt-6">
      <h3 className="font-semibold">Foto e dados privados</h3>
      <FotoPerfil destino="avatar" url={base.fotoUrl} aoSalvar={atualizar}/>
      <EditorPerfil operacao="dados" campos={CAMPOS_PESSOAIS.map(c=>c.id==="cpf"?{...c,tipo:mostrar?"text":"password"}:c)}
        iniciais={{cpf:base.privados?.cpf??"",idade:String(base.privados?.idade??"")}} aoSalvar={atualizar}/>
      <Button variant="secondary" aria-pressed={mostrar} onClick={()=>setMostrar(v=>!v)} className="self-start">{mostrar?"Ocultar CPF":"Mostrar CPF"}</Button>
      <p className="text-sm text-muted">CPF e idade são opcionais e visíveis apenas para você. O documento não é uma verificação de identidade.</p>
    </section>}
  </div>;
}

export function OficinaPerfil({base,atualizar}:{base:BasePerfil;atualizar:()=>void}) {
  return <div className="flex flex-col gap-5">
    <p className="text-sm text-muted">
      {base.perfil.oficina?`Oficina: ${base.perfil.oficina}. `:"Você aparece como mecânico autônomo. "}
      O nome da oficina é editado em Dados pessoais. CNPJ, endereço e fachada são opcionais e privados.
    </p>
    <EditorPerfil operacao="oficina" cnpjAnterior={base.oficina?.cnpj} campos={[
      {id:"vinculado",titulo:"Estou vinculado a uma oficina",tipo:"checkbox"},
      {id:"cnpj",titulo:"CNPJ da oficina (opcional)",max:18,soVinculado:true},
      {id:"endereco",titulo:"Endereço da oficina (opcional)",max:200,soVinculado:true},
    ]} iniciais={{vinculado:String(base.oficina?.vinculado??Boolean(base.perfil.oficina)),cnpj:base.oficina?.cnpj??"",endereco:base.oficina?.endereco??""}} aoSalvar={atualizar}/>
    {base.oficina?.vinculado&&<FotoPerfil destino="fachada" url={base.fachadaUrl} aoSalvar={atualizar}/>}
  </div>;
}

function AcaoRegistro({operacao,dados,titulo,aoSalvar,perigosa=false}:{operacao:string;dados:Record<string,unknown>;titulo:string;aoSalvar:()=>void;perigosa?:boolean}) {
  const [pendente,setPendente]=useState(false);
  const [erro,setErro]=useState("");
  const ocupado=useRef(false);
  return <div className="mt-3 flex flex-col gap-2">
    <Button variant={perigosa?"danger-link":"secondary"} loading={pendente} onClick={async()=>{
      if(ocupado.current||(perigosa&&!window.confirm("Remover este registro?"))) return;
      ocupado.current=true;
      setPendente(true);setErro("");
      try {const r=await salvarSecaoPerfil(operacao,dados);if(r.ok) aoSalvar();else setErro(r.erro);}
      catch {setErro("Não foi possível confirmar a alteração. Atualize antes de tentar novamente.");}
      finally {ocupado.current=false;setPendente(false);}
    }} className="self-start">{titulo}</Button>
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
  </div>;
}

export function BicicletasPerfil() {
  const [versao,setVersao]=useState(0);
  return <div className="flex min-w-0 flex-col gap-6">
    <ListaPerfil key={versao} secao="bicicletas" vazio="Você ainda não cadastrou bicicletas.">{(item,recarregar)=><div className="flex flex-col gap-3">
      <h3 className="font-semibold">{item.modelo}{item.apelido?` · ${item.apelido}`:""}</h3>
      <p className="text-sm text-muted">{item.cor??"Cor não informada"}</p>
      <FotoPerfil destino="bicicleta" itemId={item.id} url={item.fotoUrl??null} aoSalvar={recarregar}/>
      <details><summary className="min-h-11 cursor-pointer py-3 font-semibold text-brand">Editar bicicleta</summary>
        <EditorPerfil operacao="bicicleta" campos={CAMPOS_BIKE} iniciais={{id:item.id,modelo:item.modelo??"",apelido:item.apelido??"",cor:item.cor??""}} aoSalvar={recarregar}/>
      </details>
      <AcaoRegistro operacao="remover_bicicleta" dados={{id:item.id}} titulo="Remover bicicleta" aoSalvar={recarregar} perigosa/>
    </div>}</ListaPerfil>
    <section className="rounded-xl bg-surface p-4"><h3 className="mb-4 font-semibold">Adicionar bicicleta</h3>
      <EditorPerfil operacao="bicicleta" campos={CAMPOS_BIKE} iniciais={{modelo:"",apelido:"",cor:""}} aoSalvar={()=>setVersao(v=>v+1)} limpar/>
    </section>
  </div>;
}

export function LocaisPerfil() {
  const [versao,setVersao]=useState(0);
  return <div className="flex flex-col gap-6">
    <h3 className="font-semibold">Locais salvos</h3>
    <ListaPerfil key={versao} secao="locais" vazio="Você ainda não salvou locais.">{(item,recarregar)=><>
      <h4 className="font-semibold">{item.nome}</h4><p className="text-sm break-words">{item.endereco}</p>
      <details><summary className="min-h-11 cursor-pointer py-3 text-brand">Editar local</summary>
        <EditorPerfil operacao="local" campos={CAMPOS_LOCAL} iniciais={{id:item.id,nome:item.nome??"",endereco:item.endereco??""}} aoSalvar={recarregar}/>
      </details>
      <AcaoRegistro operacao="remover_local" dados={{id:item.id}} titulo="Remover local" aoSalvar={recarregar} perigosa/>
    </>}</ListaPerfil>
    <h3 className="font-semibold">Adicionar local</h3>
    <EditorPerfil operacao="local" campos={CAMPOS_LOCAL} iniciais={{nome:"",endereco:""}} aoSalvar={()=>setVersao(v=>v+1)} limpar/>
    <h3 className="font-semibold">Endereços usados nos seus chamados</h3>
    <ListaPerfil secao="locais_usados" vazio="Nenhum endereço utilizado em chamados.">{item=><p className="text-sm break-words">{item.endereco}</p>}</ListaPerfil>
  </div>;
}

export function FavoritosPerfil({base}:{base:BasePerfil}) {
  const mecanico=base.perfil.tipo==="mecanico";
  const contextoFavoritos=useFavoritos();
  const [versao,setVersao]=useState(0);
  const [erro,setErro]=useState("");
  const [removendo,setRemovendo]=useState<string|null>(null);
  return <div className="flex flex-col gap-5">
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    <ListaPerfil key={versao} secao="favoritos" vazio="Sua lista de favoritos está vazia.">{(item,recarregar)=><>
      <p className="font-semibold">{item.nome}</p>
      {!mecanico&&<p className="text-sm text-muted">{item.oficina??"Mecânico autônomo"}</p>}
      {mecanico?<AcaoRegistro operacao="cliente_favorito" dados={{id:item.id,salvar:false}} titulo="Remover favorito" aoSalvar={recarregar} perigosa/>:
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`/ciclista?mecanico=${encodeURIComponent(item.id)}`} className="inline-flex min-h-12 items-center rounded-xl bg-brand px-4 font-semibold text-white">Chamar novamente</a>
          <Button variant="danger-link" disabled={removendo!==null} onClick={async()=>{
            if(!window.confirm("Remover este mecânico dos favoritos?")) return;
            setRemovendo(item.id);setErro("");
            try {await removerFavorito(base.perfil.id,item.id);await contextoFavoritos.atualizar();recarregar();} catch {setErro("Não foi possível remover o favorito.");} finally {setRemovendo(null);}
          }}>Remover favorito</Button>
        </div>}
    </>}</ListaPerfil>
    {mecanico?<>
      <h3 className="font-semibold">Adicionar clientes de seus atendimentos</h3>
      <ListaPerfil secao="clientes" vazio="Nenhum cliente de atendimento disponível.">{item=><>
        <p className="font-semibold">{item.nome}</p>
        <AcaoRegistro operacao="cliente_favorito" dados={{id:item.id,salvar:true}} titulo="Salvar cliente" aoSalvar={()=>setVersao(v=>v+1)}/>
      </>}</ListaPerfil>
    </>:<a href="/ciclista/favoritos" className="min-h-11 py-2 font-semibold text-brand underline">Gerenciar mecânicos favoritos</a>}
  </div>;
}
