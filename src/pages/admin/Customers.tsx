import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { VelvetCard } from "@/components/VelvetCard";
import { Loader2, Search } from "lucide-react";

type Customer = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  total_visits: number;
  last_visit_at: string | null;
  created_at: string;
};

const Customers = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: venues } = await supabase.from("venues").select("id").eq("owner_id", user.id).limit(1);
      const venueId = venues?.[0]?.id;
      if (!venueId) { setLoading(false); return; }
      const { data } = await supabase.from("customers").select("*").eq("venue_id", venueId).order("last_visit_at", { ascending: false, nullsFirst: false }).limit(500);
      setList(data ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((c) => c.phone.toLowerCase().includes(t) || (c.name ?? "").toLowerCase().includes(t));
  }, [list, q]);

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl mb-2">Customers</h1>
        <p className="text-muted-foreground text-sm mb-6">{list.length} total · ordered by last visit</p>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search phone or name…"
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <VelvetCard>
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] tracking-luxe uppercase text-muted-foreground">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4 hidden md:table-cell">Email</th>
                    <th className="text-right p-4">Visits</th>
                    <th className="text-right p-4 hidden sm:table-cell">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                      <td className="p-4 font-medium">{c.name ?? <span className="text-muted-foreground italic">Anonymous</span>}</td>
                      <td className="p-4 tabular-nums text-muted-foreground">{c.phone}</td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="p-4 text-right tabular-nums text-gold">{c.total_visits}</td>
                      <td className="p-4 text-right hidden sm:table-cell text-muted-foreground text-xs">
                        {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </VelvetCard>
      </div>
    </AdminLayout>
  );
};

export default Customers;
