import {afterEach,expect,it,vi} from "vitest";
import {act,cleanup,render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ListaPerfil} from "@/components/perfil/completo/ListaPerfil";
import {carregarSecaoPerfil} from "@/app/_actions/perfil-completo";
vi.mock("@/app/_actions/perfil-completo",()=>({carregarSecaoPerfil:vi.fn()}));
afterEach(cleanup);
it("falha do banco não aparece como lista vazia",async()=>{
  vi.mocked(carregarSecaoPerfil).mockResolvedValue({ok:false,erro:"Banco indisponível"});
  render(<ListaPerfil secao="bicicletas" vazio="Nenhuma bicicleta">{i=><p>{i.modelo}</p>}</ListaPerfil>);
  expect((await screen.findByRole("alert")).textContent).toContain("Banco indisponível");
  expect(screen.queryByText("Nenhuma bicicleta")).toBeNull();
});
it("recarga após mutação ignora a resposta antiga",async()=>{
  const primeira={ok:true as const,dados:{itens:[{id:"item",criado_em:"2026-11-21",modelo:"Antiga"}],proxima:null}};
  let concluir!:(v:typeof primeira)=>void;
  vi.mocked(carregarSecaoPerfil).mockReset().mockResolvedValueOnce(primeira).mockImplementationOnce(()=>new Promise(resolve=>{concluir=resolve;})).mockResolvedValueOnce({...primeira,dados:{...primeira.dados,itens:[{...primeira.dados.itens[0],modelo:"Atualizada"}]}});
  render(<ListaPerfil secao="bicicletas" vazio="Nenhuma bicicleta">{(i,recarregar)=><><p>{i.modelo}</p><button onClick={recarregar}>Depois da mutação</button></>}</ListaPerfil>);
  await screen.findByText("Antiga");
  const user=userEvent.setup();
  await user.click(screen.getByRole("button",{name:"Depois da mutação"}));
  await user.click(screen.getByRole("button",{name:"Depois da mutação"}));
  await screen.findByText("Atualizada");
  await act(async()=>{concluir(primeira);});
  expect(screen.queryByText("Antiga")).toBeNull();
  // Sem botão "Atualizar lista": a lista recarrega sozinha depois de cada alteração.
  expect(screen.queryByRole("button",{name:"Atualizar lista"})).toBeNull();
});
it("conta nova mostra vazio real sem exemplos",async()=>{
  vi.mocked(carregarSecaoPerfil).mockResolvedValue({ok:true,dados:{itens:[],proxima:null}});
  render(<ListaPerfil secao="bicicletas" vazio="Nenhuma bicicleta">{i=><p>{i.modelo}</p>}</ListaPerfil>);
  expect(await screen.findByText("Nenhuma bicicleta")).toBeTruthy();
});
