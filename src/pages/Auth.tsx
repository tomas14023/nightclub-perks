import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VelvetCard } from "@/components/VelvetCard";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { Brand } from "@/components/Brand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const schema = z.object({
    email: z.string().trim().email(t("checkin.invalidEmail")).max(255),
    password: z.string().min(6, "Min 6").max(72),
  });

  useEffect(() => {
    if (!loading && session) navigate("/admin", { replace: true });
  }, [session, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { email: em, password: pw } = parsed.data;
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
      if (error) toast.error(error.message);
      else navigate("/admin");
    } else {
      const { error } = await supabase.auth.signUp({
        email: em,
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else {
        toast.success(t("auth.accountCreated"));
        navigate("/admin");
      }
    }
    setBusy(false);
  };

  return (
    <>
      <AmberBackdrop />
      <main className="min-h-dvh flex items-center justify-center p-4">
        <VelvetCard className="w-full max-w-[420px] p-8 sm:p-10 animate-fade-up">
          <div className="flex items-center justify-between mb-8">
            <Brand label="Velvet · Staff" />
            <LanguageToggle />
          </div>
          <h1 className="font-serif text-3xl text-center mb-2">
            {mode === "signin" ? t("auth.welcomeBack") : t("auth.openVenue")}
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            {mode === "signin" ? t("auth.signinSub") : t("auth.signupSub")}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("auth.email")}</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base"
                placeholder="you@venue.com" autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{t("auth.password")}</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full mt-4" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block mx-auto mt-6 text-xs text-muted-foreground hover:text-primary tracking-wider-luxe uppercase"
          >
            {mode === "signin" ? t("auth.needAccount") : t("auth.haveAccount")}
          </button>

          <Link to="/" className="block text-center mt-4 text-[10px] tracking-luxe uppercase text-muted-foreground/60 hover:text-primary">
            {t("common.backHome")}
          </Link>
        </VelvetCard>
      </main>
    </>
  );
};

export default Auth;
