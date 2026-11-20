import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { LegalLinks } from "./LegalLinks";
import { DATA_DOCUMENTOS } from "@/lib/legal";

export function DocumentoLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  const responsavel = process.env.SOS_BIKES_CONTROLLER_NAME?.trim();
  const email = process.env.SOS_BIKES_PRIVACY_EMAIL?.trim();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:py-12">
      <Logo />
      <div><h1 className="font-display text-3xl font-bold">{titulo}</h1><p className="mt-2 text-sm text-subtle">Atualizado em {DATA_DOCUMENTOS}</p></div>
      {(!responsavel || !email) && <p role="status" className="rounded-xl border border-warn/20 bg-warn-soft p-4 text-sm leading-relaxed text-warn">Documento em revisão. A identificação do responsável e o canal de privacidade precisam ser definidos antes da operação com dados reais.</p>}
      <div className="flex flex-col gap-6 text-[15px] leading-relaxed [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1 [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2">{children}</div>
      <section className="rounded-2xl border border-line bg-white p-5 text-sm leading-relaxed">
        <h2 className="font-semibold">Responsável e contato</h2>
        <p className="mt-2">Responsável pelo tratamento: {responsavel || "identificação pendente de definição pela equipe do projeto"}.</p>
        <p className="mt-2">Canal para dúvidas e solicitações de privacidade: {email ? <a href={`mailto:${email}`} className="break-all font-semibold text-brand underline">{email}</a> : "e-mail ainda não informado pela equipe do projeto"}.</p>
      </section>
      <LegalLinks />
      <Link href="/" className="flex min-h-11 w-fit items-center rounded-lg text-sm font-semibold text-brand hover:underline">Voltar ao início</Link>
    </main>
  );
}
