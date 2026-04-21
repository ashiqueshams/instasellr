import { useState, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Copy, ChevronDown, ChevronUp, Link2, MousePointerClick, ShoppingBag, DollarSign } from "lucide-react";

interface Campaign {
  id: string;
  store_id: string;
  influencer_name: string;
  code: string;
  commission_percent: number;
  discount_percent: number;
  is_active: boolean;
  notes: string;
  created_at: string;
}

interface Stats {
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
}

export default function DashboardReferrals() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    influencer_name: "",
    code: "",
    commission_percent: 10,
    discount_percent: 10,
    notes: "",
  });

  useEffect(() => {
    if (!store) return;
    fetchAll();
  }, [store]);

  const fetchAll = async () => {
    if (!store) return;
    setLoading(true);

    const { data: camps } = await (supabase
      .from("referral_campaigns" as any)
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false }) as any);

    const list: Campaign[] = camps || [];
    setCampaigns(list);

    if (list.length > 0) {
      // Bulk fetch click counts
      const { data: clickRows } = await (supabase
        .from("referral_clicks" as any)
        .select("campaign_id")
        .eq("store_id", store.id) as any);

      const clickMap: Record<string, number> = {};
      (clickRows || []).forEach((r: any) => {
        clickMap[r.campaign_id] = (clickMap[r.campaign_id] || 0) + 1;
      });

      // Bulk fetch orders attributed to any of these campaigns
      const { data: orderRows } = await (supabase
        .from("orders")
        .select("amount, referral_campaign_id, referral_commission_amount")
        .eq("store_id", store.id)
        .not("referral_campaign_id", "is", null) as any);

      const statsMap: Record<string, Stats> = {};
      list.forEach((c) => {
        statsMap[c.id] = { clicks: clickMap[c.id] || 0, orders: 0, revenue: 0, commission: 0 };
      });
      (orderRows || []).forEach((o: any) => {
        const s = statsMap[o.referral_campaign_id];
        if (s) {
          s.orders += 1;
          s.revenue += Number(o.amount) || 0;
          s.commission += Number(o.referral_commission_amount) || 0;
        }
      });
      setStats(statsMap);
    }

    setLoading(false);
  };

  const generateCode = () => {
    const base = form.influencer_name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    const suffix = Math.floor(Math.random() * 90 + 10);
    setForm((f) => ({ ...f, code: base ? `${base}${suffix}` : `REF${Date.now().toString().slice(-5)}` }));
  };

  const addCampaign = async () => {
    if (!store) return;
    const name = form.influencer_name.trim();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!name || !code) {
      toast({ title: "Name and code required", variant: "destructive" });
      return;
    }
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      toast({ title: "Code must be 3-32 chars (A-Z, 0-9, _, -)", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await (supabase.from("referral_campaigns" as any).insert({
      store_id: store.id,
      influencer_name: name,
      code,
      commission_percent: Number(form.commission_percent) || 0,
      discount_percent: Number(form.discount_percent) || 0,
      notes: form.notes.trim(),
    }) as any);

    if (error) {
      toast({
        title: "Failed to add",
        description: error.message.includes("duplicate") ? "This code is already in use." : error.message,
        variant: "destructive",
      });
    } else {
      setForm({ influencer_name: "", code: "", commission_percent: 10, discount_percent: 10, notes: "" });
      setShowForm(false);
      await fetchAll();
      toast({ title: "Campaign created" });
    }
    setSaving(false);
  };

  const toggleActive = async (c: Campaign) => {
    await (supabase.from("referral_campaigns" as any).update({ is_active: !c.is_active }).eq("id", c.id) as any);
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign? Click history will also be removed. Existing orders keep their attribution.")) return;
    await (supabase.from("referral_campaigns" as any).delete().eq("id", id) as any);
    setCampaigns((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted" });
  };

  const buildLink = (code: string) =>
    `${window.location.origin}/store/${store?.slug}?ref=${code}`;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(buildLink(code));
    toast({ title: "Link copied!" });
  };

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  // Aggregate totals
  const totals = Object.values(stats).reduce(
    (acc, s) => ({
      clicks: acc.clicks + s.clicks,
      orders: acc.orders + s.orders,
      revenue: acc.revenue + s.revenue,
      commission: acc.commission + s.commission,
    }),
    { clicks: 0, orders: 0, revenue: 0, commission: 0 }
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">Influencer links with commission & customer discounts.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Aggregate stats */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={MousePointerClick} label="Clicks" value={totals.clicks.toString()} />
          <StatCard icon={ShoppingBag} label="Orders" value={totals.orders.toString()} />
          <StatCard icon={DollarSign} label="Revenue" value={`৳${totals.revenue.toFixed(0)}`} />
          <StatCard icon={DollarSign} label="Commission" value={`৳${totals.commission.toFixed(0)}`} />
        </div>
      )}

      {/* New form */}
      {showForm && (
        <div className="bg-card rounded-xl p-5 store-shadow space-y-3 mb-6 animate-fadeUp">
          <p className="font-heading font-semibold text-sm text-foreground">New Referral Campaign</p>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Influencer name</label>
            <input value={form.influencer_name} onChange={(e) => setForm({ ...form, influencer_name: e.target.value })} placeholder="e.g. Ayesha Khan" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Code (used in URL)</label>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="AYESHA10"
                className={inputClass}
              />
              <button onClick={generateCode} type="button" className="h-11 px-3 rounded-lg border border-border text-xs font-body font-medium text-muted-foreground hover:bg-muted shrink-0">Auto</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Commission % (you pay influencer)</label>
              <input type="number" min={0} max={100} value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Customer discount %</label>
              <input type="number" min={0} max={100} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Notes (private)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contact info, deal terms…" className={inputClass} />
          </div>
          <button
            onClick={addCampaign}
            disabled={saving}
            className="h-10 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>
      )}

      {/* List */}
      {campaigns.length === 0 && !showForm ? (
        <div className="text-center text-muted-foreground text-sm py-12">
          No referral campaigns yet. Create your first one to start tracking influencer sales.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const s = stats[c.id] || { clicks: 0, orders: 0, revenue: 0, commission: 0 };
            const isOpen = expanded === c.id;
            const conversion = s.clicks > 0 ? ((s.orders / s.clicks) * 100).toFixed(1) : "—";
            return (
              <div key={c.id} className={`bg-card rounded-xl store-shadow overflow-hidden transition-opacity ${!c.is_active ? "opacity-60" : ""}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-semibold text-sm text-foreground">{c.influencer_name}</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.code}</span>
                      {!c.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Hidden</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.clicks} clicks · {s.orders} orders · ৳{s.revenue.toFixed(0)}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-4">
                    {/* Link */}
                    <div>
                      <p className="text-xs text-muted-foreground font-body mb-1.5">Share link</p>
                      <div className="flex gap-2">
                        <input readOnly value={buildLink(c.code)} className={inputClass + " font-mono text-xs"} />
                        <button onClick={() => copyLink(c.code)} className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shrink-0">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MiniStat label="Clicks" value={s.clicks.toString()} />
                      <MiniStat label="Orders" value={s.orders.toString()} />
                      <MiniStat label="Conversion" value={`${conversion}${s.clicks > 0 ? "%" : ""}`} />
                      <MiniStat label="Revenue" value={`৳${s.revenue.toFixed(0)}`} />
                    </div>

                    {/* Terms */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-body">
                      <div className="rounded-lg bg-background border border-border px-3 py-2">
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-semibold text-foreground mt-0.5">{c.commission_percent}% · ৳{s.commission.toFixed(0)} earned</p>
                      </div>
                      <div className="rounded-lg bg-background border border-border px-3 py-2">
                        <p className="text-muted-foreground">Customer discount</p>
                        <p className="font-semibold text-foreground mt-0.5">{c.discount_percent}% off</p>
                      </div>
                    </div>

                    {c.notes && (
                      <div className="text-xs text-muted-foreground font-body">
                        <span className="font-semibold">Notes: </span>{c.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleActive(c)}
                        className="h-9 px-3 rounded-lg border border-border text-xs font-body font-medium text-muted-foreground hover:bg-muted flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {c.is_active ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="h-9 px-3 rounded-lg border border-border text-xs font-body font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-4 store-shadow">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-body">{label}</span>
      </div>
      <p className="font-heading font-bold text-lg text-foreground">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-body">{label}</p>
      <p className="font-heading font-bold text-sm text-foreground mt-0.5">{value}</p>
    </div>
  );
}
