"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LinkDeNavegacao = {
  href: string;
  label: string;
  /** Só fica ativo na rota exata (ex.: a página inicial da área). */
  exato?: boolean;
};

export function NavPrincipal({ links, className = "flex-auto flex-wrap gap-1" }: { links: LinkDeNavegacao[]; className?: string }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Principal" className={`flex ${className}`}>
      {links.map((link) => {
        const ativo = link.exato ? caminho === link.href : caminho === link.href || caminho.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={
              ativo
                ? "rounded-lg bg-brand-soft px-3.5 py-2.5 text-[15px] font-semibold text-brand"
                : "rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-surface"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
