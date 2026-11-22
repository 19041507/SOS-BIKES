import "server-only";
import webpush from "web-push";
import { clienteDeServico, resumoDaChave, variavel } from "@/lib/supabase/servico";

export type Aviso = {
  para: string;
  titulo: string;
  texto: string;
  url: string;
  tag: string;
  /** Fica na tela até a pessoa tocar (chamado novo). */
  insistente?: boolean;
};

export type ResultadoDoEnvio = {
  para: string;
  inscricoes: number;
  enviados: number;
  erros: { status: number | null; mensagem: string }[];
};

/**
 * Aparelhos inscritos de uma pessoa. Separado para a rota já buscar enquanto monta o aviso;
 * é `async` de propósito: a consulta do supabase-js só começa ao ser aguardada.
 */
export async function buscarInscricoes(perfilId: string) {
  return await clienteDeServico().from("inscricoes_push").select("id, endpoint, p256dh, auth").eq("perfil_id", perfilId);
}

/**
 * Envia o aviso para todos os aparelhos inscritos de `aviso.para` e devolve o que aconteceu
 * em cada um (para aparecer no log do webhook). Apaga inscrições que o navegador cancelou.
 * `inscricoesJaPedidas` evita esperar a consulta de novo quando ela já foi disparada antes.
 */
export async function enviarAviso(
  aviso: Aviso,
  inscricoesJaPedidas?: ReturnType<typeof buscarInscricoes>,
): Promise<ResultadoDoEnvio> {
  const resultado: ResultadoDoEnvio = { para: aviso.para, inscricoes: 0, enviados: 0, erros: [] };
  const publica = variavel("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const privada = variavel("VAPID_PRIVATE_KEY");
  if (!publica || !privada) {
    resultado.erros.push({ status: null, mensagem: "Chaves VAPID não configuradas no servidor." });
    return resultado;
  }

  const supabase = clienteDeServico();
  const { data: inscricoes, error } = await (inscricoesJaPedidas ?? buscarInscricoes(aviso.para));
  if (error) {
    resultado.erros.push({ status: null, mensagem: `Erro ao ler inscrições: ${error.message} (chave usada: ${resumoDaChave()})` });
    return resultado;
  }
  resultado.inscricoes = inscricoes?.length ?? 0;
  if (!inscricoes?.length) return resultado;

  // O "subject" do VAPID identifica quem envia para o serviço de push; a URL do site basta.
  webpush.setVapidDetails("https://sos-bikes.vercel.app", publica, privada);
  const corpo = JSON.stringify(aviso);

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
          corpo,
          { TTL: 60 * 10, urgency: "high" },
        );
        resultado.enviados += 1;
      } catch (erro) {
        const { statusCode, body, message } = erro as { statusCode?: number; body?: string; message?: string };
        resultado.erros.push({
          status: statusCode ?? null,
          mensagem: `${new URL(inscricao.endpoint).host}: ${body || message || "erro desconhecido"}`.slice(0, 200),
        });
        console.error("[notificacoes] falha no envio", statusCode, body || message);
        // 404/410: o navegador cancelou a inscrição (trocou de aparelho, limpou os dados).
        if (statusCode === 404 || statusCode === 410) await supabase.from("inscricoes_push").delete().eq("id", inscricao.id);
      }
    }),
  );
  return resultado;
}
