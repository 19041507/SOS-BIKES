import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/auth";

/**
 * Manda quem já está logado para a própria área.
 * Lê a sessão, então deve ficar num <Suspense> separado para o resto da página continuar estático.
 */
export async function RedirecionarSeLogado() {
  const perfil = await perfilAtual();
  if (perfil) redirect(`/${perfil.tipo}`);
  return null;
}
