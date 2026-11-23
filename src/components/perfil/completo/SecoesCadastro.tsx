"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {useFavoritos} from "@/components/FavoritosProvider";
import { salvarSecaoPerfil } from "@/app/_actions/perfil-completo";
import { removerFavorito } from "@/lib/favoritos";
import type { BasePerfil } from "@/lib/perfil-completo/types";
import { Button } from "@/components/ui/Button";
import { Confirmacao } from "@/components/ui/Confirmacao";
import { useToast } from "@/components/ui/Toaster";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { formatarCnpj, formatarCpf } from "@/lib/perfil-completo/validacao";
import { EditorPerfil, type CampoEditor } from "./EditorPerfil";
import { FotoPerfil } from "./FotoPerfil";
import { ListaPerfil } from "./ListaPerfil";

// Nome e WhatsApp ficam no FormularioDePerfil (regras do cadastro); aqui só os dados privados.
const CAMPOS_PESSOAIS:CampoEditor[]=[
  {id:"cpf",titulo:"CPF (opcional e privado)",max:14,tipo:"cpf"},
  {id:"idade",titulo:"Idade (opcional e privada)",tipo:"number"},
];
const CAMPOS_BIKE:CampoEditor[]=[{id:"modelo",titulo:"Modelo da bicicleta",max:100,obrigatorio:true},{id:"apelido",titulo:"Apelido (opcional)",max:80},{id:"cor",titulo:"Cor (opcional)",max:40}];
const CAMPOS_LOCAL:CampoEditor[]=[{id:"nome",titulo:"Nome do local",max:80,obrigatorio:true,placeholder:"Ex.: Casa, Trabalho"},{id:"endereco",titulo:"Endereço",max:200,obrigatorio:true,autoComplete:"street-address"}];

/**
 * Sem `base` (dados privados indisponíveis), nome e WhatsApp continuam editáveis.
 * O mecânico tem uma foto só, a pública (seção "Perfil público"); o ciclista envia a foto aqui.
 */
export function DadosPessoais({base,atualizar,mecanico}:{base:BasePerfil|null;atualizar:()=>void;mecanico:boolean}) {
  return <div className="flex flex-col gap-6">
    <FormularioDePerfil parte="contato"/>
    {mecanico&&<p className="rounded-xl bg-surface p-4 text-sm text-muted">Sua foto, região, especialidades e serviços aparecem para os ciclistas e ficam em <Link href="/mecanico/perfil?secao=publico" scroll={false} className="font-semibold text-brand underline">Perfil público</Link>.</p>}
    {base&&<section className="flex flex-col gap-5 border-t border-line pt-6">
      <h3 className="font-semibold">{mecanico?"Dados privados":"Foto e dados privados"}</h3>
      {!mecanico&&<FotoPerfil destino="avatar" url={base.fotoUrl} aoSalvar={atualizar}/>}
      <EditorPerfil operacao="dados" campos={CAMPOS_PESSOAIS}
        iniciais={{cpf:formatarCpf(base.privados?.cpf??""),idade:String(base.privados?.idade??"")}} aoSalvar={atualizar}/>
      <p className="text-sm text-muted">CPF e idade são opcionais e visíveis apenas para você. O documento não é uma verificação de identidade.</p>
    </section>}
  </div>;
}

export function OficinaPerfil({base,atualizar}:{base:BasePerfil;atualizar:()=>void}) {
  return <div className="flex flex-col gap-5">
    <p className="text-sm text-muted">Autônomos não precisam de CNPJ. Se estiver vinculado a uma oficina, informe o nome e o CNPJ. O nome da oficina aparece para os ciclistas; endereço e fachada são opcionais e só você vê.</p>
    <EditorPerfil operacao="oficina" cnpjAnterior={base.oficina?.cnpj} campos={[
      {id:"vinculado",titulo:"Estou vinculado a uma oficina",tipo:"checkbox"},
      {id:"nome",titulo:"Nome da oficina",max:120,obrigatorio:true,soVinculado:true,autoComplete:"organization"},
      {id:"cnpj",titulo:"CNPJ da oficina",tipo:"cnpj",max:18,obrigatorio:true,soVinculado:true},
      {id:"endereco",titulo:"Endereço da oficina (opcional)",max:200,soVinculado:true,autoComplete:"street-address"},
    ]} iniciais={{vinculado:String(base.oficina?.vinculado??Boolean(base.perfil.oficina)),nome:base.perfil.oficina??"",cnpj:formatarCnpj(base.oficina?.cnpj??""),endereco:base.oficina?.endereco??""}} aoSalvar={atualizar}/>
    {base.oficina?.vinculado&&<FotoPerfil destino="fachada" url={base.fachadaUrl} aoSalvar={atualizar}/>}
  </div>;
}

/** `confirmar`: texto da confirmação na tela antes de executar (ações que removem algo). */
function AcaoRegistro({operacao,dados,titulo,sucesso,aoSalvar,confirmar}:{operacao:string;dados:Record<string,unknown>;titulo:string;sucesso:string;aoSalvar:()=>void;confirmar?:string}) {
  const [pendente,setPendente]=useState(false);
  const [confirmando,setConfirmando]=useState(false);
  const [erro,setErro]=useState("");
  const ocupado=useRef(false);
  const avisar=useToast();
  async function executar() {
    if(ocupado.current) return;
    ocupado.current=true;
    setConfirmando(false);setPendente(true);setErro("");
    try {const r=await salvarSecaoPerfil(operacao,dados);if(r.ok){avisar(sucesso,"sucesso");aoSalvar();}else setErro(r.erro);}
    catch {setErro("Não foi possível confirmar a alteração. Atualize antes de tentar novamente.");}
    finally {ocupado.current=false;setPendente(false);}
  }
  return <div className="mt-3 flex flex-col gap-2">
    {confirmando&&confirmar
      ?<Confirmacao texto={confirmar} confirmar={titulo} onConfirmar={()=>void executar()} onCancelar={()=>setConfirmando(false)}/>
      :<Button variant={confirmar?"danger-link":"secondary"} loading={pendente} onClick={()=>confirmar?setConfirmando(true):void executar()} className="self-start">{titulo}</Button>}
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
      <AcaoRegistro operacao="remover_bicicleta" dados={{id:item.id}} titulo="Remover bicicleta" sucesso="Bicicleta removida." aoSalvar={recarregar} confirmar={`Remover a bicicleta ${item.modelo}? A foto dela também será apagada.`}/>
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
      <AcaoRegistro operacao="remover_local" dados={{id:item.id}} titulo="Remover local" sucesso="Local removido." aoSalvar={recarregar} confirmar={`Remover o local “${item.nome}”?`}/>
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
  const [confirmando,setConfirmando]=useState<string|null>(null);
  const avisar=useToast();
  return <div className="flex flex-col gap-5">
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    <ListaPerfil key={`favoritos-${versao}`} secao="favoritos" vazio="Sua lista de favoritos está vazia.">{(item,recarregar)=><>
      <p className="font-semibold">{item.nome}</p>
      {!mecanico&&<p className="text-sm text-muted">{item.oficina??"Mecânico autônomo"}</p>}
      {mecanico?<AcaoRegistro operacao="cliente_favorito" dados={{id:item.id,salvar:false}} titulo="Remover favorito" sucesso="Cliente removido dos favoritos." aoSalvar={()=>setVersao(v=>v+1)} confirmar={`Remover ${item.nome} dos seus clientes favoritos?`}/>:
        confirmando===item.id
          ?<div className="mt-3"><Confirmacao texto={`Remover ${item.nome} dos seus mecânicos favoritos?`} confirmar="Remover favorito" onCancelar={()=>setConfirmando(null)} onConfirmar={async()=>{
            setConfirmando(null);setRemovendo(item.id);setErro("");
            try {await removerFavorito(base.perfil.id,item.id);await contextoFavoritos.atualizar();avisar("Mecânico removido dos favoritos.","sucesso");recarregar();} catch {setErro("Não foi possível remover o favorito.");} finally {setRemovendo(null);}
          }}/></div>
          :<div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/ciclista?mecanico=${encodeURIComponent(item.id)}`} className="inline-flex min-h-12 items-center rounded-xl bg-brand px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Chamar novamente</Link>
            <Button variant="danger-link" disabled={removendo!==null} onClick={()=>setConfirmando(item.id)}>Remover favorito</Button>
          </div>}
    </>}</ListaPerfil>
    {mecanico?<>
      <h3 className="font-semibold">Adicionar clientes de seus atendimentos</h3>
      <p className="-mt-3 text-sm text-muted">Ciclistas de atendimentos concluídos que ainda não estão nos seus favoritos.</p>
      <ListaPerfil key={`clientes-${versao}`} secao="clientes" vazio="Nenhum cliente de atendimento concluído para adicionar.">{item=><>
        <p className="font-semibold">{item.nome}</p>
        <AcaoRegistro operacao="cliente_favorito" dados={{id:item.id,salvar:true}} titulo="Salvar cliente" sucesso="Cliente salvo nos favoritos." aoSalvar={()=>setVersao(v=>v+1)}/>
      </>}</ListaPerfil>
    </>:<Link href="/ciclista/favoritos" className="flex min-h-11 items-center font-semibold text-brand underline">Gerenciar mecânicos favoritos</Link>}
  </div>;
}
