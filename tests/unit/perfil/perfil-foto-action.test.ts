// @vitest-environment node
import {beforeEach,expect,it,vi} from "vitest";
import sharp from "sharp";
import {alterarFotoPerfil} from "@/app/_actions/perfil-completo";
import {createClient} from "@/lib/supabase/server";
vi.mock("@/lib/supabase/server",()=>({createClient:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
const rpc=vi.fn();
const remover=vi.fn();
const upload=vi.fn();
beforeEach(()=>{rpc.mockReset();remover.mockReset();upload.mockReset();});
async function executar(erro:{code?:string;message:string}) {
  const perfil={id:"10000000-0000-0000-0000-000000000001",tipo:"ciclista",nome:"Ana Silva",telefone:"81999990000",oficina:null};
  const db={auth:{getUser:async()=>({data:{user:{id:perfil.id}},error:null})},
    from:(tabela:string)=>({select:()=>({eq:()=>({single:async()=>({data:perfil,error:null}),maybeSingle:async()=>({data:tabela==="perfil_privado"?{foto_caminho:null}:null,error:null})})})}),
    rpc,storage:{from:()=>({upload,remove:remover})}};
  vi.mocked(createClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createClient>>);
  upload.mockResolvedValue({data:{path:"arquivo"},error:null});
  remover.mockResolvedValue({data:[],error:null});
  rpc.mockResolvedValue({data:null,error:erro});
  const png=await sharp({create:{width:2,height:2,channels:3,background:"#ffffff"}}).png().toBuffer();
  const form=new FormData();form.set("destino","avatar");form.set("arquivo",new File([new Uint8Array(png)],"nome-original.png",{type:"image/png"}));
  return alterarFotoPerfil(form);
}
it("falha SQL confirmada limpa o objeto novo sem tocar em foto anterior",async()=>{
  expect((await executar({code:"23514",message:"constraint"})).ok).toBe(false);
  expect(remover).toHaveBeenCalledTimes(1);
  expect(remover).toHaveBeenCalledWith([expect.stringMatching(/^10000000-0000-0000-0000-000000000001\/avatar\/[0-9a-f-]+\.webp$/)]);
});
it("falha de transporte incerta não apaga objeto que pode estar referenciado",async()=>{
  expect((await executar({message:"fetch failed"})).ok).toBe(false);
  expect(remover).not.toHaveBeenCalled();
});
