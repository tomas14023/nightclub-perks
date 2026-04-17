import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VelvetCard } from "@/components/VelvetCard";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { Brand } from "@/components/Brand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CheckCircle2, Wine, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildWaUrl } from "@/lib/utils";

type Venue = {
  id: string;
  name: string;
  slug: string;
  benefit_headline: string;
  benefit_description: string;
};

type Result = {
  code: string;
  benefit: string;
  customer_name: string | null;
  venue_name: string;
};

const CustomerCheckin = () => {
  const { slug = "nocturne" } = useParams();
  const { t } = useTranslation();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const schema = z.object({
    phone: z.string().trim().min(6, t("checkin.invalidPhone")).max(20),
    name: z.string().trim().max(100).optional().or(z.literal("")),
    email: z.string().trim().email(t("checkin.invalidEmail")).max(255).optional().or(z.literal("")),
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("id,name,slug,benefit_headline,benefit_description")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error || !data) {
        toast.error(t("checkin.venueNotFound"));
      } else {
        setVenue(data);
      }
      setLoadingVenue(false);
    })();
  }, [slug, t]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ phone, name, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("checkin_customer", {
      _venue_slug: slug,
      _phone: parsed.data.phone,
      _name: parsed.data.name || null,
      _email: parsed.data.email || null,
    });
    setSubmitting(false);
    if (error || !data || data.length === 0) {
      toast.error(error?.message ?? t("checkin.failed"));
      return;
    }
    const r = data[0];
    setResult({
      code: r.code,
      benefit: r.benefit,
      customer_name: r.customer_name,
      venue_name: r.venue_name,
    });
  };

  if (loadingVenue) {
    return (
      <>
        <AmberBackdrop />
        <div className="min-h-dvh flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" />
        </div>
      </>
    );
  }

  if (!venue) {
    return (
      <>
        <AmberBackdrop />
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-serif text-3xl">{t("checkin.venueNotFound")}</h1>
          <Button asChild variant="outline"><Link to="/">{t("checkin.goHome")}</Link></Button>
        </div>
      </>
    );
  }

  // SUCCESS SCREEN
  if (result) {
    const waMsg = `${result.venue_name}: ${t("checkin.youreIn")} ✅\n${t("checkin.yourBenefit")}: ${result.benefit}\n${t("checkin.yourCode")}: ${result.code}\n${t("checkin.showAtBar")}`;
    return (
      <>
        <AmberBackdrop />
        <main className="min-h-dvh flex items-center justify-center p-4">
          <VelvetCard className="w-full max-w-[440px] p-8 sm:p-10 animate-fade-up">
            <div className="flex items-center justify-between mb-8">
              <Brand label={result.venue_name} />
              <LanguageToggle />
            </div>

            <div className="flex flex-col items-center text-center gap-3 mb-8">
              <div className="size-14 rounded-full bg-success/15 flex items-center justify-center ring-1 ring-success/30">
                <CheckCircle2 className="text-success" size={28} />
              </div>
              <h1 className="font-serif text-3xl">{t("checkin.youreIn")}</h1>
              {result.customer_name && (
                <p className="text-muted-foreground text-sm">{t("checkin.welcome", { name: result.customer_name })}</p>
              )}
            </div>

            <div className="rounded-xl bg-background/60 border border-primary/20 p-6 mb-6 text-center">
              <div className="text-[10px] tracking-luxe uppercase text-primary mb-3">{t("checkin.yourBenefit")}</div>
              <p className="font-serif text-xl text-foreground/90">{result.benefit}</p>
            </div>

            <div className="relative rounded-xl bg-gradient-gold p-[2px] mb-6 overflow-hidden">
              <div className="rounded-[10px] bg-card p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-30"
                  style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
                <div className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("checkin.yourCode")}</div>
                <div className="font-serif text-5xl sm:text-6xl text-gold tracking-wider tabular-nums select-all">
                  {result.code}
                </div>
              </div>
            </div>

            <p className="text-center text-xs tracking-wider-luxe uppercase text-muted-foreground mb-6">
              {t("checkin.showAtBar")}
            </p>

            <a
              href={buildWaUrl(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full" size="lg">
                <MessageCircle size={16} /> {t("checkin.sendWa")}
              </Button>
            </a>

            <button
              onClick={() => { setResult(null); setPhone(""); setName(""); setEmail(""); }}
              className="block mx-auto mt-6 text-xs text-muted-foreground hover:text-primary tracking-wider-luxe uppercase transition-colors"
            >
              {t("checkin.checkAnother")}
            </button>
          </VelvetCard>
        </main>
      </>
    );
  }

  // CHECK-IN FORM
  return (
    <>
      <AmberBackdrop />
      <main className="min-h-dvh flex items-center justify-center p-4">
        <VelvetCard className="w-full max-w-[440px] p-8 sm:p-10 animate-fade-up">
          <div className="flex items-center justify-between mb-8">
            <Brand label={venue.name} />
            <LanguageToggle />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-foreground text-balance leading-tight">
              {venue.benefit_headline}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {t("checkin.dropNumber")}
            </p>
          </div>

          <div className="rounded-xl bg-background/40 border border-primary/15 p-4 mb-8 flex items-center gap-3">
            <Wine className="text-primary shrink-0" size={20} />
            <p className="text-sm text-foreground/80">{venue.benefit_description}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("checkin.phone")}</label>
              <input
                type="tel"
                required
                inputMode="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 019 8372"
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-2xl tracking-wide text-foreground placeholder:text-muted-foreground/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("checkin.nameOpt")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base text-foreground placeholder:text-muted-foreground/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("checkin.emailOpt")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base text-foreground placeholder:text-muted-foreground/30 transition-colors"
              />
            </div>

            <Button type="submit" variant="gold" size="xl" className="w-full mt-8" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : t("checkin.getMyCode")}
            </Button>
          </form>

          <p className="text-center text-[10px] tracking-luxe uppercase text-muted-foreground/60 mt-6">
            {t("checkin.policy")}
          </p>
        </VelvetCard>
      </main>
    </>
  );
};

export default CustomerCheckin;
