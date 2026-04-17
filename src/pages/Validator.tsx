import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VelvetCard } from "@/components/VelvetCard";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";

type CheckResult =
  | { state: "valid"; codeId: string; benefit: string; name: string | null; venueId: string }
  | { state: "redeemed"; benefit: string; name: string | null }
  | { state: "invalid" };

const Validator = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => { setCode(""); setResult(null); setDone(false); };

  const onValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setDone(false);
    const { data, error } = await supabase.rpc("validate_code", { _code: code.trim() });
    setChecking(false);
    if (error) { toast.error(error.message); return; }
    if (!data || data.length === 0) {
      setResult({ state: "invalid" });
    } else {
      const r = data[0];
      if (r.status === "redeemed") {
        setResult({ state: "redeemed", benefit: r.benefit, name: r.customer_name });
      } else {
        setResult({ state: "valid", codeId: r.code_id, benefit: r.benefit, name: r.customer_name, venueId: r.venue_id });
      }
    }
  };

  const onRedeem = async () => {
    if (!result || result.state !== "valid") return;
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_code", { _code: code.trim() });
    setRedeeming(false);
    if (error) { toast.error(error.message); return; }
    const r = data?.[0];
    if (r?.success) {
      setDone(true);
      toast.success(t("validator.redeemed"));
    } else {
      toast.error(r?.message ?? t("validator.failed"));
    }
  };

  return (
    <AdminLayout>
      <AmberBackdrop />
      <div className="max-w-xl mx-auto w-full px-4 py-8">
        <h1 className="font-serif text-4xl mb-2">{t("validator.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("validator.subtitle")}</p>

        <VelvetCard className="p-6 sm:p-8">
          <form onSubmit={onValidate} className="space-y-6">
            <div>
              <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-3">{t("validator.enterCode")}</label>
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); setDone(false); }}
                placeholder="CLUB-0000"
                className="w-full bg-background/60 border border-border focus:border-primary outline-none rounded-lg px-4 py-5 text-3xl sm:text-4xl text-center font-serif tabular-nums tracking-widest text-gold uppercase transition-colors"
              />
            </div>
            <Button type="submit" variant="gold" size="xl" className="w-full" disabled={checking || !code.trim()}>
              {checking ? <Loader2 className="animate-spin" /> : t("validator.validate")}
            </Button>
          </form>
        </VelvetCard>

        {/* RESULT */}
        {result && (
          <div className="mt-6 animate-fade-up">
            {result.state === "valid" && !done && (
              <VelvetCard className="p-6 sm:p-8 ring-success/40 border-success/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-12 rounded-full bg-success/15 flex items-center justify-center ring-1 ring-success/40">
                    <CheckCircle2 className="text-success" size={26} />
                  </div>
                  <div>
                    <div className="text-success text-xs tracking-luxe uppercase">{t("validator.valid")}</div>
                    <div className="font-serif text-2xl">{result.name ?? t("validator.guest")}</div>
                  </div>
                </div>
                <div className="rounded-lg bg-background/60 p-4 mb-6 text-sm text-foreground/90">
                  {result.benefit}
                </div>
                <div className="flex gap-3">
                  <Button variant="success" size="lg" className="flex-1" onClick={onRedeem} disabled={redeeming}>
                    {redeeming ? <Loader2 className="animate-spin" /> : t("validator.markRedeemed")}
                  </Button>
                  <Button variant="ghost" size="lg" onClick={reset}>{t("common.cancel")}</Button>
                </div>
              </VelvetCard>
            )}

            {done && (
              <VelvetCard className="p-8 text-center border-success/30">
                <CheckCircle2 className="text-success mx-auto mb-3" size={48} />
                <div className="font-serif text-3xl mb-2">{t("validator.redeemed")}</div>
                <p className="text-sm text-muted-foreground mb-6">{t("validator.enjoyNight")}</p>
                <Button variant="gold" size="lg" onClick={reset} className="w-full">{t("validator.nextCode")}</Button>
              </VelvetCard>
            )}

            {result.state === "redeemed" && (
              <VelvetCard className="p-6 sm:p-8 border-warning/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 rounded-full bg-warning/15 flex items-center justify-center ring-1 ring-warning/40">
                    <AlertTriangle className="text-warning" size={26} />
                  </div>
                  <div>
                    <div className="text-warning text-xs tracking-luxe uppercase">{t("validator.alreadyRedeemed")}</div>
                    <div className="font-serif text-2xl">{result.name ?? t("validator.guest")}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{t("validator.alreadyUsed")}</p>
                <Button variant="outline" size="lg" onClick={reset} className="w-full">{t("validator.tryAnother")}</Button>
              </VelvetCard>
            )}

            {result.state === "invalid" && (
              <VelvetCard className="p-6 sm:p-8 border-destructive/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-12 rounded-full bg-destructive/15 flex items-center justify-center ring-1 ring-destructive/40">
                    <XCircle className="text-destructive" size={26} />
                  </div>
                  <div>
                    <div className="text-destructive text-xs tracking-luxe uppercase">{t("validator.invalidCode")}</div>
                    <div className="font-serif text-2xl">{t("validator.notFound")}</div>
                  </div>
                </div>
                <Button variant="outline" size="lg" onClick={reset} className="w-full">{t("validator.tryAgain")}</Button>
              </VelvetCard>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Validator;
