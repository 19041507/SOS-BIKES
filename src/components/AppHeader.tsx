import Link from "next/link";
import { Logo } from "./Logo";

type NavLink = { href: string; label: string; active?: boolean };

type AppHeaderProps = {
  links: NavLink[];
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
        <nav aria-label="Principal" className="flex flex-auto flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={
                link.active
                  ? "rounded-lg bg-brand-soft px-3.5 py-2.5 text-[15px] font-semibold text-brand"
                  : "rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-surface"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
            {user.initials}
          </span>
          <span className="text-[15px] font-medium">{user.name}</span>
          <Link
            href="/"
            className="ml-2 rounded-lg px-3 py-2 text-sm font-semibold text-subtle hover:bg-surface hover:text-ink"
          >
            Sair
          </Link>
        </div>
      </div>
    </header>
  );
}
