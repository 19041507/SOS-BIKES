import {afterEach,expect,it,vi} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
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
it("conta nova mostra vazio real sem exemplos",async()=>{
  vi.mocked(carregarSecaoPerfil).mockResolvedValue({ok:true,dados:{itens:[],proxima:null}});
  render(<ListaPerfil secao="bicicletas" vazio="Nenhuma bicicleta">{i=><p>{i.modelo}</p>}</ListaPerfil>);
  expect(await screen.findByText("Nenhuma bicicleta")).toBeTruthy();
});
