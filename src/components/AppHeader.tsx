import { sair } from "@/app/_actions/auth";
import { Logo } from "./Logo";
import { NavPrincipal, type LinkDeNavegacao } from "./NavPrincipal";

type AppHeaderProps = {
  links: LinkDeNavegacao[];
  user: { initials: string; name: string };
  badge?: string;
};

export function AppHeader({ links, user, badge }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Logo />
          {badge && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
        </div>
        <NavPrincipal links={links} />
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
            {user.initials}
          </span>
          <span className="text-[15px] font-medium">{user.name}</span>
          <form action={sair}>
            <button
              type="submit"
              className="ml-2 rounded-lg px-3 py-2 text-sm font-semibold text-subtle hover:bg-surface hover:text-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
