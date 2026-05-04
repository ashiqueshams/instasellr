import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X, User as UserIcon, Phone, MapPin, ShoppingBag, Tag } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

interface Profile {
  id: string;
  customer_psid: string;
  platform: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  lifetime_orders: number;
  lifetime_value: number;
  last_order_at: string | null;
  behavior_tags: string[] | null;
  preferred_categories: string[] | null;
  last_sentiment: string | null;
  last_intent: string | null;
  notes: string | null;
  silent_since: string | null;
  created_at: string;
}

export default function DashboardCustomers() {
  const { store } = useStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "buyers" | "high_value" | "silent">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [convs, setConvs] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (!store) return;
    (async () => {
      const { data } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("store_id", store.id)
        .order("last_order_at", { ascending: false, nullsFirst: false })
        .limit(500);
      setProfiles((data ?? []) as any);
      setLoading(false);
    })();
  }, [store]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (q) {
        const hay = [p.name, p.phone, p.address, p.city, p.customer_psid].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === "buyers" && p.lifetime_orders <= 0) return false;
      if (filter === "high_value" && Number(p.lifetime_value) < 2000) return false;
      if (filter === "silent" && !p.silent_since) return false;
      return true;
    });
  }, [profiles, search, filter]);

  const openDrawer = async (p: Profile) => {
    setSelected(p);
    if (!store) return;
    setDrawerLoading(true);
    const [{ data: ord }, { data: cv }] = await Promise.all([
      supabase
        .from("orders")
        .select("id,amount,status,created_at,order_items,payment_method")
        .eq("store_id", store.id)
        .or(`customer_phone.eq.${p.phone ?? "__none__"},customer_email.eq.${p.customer_psid}@dm.local`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("chatbot_conversations")
        .select("id,platform,source,last_message_at,last_message_preview,sales_stage,status")
        .eq("store_id", store.id)
        .eq("customer_psid", p.customer_psid)
        .order("last_message_at", { ascending: false })
        .limit(10),
    ]);
    setOrders(ord ?? []);
    setConvs(cv ?? []);
    setDrawerLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Profiles built from chats & orders. {profiles.length} total.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buyers">Buyers</TabsTrigger>
            <TabsTrigger value="high_value">High value</TabsTrigger>
            <TabsTrigger value="silent">Silent</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No customers match.</CardContent></Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
            <div className="col-span-4">Customer</div>
            <div className="col-span-3 hidden sm:block">Phone / Address</div>
            <div className="col-span-2 text-right">Orders</div>
            <div className="col-span-3 text-right">Lifetime ৳</div>
          </div>
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => openDrawer(p)}
              className="w-full grid grid-cols-12 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="col-span-4 min-w-0">
                <div className="font-medium text-sm truncate">{p.name || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{p.platform} · {p.customer_psid.slice(0, 14)}…</div>
              </div>
              <div className="col-span-3 hidden sm:block min-w-0">
                <div className="text-xs truncate">{p.phone || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{p.city || p.address || ""}</div>
              </div>
              <div className="col-span-2 text-right text-sm tabular-nums">{p.lifetime_orders}</div>
              <div className="col-span-3 text-right text-sm font-medium tabular-nums">৳{Number(p.lifetime_value).toFixed(0)}</div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name || "Unnamed customer"}</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2 text-sm">
                  <Row icon={UserIcon} label="PSID" value={selected.customer_psid} />
                  <Row icon={Phone} label="Phone" value={selected.phone || "—"} />
                  <Row icon={MapPin} label="Address" value={[selected.address, selected.city].filter(Boolean).join(", ") || "—"} />
                  <Row icon={ShoppingBag} label="Lifetime" value={`${selected.lifetime_orders} orders · ৳${Number(selected.lifetime_value).toFixed(0)}`} />
                </div>

                {(selected.behavior_tags?.length || selected.preferred_categories?.length) ? (
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />Signals</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.behavior_tags?.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                      {selected.preferred_categories?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                      {selected.last_sentiment && <Badge variant="outline">mood: {selected.last_sentiment}</Badge>}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Orders</div>
                  {drawerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                          <div>
                            <div className="font-medium">৳{Number(o.amount).toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · {o.payment_method}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">{o.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent conversations</div>
                  {drawerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : convs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No conversations yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {convs.map((c) => (
                        <div key={c.id} className="text-sm border border-border rounded-md px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{c.platform} · {c.source}</span>
                            <Badge variant="outline" className="text-xs">{c.sales_stage}</Badge>
                          </div>
                          <p className="text-sm truncate mt-1">{c.last_message_preview}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setSelected(null)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="break-all">{value}</div>
      </div>
    </div>
  );
}
