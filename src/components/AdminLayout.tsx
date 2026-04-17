import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ScanLine, Megaphone, Settings, LogOut, Menu, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const nav = [
    { to: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/admin/validator", label: t("nav.validator"), icon: ScanLine },
    { to: "/admin/customers", label: t("nav.customers"), icon: Users },
    { to: "/admin/campaigns", label: t("nav.campaigns"), icon: Megaphone },
    { to: "/admin/settings", label: t("nav.settings"), icon: Settings },
  ];

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform lg:relative lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between lg:justify-start">
          <Link to="/admin"><Brand label="Velvet" /></Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="px-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <n.icon size={16} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
          <div className="text-xs text-muted-foreground truncate">{session.user.email}</div>
          <LanguageToggle className="w-full justify-start" />
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut size={14} /> {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
        <Brand label="Velvet" />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button onClick={() => setOpen(true)} className="text-foreground"><Menu /></button>
        </div>
      </header>

      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 min-h-dvh overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
};
