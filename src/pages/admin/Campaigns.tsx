import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { VelvetCard } from "@/components/VelvetCard";
import { Button } from "@/components/ui/button";
import { Download, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildWaUrl } from "@/lib/utils";

const DEFAULT_MSG = "Hoy tenemos evento especial 🎉 2x1 hasta las 11PM";

const Campaigns = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [phones, setPhones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(DEFAULT_MSG);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: venues } = await supabase.from("venues").select("id").eq("owner_id", user.id).limit(1);
      const venueId = venues?.[0]?.id;
      if (!venueId) { setLoading(false); return; }
      const { data } = await supabase.from("customers").select("phone").eq("venue_id", venueId);
      setPhones((data ?? []).map((c) => c.phone));
      setLoading(false);
    })();
  }, [user?.id]);

  const exportCsv = () => {
    const csv = "phone\n" + phones.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(t("campaigns.exportedNums", { count: phones.length }));
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(phones.join("\n"));
    toast.success(t("campaigns.copied"));
  };

  const previewLink = buildWaUrl(msg);

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-8 max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl mb-2">{t("campaigns.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("campaigns.subtitle")}</p>

        <VelvetCard className="p-6 mb-6">
          <h3 className="font-serif text-xl mb-4">{t("campaigns.audience")}</h3>
          {loading ? (
            <Loader2 className="animate-spin text-primary" />
          ) : (
            <>
              <div className="text-3xl font-serif text-gold tabular-nums">{phones.length}</div>
              <div className="text-xs tracking-luxe uppercase text-muted-foreground mb-5">{t("campaigns.phoneNumbers")}</div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={exportCsv} disabled={!phones.length}>
                  <Download size={14} /> {t("campaigns.exportCsv")}
                </Button>
                <Button variant="ghost" onClick={copyAll} disabled={!phones.length}>{t("campaigns.copyNumbers")}</Button>
              </div>
            </>
          )}
        </VelvetCard>

        <VelvetCard className="p-6">
          <h3 className="font-serif text-xl mb-4">{t("campaigns.message")}</h3>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary mb-5"
          />
          <a href={previewLink} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="lg" className="w-full">
              <MessageCircle size={16} /> {t("campaigns.previewWa")}
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            {t("campaigns.tip")}
            <code className="block mt-2 bg-secondary/50 p-2 rounded text-[11px] break-all">
              https://wa.me/[PHONE]?text={encodeURIComponent(msg)}
            </code>
          </p>
        </VelvetCard>
      </div>
    </AdminLayout>
  );
};

export default Campaigns;
