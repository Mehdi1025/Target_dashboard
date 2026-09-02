"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Coins,
  Crosshair,
  LayoutGrid,
  LogOut,
  Radio,
  Shield,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { signOutAction } from "@/app/actions/admin";
import { RdvCalendarNotice } from "@/components/rdv-calendar-notice";
import { ToastStack } from "@/components/ui/toast-stack";
import { ToastProvider } from "@/components/toast-provider";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database.types";

type DashboardShellProps = {
  children: React.ReactNode;
  profile: ProfileRow;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isActive: (pathname: string) => boolean;
};

const PROSPECTEUR_NAV: NavItem[] = [
  {
    href: "/",
    label: "Pipeline",
    icon: LayoutGrid,
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/prospects/"),
  },
  {
    href: "/prospecteur/mission",
    label: "Mission",
    icon: Zap,
    isActive: (pathname) => pathname.startsWith("/prospecteur/mission"),
  },
  {
    href: "/prospecteur/briefing",
    label: "Briefing",
    icon: BookOpen,
    isActive: (pathname) => pathname.startsWith("/prospecteur/briefing"),
  },
  {
    href: "/prospecteur",
    label: "Mes stats",
    icon: BarChart3,
    isActive: (pathname) => pathname === "/prospecteur",
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Administration",
    icon: Shield,
    isActive: (pathname) =>
      pathname === "/admin",
  },
  {
    href: "/admin/controle",
    label: "Contrôle",
    icon: Radio,
    isActive: (pathname) => pathname.startsWith("/admin/controle"),
  },
  {
    href: "/admin/equipe",
    label: "Équipe",
    icon: Users,
    isActive: (pathname) =>
      pathname.startsWith("/admin/equipe") || pathname.startsWith("/admin/prospecteurs"),
  },
  {
    href: "/admin/statistiques",
    label: "Statistiques",
    icon: BarChart3,
    isActive: (pathname) => pathname.startsWith("/admin/statistiques"),
  },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: Coins,
    isActive: (pathname) => pathname.startsWith("/admin/finance"),
  },
];

function getHeaderLabel(pathname: string, isAdmin: boolean) {
  if (isAdmin) {
    if (pathname.startsWith("/admin/statistiques")) {
      return "Admin · Statistiques";
    }
    if (pathname.startsWith("/admin/finance")) {
      return "Admin · Money Command";
    }
    if (pathname.startsWith("/admin/controle")) {
      return "Admin · Tour de Contrôle";
    }
    if (pathname.startsWith("/admin/equipe")) {
      return "Admin · Team Pulse";
    }
    if (pathname.startsWith("/admin/prospecteurs/")) {
      return "Admin · Fiche prospecteur";
    }
    if (pathname.startsWith("/admin")) {
      return "Admin · Centre de commande";
    }
  }

  if (pathname.startsWith("/prospects/")) {
    return "Mission Control · Fiche prospect";
  }

  const labels: Record<string, string> = {
    "/": "Mission Control · Pipeline",
    "/prospecteur": "Mission Control · Mes stats",
    "/prospecteur/mission": "Mission Control · Mission Queue",
    "/prospecteur/briefing": "Mission Control · Salle de Briefing",
  };

  if (pathname.startsWith("/prospecteur/briefing")) {
    return labels["/prospecteur/briefing"];
  }

  if (pathname.startsWith("/prospecteur/mission")) {
    return labels["/prospecteur/mission"];
  }

  return labels[pathname] ?? "Mission Control";
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname();
  const displayName = getProfileDisplayName(profile);
  const isAdmin = profile.role === "admin";
  const navItems = isAdmin ? ADMIN_NAV : PROSPECTEUR_NAV;
  const homeHref = isAdmin ? "/admin" : "/";

  return (
    <ToastProvider>
      <div className={cn("dashboard-mesh min-h-full", isAdmin && "admin-theme")}>
      <div className="mx-auto flex min-h-full w-full max-w-[1600px]">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center border-r py-6 backdrop-blur-xl lg:flex",
            isAdmin
              ? "border-amber-500/20 bg-amber-500/[0.03]"
              : "border-border/60 bg-white/40"
          )}
        >
          <Link
            href={homeHref}
            className={cn(
              "mb-10 flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg transition-transform hover:scale-105",
              isAdmin
                ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
                : "bg-primary shadow-primary/25"
            )}
            aria-label="Target OS"
          >
            <Crosshair className="size-5" strokeWidth={2.2} />
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);

              return (
                <Link
                  key={item.label}
                  href={item.disabled ? "#" : item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex size-11 items-center justify-center rounded-xl transition-all duration-200",
                    active
                      ? isAdmin
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25"
                        : "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-white/80 hover:text-foreground",
                    item.disabled && "pointer-events-none opacity-40"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-md group-hover:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex w-full flex-col items-center gap-2 px-2">
            <div
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center",
                isAdmin
                  ? "border-amber-500/25 bg-amber-500/[0.06]"
                  : "border-border/60 bg-white/60"
              )}
              title={profile.email}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-[11px] font-bold",
                  isAdmin ? "bg-amber-500/15 text-amber-800" : "bg-primary/10 text-primary"
                )}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <p className="max-w-full truncate px-1 text-[10px] font-medium leading-tight text-foreground">
                {displayName}
              </p>
              {isAdmin ? (
                <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-700/70">
                  Admin
                </p>
              ) : null}
            </div>
            <form action={signOutAction} className="w-full">
              <button
                type="submit"
                className="flex size-11 w-full items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut className="size-5" strokeWidth={1.8} />
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "sticky top-0 z-40 border-b backdrop-blur-xl",
              isAdmin
                ? "border-amber-500/15 bg-amber-50/50"
                : "border-border/50 bg-white/60"
            )}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-primary-foreground",
                    isAdmin ? "bg-amber-600" : "bg-primary"
                  )}
                >
                  <Crosshair className="size-4" />
                </div>
                <span className="text-sm font-bold tracking-tight">
                  {isAdmin ? "Target OS Admin" : "Target OS"}
                </span>
              </div>

              <div className="hidden lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {getHeaderLabel(pathname, isAdmin)}
                </p>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                {navItems.filter((item) => !item.disabled).map((item) => {
                  const Icon = item.icon;
                  const active = item.isActive(pathname);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        active
                          ? isAdmin
                            ? "bg-amber-600 text-white"
                            : "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className="size-4" />
                    </Link>
                  );
                })}
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1 pl-2 pr-3 shadow-sm",
                    isAdmin
                      ? "border-amber-500/25 bg-amber-50/80"
                      : "border-border/70 bg-white/80"
                  )}
                >
                  <span className="relative flex size-2">
                    <span
                      className={cn(
                        "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                        isAdmin ? "bg-amber-400/60" : "bg-emerald-400/60"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex size-2 rounded-full",
                        isAdmin ? "bg-amber-500" : "bg-emerald-500"
                      )}
                    />
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
                    {isAdmin ? "Mode administration" : "Système actif"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {!isAdmin ? <RdvCalendarNotice /> : null}

          <main className="flex-1 px-5 py-8 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
      </div>
      <ToastStack />
    </ToastProvider>
  );
}
