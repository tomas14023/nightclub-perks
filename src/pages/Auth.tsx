import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VelvetCard } from "@/components/VelvetCard";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) toast.error(error.message);
      else navigate("/admin");
    } else {
      const { error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Account created");
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
          <Brand label="Velvet · Staff" className="mb-8" />
          <h1 className="font-serif text-3xl text-center mb-2">
            {mode === "signin" ? "Welcome back" : "Open your venue"}
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            {mode === "signin"
              ? "Sign in to manage check-ins, validate codes, and view stats."
              : "Create an admin account for your nightclub."}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base"
                placeholder="you@venue.com" autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-3 text-base"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full mt-4" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block mx-auto mt-6 text-xs text-muted-foreground hover:text-primary tracking-wider-luxe uppercase"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>

          <Link to="/" className="block text-center mt-4 text-[10px] tracking-luxe uppercase text-muted-foreground/60 hover:text-primary">
            ← Back home
          </Link>
        </VelvetCard>
      </main>
    </>
  );
};

export default Auth;
