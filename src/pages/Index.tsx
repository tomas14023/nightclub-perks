import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { Brand } from "@/components/Brand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { QrCode, Wine, BarChart3, ShieldCheck } from "lucide-react";

const Index = () => {
  const { t } = useTranslation();

  const features = [
    { icon: QrCode, title: t("landing.f1Title"), text: t("landing.f1Text") },
    { icon: Wine, title: t("landing.f2Title"), text: t("landing.f2Text") },
    { icon: BarChart3, title: t("landing.f3Title"), text: t("landing.f3Text") },
  ];

  return (
    <>
      <AmberBackdrop />
      <main className="min-h-dvh flex flex-col">
        {/* Top bar */}
        <header className="container flex items-center justify-between py-6">
          <Brand label="Velvet" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("nav.staffLogin")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/c/nocturne">{t("nav.demoCheckin")}</Link>
            </Button>
          </nav>
        </header>

        {/* Hero */}
        <section className="container flex-1 flex flex-col items-center justify-center text-center py-20">
          <span className="inline-block text-primary tracking-luxe text-xs uppercase mb-8 animate-fade-up">
            {t("landing.tag")}
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground max-w-4xl text-balance leading-[0.95] animate-fade-up">
            {t("landing.titleA")}<br />
            <span className="text-gold italic">{t("landing.titleB")}</span>
          </h1>
          <p className="mt-8 max-w-xl text-muted-foreground text-lg leading-relaxed animate-fade-up">
            {t("landing.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center animate-fade-up">
            <Button asChild variant="gold" size="lg">
              <Link to="/c/nocturne">{t("landing.tryCheckin")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">{t("landing.openDashboard")}</Link>
            </Button>
          </div>
        </section>

        {/* Feature trio */}
        <section className="container grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 border-y border-border/40 mb-16 rounded-2xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-8 flex flex-col gap-4">
              <f.icon className="text-primary" size={28} />
              <h3 className="font-serif text-2xl">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </section>

        <footer className="container pb-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground tracking-wider-luxe uppercase">
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> {t("landing.builtOn")}</span>
          <span>{t("landing.policy")}</span>
        </footer>
      </main>
    </>
  );
};

export default Index;
