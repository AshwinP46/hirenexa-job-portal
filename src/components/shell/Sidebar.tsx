import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { GraduationCap, Building2, ShieldCheck } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  search?: Record<string, any>;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

interface Props {
  brand: string;
  tagline: string;
  brandIcon: "student" | "recruiter" | "admin";
  items: NavItem[];
  cta?: { title: string; subtitle: string; button: string; gradient?: string };
}

const brandIcons = {
  student: GraduationCap,
  recruiter: Building2,
  admin: ShieldCheck,
};

export function Sidebar({ brand, tagline, brandIcon, items, cta }: Props) {
  const location = useRouterState({ select: (r) => r.location });
  const BrandIcon = brandIcons[brandIcon];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1 shadow-soft border border-white/10 overflow-hidden shrink-0">
          <img src="/logo-icon.png" alt="HireNexa Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{brand}</p>
          <p className="text-[11px] text-muted-foreground">{tagline}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const currentTab = (location.search as any)?.tab;
          const itemTab = item.search?.tab;
          const active = item.search
            ? location.pathname === item.url && (currentTab === itemTab || (!currentTab && itemTab === "overview"))
            : location.pathname === item.url;
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.url}
              search={item.search}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && !active && (
                <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {cta && (
        <div className={`m-3 rounded-xl p-4 ${cta.gradient ?? "gradient-accent"} text-primary-foreground shadow-soft`}>
          <p className="text-xs opacity-90">{cta.title}</p>
          <p className="mt-1 text-sm font-semibold">{cta.subtitle}</p>
          <button className="mt-3 w-full rounded-lg bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-medium hover:bg-white/25 transition">
            {cta.button}
          </button>
        </div>
      )}
    </aside>
  );
}
