import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { VelvetCard } from "@/components/VelvetCard";
import { Button } from "@/components/ui/button";
import { Users, TicketCheck, UserPlus, Repeat, QrCode, Loader2, ScanLine, Gift, Save } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Venue = { id: string; name: string; slug: string };

type Stats = {
  totalCustomers: number;
  totalVisits: number;
  newCustomers: number;
  returning: number;
  redeemed: number;
  top: { name: string | null; phone: string; total_visits: number }[];
};

const Dashboard = () => {
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [savingBenefit, setSavingBenefit] = useState(false);

  useEffect(() => { (async () => loadAll())(); }, [user?.id]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    const { data: venues } = await supabase.from("venues").select("id,name,slug").eq("owner_id", user.id).limit(1);
    const v = venues?.[0] ?? null;
    setVenue(v);
    if (v) await loadStats(v.id);
    setLoading(false);
  }

  async function loadStats(venueId: string) {
    const [{ count: totalCustomers }, { count: totalVisits }, { count: redeemed }, { data: top }] = await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("venue_id", venueId),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("venue_id", venueId),
      supabase.from("codes").select("id", { count: "exact", head: true }).eq("venue_id", venueId).eq("status", "redeemed"),
      supabase.from("customers").select("name,phone,total_visits").eq("venue_id", venueId).order("total_visits", { ascending: false }).limit(10),
    ]);
    const { count: returning } = await supabase
      .from("customers").select("id", { count: "exact", head: true })
      .eq("venue_id", venueId).gt("total_visits", 1);

    setStats({
      totalCustomers: totalCustomers ?? 0,
      totalVisits: totalVisits ?? 0,
      newCustomers: (totalCustomers ?? 0) - (returning ?? 0),
      returning: returning ?? 0,
      redeemed: redeemed ?? 0,
      top: top ?? [],
    });
  }

  async function createDefaultVenue() {
    if (!user) return;
    setCreating(true);
    const slug = `venue-${user.id.slice(0, 8)}`;
    const { data, error } = await supabase.from("venues").insert({
      owner_id: user.id,
      name: "My Nightclub",
      slug,
    }).select("id,name,slug").single();
    setCreating(false);
    if (error) return;
    setVenue(data);
    await loadStats(data.id);
  }

  const checkinUrl = venue ? `${window.location.origin}/c/${venue.slug}` : "";

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Tonight's pulse.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-primary" /></div>
        ) : !venue ? (
          <VelvetCard className="p-10 text-center max-w-md mx-auto">
            <h2 className="font-serif text-2xl mb-2">Create your venue</h2>
            <p className="text-sm text-muted-foreground mb-6">One nightclub per account for now. You can rename it after.</p>
            <Button variant="gold" size="lg" onClick={createDefaultVenue} disabled={creating}>
              {creating ? <Loader2 className="animate-spin" /> : "Create venue"}
            </Button>
          </VelvetCard>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Customers" value={stats?.totalCustomers ?? 0} />
              <StatCard icon={UserPlus} label="New" value={stats?.newCustomers ?? 0} />
              <StatCard icon={Repeat} label="Returning" value={stats?.returning ?? 0} />
              <StatCard icon={TicketCheck} label="Redemptions" value={stats?.redeemed ?? 0} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* QR */}
              <VelvetCard className="p-6 lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode size={18} className="text-primary" />
                  <h3 className="font-serif text-xl">Your QR</h3>
                </div>
                <div className="bg-background p-4 rounded-lg flex items-center justify-center mb-4">
                  <QRCodeSVG value={checkinUrl} size={180} bgColor="transparent" fgColor="hsl(43 65% 53%)" level="M" />
                </div>
                <div className="text-xs text-muted-foreground break-all bg-secondary/40 p-2 rounded mb-3">{checkinUrl}</div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/c/${venue.slug}`} target="_blank">Open check-in page</Link>
                </Button>
              </VelvetCard>

              {/* Top customers */}
              <VelvetCard className="p-6 lg:col-span-2">
                <h3 className="font-serif text-xl mb-4">Top 10 by visits</h3>
                {stats?.top.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No check-ins yet. Share your QR to get started.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {stats?.top.map((c, i) => (
                      <div key={c.phone} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-serif text-lg w-6">{i + 1}</span>
                          <div>
                            <div className="font-medium text-sm">{c.name ?? "Anonymous"}</div>
                            <div className="text-xs text-muted-foreground">{c.phone}</div>
                          </div>
                        </div>
                        <div className="text-sm tabular-nums text-gold">{c.total_visits}</div>
                      </div>
                    ))}
                  </div>
                )}
              </VelvetCard>
            </div>

            <div className="mt-6">
              <Button asChild variant="gold" size="lg">
                <Link to="/admin/validator"><ScanLine size={16} /> Go to Validator</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <VelvetCard className="p-5">
    <Icon className="text-primary mb-3" size={18} />
    <div className="text-3xl font-serif tabular-nums">{value}</div>
    <div className="text-xs tracking-wider-luxe uppercase text-muted-foreground mt-1">{label}</div>
  </VelvetCard>
);

export default Dashboard;
