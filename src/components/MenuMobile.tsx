"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function MenuMobile({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function fecharAoSair(event: Event) {
      const elemento = menu.current;
      if (elemento?.open && event.target instanceof Node && !elemento.contains(event.target)) {
        elemento.open = false;
      }
    }

    // O toque fora não depende de summary/links receberem foco no Safari.
    document.addEventListener("pointerdown", fecharAoSair, true);
    document.addEventListener("focusin", fecharAoSair);
    return () => {
      document.removeEventListener("pointerdown", fecharAoSair, true);
      document.removeEventListener("focusin", fecharAoSair);
    };
  }, []);

  return (
    <details
      ref={menu}
      className="group relative ml-auto shrink-0 lg:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a") && menu.current) {
          menu.current.open = false;
        }
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <svg className="size-5 group-open:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg className="hidden size-5 group-open:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="m6 6 12 12M6 18 18 6" />
        </svg>
        Menu
      </summary>
      <div className="absolute top-full right-0 z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-3 shadow-xl">
        {children}
      </div>
    </details>
  );
}
