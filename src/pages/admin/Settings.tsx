import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { VelvetCard } from "@/components/VelvetCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("venues").select("*").eq("owner_id", user.id).maybeSingle();
      if (data) {
        setVenueId(data.id);
        setName(data.name); setSlug(data.slug);
        setHeadline(data.benefit_headline);
        setDescription(data.benefit_description);
        setPrefix(data.code_prefix);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!venueId) return;
    setSaving(true);
    const { error } = await supabase.from("venues").update({
      name, slug, benefit_headline: headline, benefit_description: description, code_prefix: prefix.toUpperCase(),
    }).eq("id", venueId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.saved"));
  };

  if (loading) return <AdminLayout><div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div></AdminLayout>;

  if (!venueId) return <AdminLayout><div className="p-8">{t("settings.createFirst")}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-8 max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl mb-8">{t("settings.title")}</h1>
        <VelvetCard className="p-6 sm:p-8 space-y-5">
          <Field label={t("settings.venueName")} value={name} onChange={setName} />
          <Field label={t("settings.slug")} value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} hint={t("settings.slugHint")} />
          <Field label={t("settings.benefitHeadline")} value={headline} onChange={setHeadline} />
          <Field label={t("settings.benefitDesc")} value={description} onChange={setDescription} multiline />
          <Field label={t("settings.codePrefix")} value={prefix} onChange={(v) => setPrefix(v.toUpperCase().slice(0, 8))} hint={t("settings.codePrefixHint")} />
          <Button variant="gold" size="lg" onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="animate-spin" /> : t("settings.saveChanges")}
          </Button>
        </VelvetCard>
      </div>
    </AdminLayout>
  );
};

const Field = ({ label, value, onChange, hint, multiline }: { label: string; value: string; onChange: (v: string) => void; hint?: string; multiline?: boolean }) => (
  <div>
    <label className="block text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">{label}</label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary" />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary" />
    )}
    {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

export default Settings;
