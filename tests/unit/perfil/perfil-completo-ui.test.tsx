import {afterEach,expect,it,vi} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
import {PerfilCompleto} from "@/components/perfil/completo/PerfilCompleto";
import {PerfilProvider} from "@/components/PerfilProvider";
import {Toaster} from "@/components/ui/Toaster";
import {carregarPerfilCompleto} from "@/app/_actions/perfil-completo";
import type {Perfil} from "@/lib/supabase/database.types";
vi.mock("@/app/_actions/perfil-completo",()=>({carregarPerfilCompleto:vi.fn()}));
vi.mock("@/app/_actions/auth",()=>({trocarSenha:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()}),useSearchParams:()=>new URLSearchParams()}));
afterEach(cleanup);
it.each(["ciclista","mecanico"] as const)("%s tem seções reais e senha abaixo dos dados",async tipo=>{
  const perfil:Perfil={id:"dono",nome:"Ana Silva",telefone:"81999990000",tipo,oficina:null,disponivel:false,especialidades:[],servicos:[],bairro_regiao:null,criado_em:"2026-11-21"};
  vi.mocked(carregarPerfilCompleto).mockResolvedValue({ok:true,dados:{perfil,privados:null,oficina:null,fotoUrl:null,fachadaUrl:null}});
  render(<PerfilProvider perfil={perfil}><Toaster><PerfilCompleto/></Toaster></PerfilProvider>);
  expect(await screen.findByLabelText("CPF (opcional e privado)")).toBeTruthy();
  const nav=screen.getByRole("navigation",{name:"Seções de Meu perfil"});
  expect(nav.textContent).toContain(tipo==="ciclista"?"Minhas bicicletas":"Minha oficina");
  // O chat fica nos chamados; o perfil não tem uma segunda caixa de mensagens.
  expect(nav.textContent).not.toContain("Mensagens");
  // Nome e WhatsApp continuam no formulário de perfil (regras do cadastro).
  expect(screen.getByLabelText("Nome completo")).toBeTruthy();
  const titulos=screen.getAllByRole("heading",{level:2}).map(h=>h.textContent);
  expect(titulos.indexOf("Senha")).toBeGreaterThan(titulos.indexOf("Dados pessoais"));
});
it("troca de conta não mantém dados privados da conta anterior durante a recarga",async()=>{
  const perfil:Perfil={id:"conta-a",nome:"Ana Silva",telefone:"81999990000",tipo:"ciclista",oficina:null,disponivel:false,especialidades:[],servicos:[],bairro_regiao:null,criado_em:"2026-11-21"};
  vi.mocked(carregarPerfilCompleto).mockResolvedValue({ok:true,dados:{perfil,privados:{usuario_id:perfil.id,cpf:"52998224725",idade:25,foto_caminho:null,texto_ampliado:false,alto_contraste:false,reduzir_movimentos:false},oficina:null,fotoUrl:null,fachadaUrl:null}});
  const montar=(p:Perfil)=><PerfilProvider perfil={p}><Toaster><PerfilCompleto/></Toaster></PerfilProvider>;
  const view=render(montar(perfil));
  expect(await screen.findByDisplayValue("52998224725")).toBeTruthy();
  vi.mocked(carregarPerfilCompleto).mockImplementation(()=>new Promise(()=>{}));
  view.rerender(montar({...perfil,id:"conta-b",nome:"Outra Pessoa"}));
  expect(screen.queryByDisplayValue("52998224725")).toBeNull();
});
it("sem os dados privados (ex.: migration ausente), nome e WhatsApp continuam editáveis",async()=>{
  const perfil:Perfil={id:"dono",nome:"Ana Silva",telefone:"81999990000",tipo:"ciclista",oficina:null,disponivel:false,especialidades:[],servicos:[],bairro_regiao:null,criado_em:"2026-11-21"};
  vi.mocked(carregarPerfilCompleto).mockResolvedValue({ok:false,erro:"Não foi possível carregar os dados adicionais."});
  render(<PerfilProvider perfil={perfil}><Toaster><PerfilCompleto/></Toaster></PerfilProvider>);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByLabelText("Nome completo")).toBeTruthy();
  expect(screen.getByLabelText("WhatsApp")).toBeTruthy();
  expect(screen.queryByLabelText("CPF (opcional e privado)")).toBeNull();
});
it("no perfil completo do mecânico, Dados pessoais não mostra nem envia a oficina",async()=>{
  const perfil:Perfil={id:"dono",nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:"BikeFast",disponivel:false,especialidades:[],servicos:[],bairro_regiao:null,criado_em:"2026-11-21"};
  vi.mocked(carregarPerfilCompleto).mockResolvedValue({ok:true,dados:{perfil,privados:null,oficina:null,fotoUrl:null,fachadaUrl:null}});
  render(<PerfilProvider perfil={perfil}><Toaster><PerfilCompleto/></Toaster></PerfilProvider>);
  expect(await screen.findByLabelText("Nome completo")).toBeTruthy();
  expect(screen.queryByLabelText(/^Oficina/)).toBeNull();
});
