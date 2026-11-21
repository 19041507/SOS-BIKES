import { sair } from "@/app/_actions/auth";
import { Logo } from "./Logo";
import { MenuMobile } from "./MenuMobile";
import { NavPrincipal, type LinkDeNavegacao } from "./NavPrincipal";

type AppHeaderProps = {
  links: LinkDeNavegacao[];
  user: { initials: string; name: string };
  badge?: string;
};

export function AppHeader({ links, user, badge }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <Logo />
          {badge && (
            <span className="hidden rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white lg:inline-flex">
              {badge}
            </span>
          )}
        </div>
        <div className="hidden min-w-0 flex-1 lg:flex">
          <NavPrincipal links={links} />
        </div>
        <div className="hidden min-w-0 max-w-[35%] items-center gap-2 lg:flex">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
            {user.initials}
          </span>
          <span className="truncate text-[15px] font-medium" title={user.name}>{user.name}</span>
          <form action={sair} className="shrink-0">
            <button
              type="submit"
              className="ml-2 rounded-lg px-3 py-2 text-sm font-semibold text-subtle hover:bg-surface hover:text-ink"
            >
              Sair
            </button>
          </form>
        </div>
        <MenuMobile>
          <div className="mb-3 flex items-center gap-3 border-b border-line px-2 pb-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{user.name}</p>
              {badge && <p className="mt-0.5 text-xs text-subtle">{badge}</p>}
            </div>
          </div>
          <NavPrincipal links={links} className="flex-col gap-1" />
          <form action={sair} className="mt-3 border-t border-line pt-3">
            <button type="submit" className="min-h-11 w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-danger hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              Sair
            </button>
          </form>
        </MenuMobile>
      </div>
    </header>
  );
}
