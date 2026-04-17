import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { VelvetCard } from "@/components/VelvetCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Download, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const { t } = useTranslation();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    if (!user) return;
    setLoading(true);
    const { data: venues } = await supabase.from("venues").select("id").eq("owner_id", user.id).limit(1);
    const venueId = venues?.[0]?.id;
    if (!venueId) { setLoading(false); return; }
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("venue_id", venueId)
      .order("last_visit_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setList(data ?? []);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((c) => c.phone.toLowerCase().includes(t) || (c.name ?? "").toLowerCase().includes(t));
  }, [list, q]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      filtered.forEach((c) => next.delete(c.id));
    } else {
      filtered.forEach((c) => next.add(c.id));
    }
    setSelected(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectedCustomers = useMemo(
    () => list.filter((c) => selected.has(c.id)),
    [list, selected]
  );

  const openEdit = () => {
    const c = selectedCustomers[0];
    if (!c) return;
    setEditForm({ name: c.name ?? "", phone: c.phone, email: c.email ?? "" });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const c = selectedCustomers[0];
    if (!c) return;
    if (!editForm.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    setEditSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        name: editForm.name.trim() || null,
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
      })
      .eq("id", c.id);
    setEditSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Customer updated");
    setEditOpen(false);
    await loadCustomers();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("customers").delete().in("id", ids);
    setDeleting(false);
    setConfirmDelete(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${ids.length} customer${ids.length === 1 ? "" : "s"} deleted`);
    await loadCustomers();
  };

  const handleExport = () => {
    const rows = (selectedCustomers.length > 0 ? selectedCustomers : filtered).map((c) => ({
      Name: c.name ?? "",
      Phone: c.phone,
      Email: c.email ?? "",
      Visits: c.total_visits,
      "Last visit": c.last_visit_at ? new Date(c.last_visit_at).toLocaleString() : "",
      "First seen": new Date(c.created_at).toLocaleString(),
    }));
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `velvet-customers-${stamp}.xlsx`);
    toast.success(`Exported ${rows.length} customer${rows.length === 1 ? "" : "s"}`);
  };

  const selCount = selected.size;

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl mb-2">Customers</h1>
        <p className="text-muted-foreground text-sm mb-6">{list.length} total · ordered by last visit</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phone or name…"
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download /> Export {selCount > 0 ? `(${selCount})` : "all"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openEdit}
              disabled={selCount !== 1}
              title={selCount !== 1 ? "Select exactly one customer to edit" : "Edit customer"}
            >
              <Pencil /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={selCount === 0}
            >
              <Trash2 /> Delete {selCount > 0 ? `(${selCount})` : ""}
            </Button>
          </div>
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
                    <th className="p-4 w-10">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4 hidden md:table-cell">Email</th>
                    <th className="text-right p-4">Visits</th>
                    <th className="text-right p-4 hidden sm:table-cell">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const isSel = selected.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-border/50 hover:bg-secondary/40 transition-colors cursor-pointer ${isSel ? "bg-secondary/60" : ""}`}
                        onClick={() => toggleOne(c.id)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleOne(c.id)}
                            aria-label={`Select ${c.name ?? c.phone}`}
                          />
                        </td>
                        <td className="p-4 font-medium">{c.name ?? <span className="text-muted-foreground italic">Anonymous</span>}</td>
                        <td className="p-4 tabular-nums text-muted-foreground">{c.phone}</td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">{c.email ?? "—"}</td>
                        <td className="p-4 text-right tabular-nums text-gold">{c.total_visits}</td>
                        <td className="p-4 text-right hidden sm:table-cell text-muted-foreground text-xs">
                          {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </VelvetCard>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit customer</DialogTitle>
            <DialogDescription>Update the contact details for this guest.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Anonymous"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={saveEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selCount} customer{selCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected guest{selCount === 1 ? "" : "s"} and their visit history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="animate-spin mr-2" size={16} />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Customers;
