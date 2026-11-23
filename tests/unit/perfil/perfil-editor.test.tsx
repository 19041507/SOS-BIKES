import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import {useState} from "react";
import {RascunhosPerfil} from "@/components/perfil/completo/RascunhosPerfil";
import userEvent from "@testing-library/user-event";
import { EditorPerfil } from "@/components/perfil/completo/EditorPerfil";
import { Toaster } from "@/components/ui/Toaster";
import { salvarSecaoPerfil } from "@/app/_actions/perfil-completo";
vi.mock("@/app/_actions/perfil-completo",()=>({salvarSecaoPerfil:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
afterEach(cleanup);
beforeEach(()=>{vi.mocked(salvarSecaoPerfil).mockReset();});
const campos=[{id:"modelo",titulo:"Modelo da bicicleta",max:100,obrigatorio:true}];
it("valida antes de enviar e mantém rascunho em erro real",async()=>{
  const user=userEvent.setup();
  render(<Toaster><EditorPerfil operacao="bicicleta" campos={campos} iniciais={{modelo:""}} aoSalvar={()=>{}} /></Toaster>);
  await user.click(screen.getByRole("button",{name:"Salvar"}));
  expect(salvarSecaoPerfil).not.toHaveBeenCalled();
  expect(await screen.findByRole("alert")).toBeTruthy();
  await user.type(screen.getByLabelText("Modelo da bicicleta"),"Caloi Explorer");
  vi.mocked(salvarSecaoPerfil).mockResolvedValue({ok:false,erro:"Banco indisponível"});
  await user.click(screen.getByRole("button",{name:"Salvar"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Banco indisponível");
  expect((screen.getByLabelText("Modelo da bicicleta") as HTMLInputElement).value).toBe("Caloi Explorer");
});
it("mantém rascunho ao sair e voltar de uma seção sem gravar documentos no navegador",async()=>{
  function Pagina() {
    const [aberto,setAberto]=useState(true);
    return <Toaster><RascunhosPerfil><button onClick={()=>setAberto(a=>!a)}>Alternar seção</button>{aberto&&<EditorPerfil operacao="bicicleta" campos={campos} iniciais={{modelo:""}} aoSalvar={()=>{}}/>}</RascunhosPerfil></Toaster>;
  }
  const user=userEvent.setup();
  render(<Pagina/>);
  await user.type(screen.getByLabelText("Modelo da bicicleta"),"Minha bicicleta");
  await user.click(screen.getByRole("button",{name:"Alternar seção"}));
  await user.click(screen.getByRole("button",{name:"Alternar seção"}));
  expect((screen.getByLabelText("Modelo da bicicleta") as HTMLInputElement).value).toBe("Minha bicicleta");
  expect(salvarSecaoPerfil).not.toHaveBeenCalled();
});
it("duplo clique envia somente uma gravação enquanto a resposta está pendente",async()=>{
  let concluir!:(valor:Awaited<ReturnType<typeof salvarSecaoPerfil>>)=>void;
  vi.mocked(salvarSecaoPerfil).mockImplementation(()=>new Promise(resolve=>{concluir=resolve;}));
  render(<Toaster><EditorPerfil operacao="bicicleta" campos={campos} iniciais={{modelo:"Caloi"}} aoSalvar={()=>{}}/></Toaster>);
  const user=userEvent.setup();
  await user.dblClick(screen.getByRole("button",{name:"Salvar"}));
  expect(salvarSecaoPerfil).toHaveBeenCalledTimes(1);
  await act(async()=>{concluir({ok:true,dados:{limpezaPendente:false}});});
  expect(await screen.findByText("Dados salvos.")).toBeTruthy();
});
