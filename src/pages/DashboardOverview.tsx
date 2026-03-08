import { useEffect, useState } from "react";
import { Package, ShoppingCart, DollarSign, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardOverview() {
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    const fetchStats = async () => {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("orders").select("amount, status").eq("store_id", store.id),
      ]);
      setProductCount(productsRes.count ?? 0);
      const orders = ordersRes.data ?? [];
      setOrderCount(orders.length);
      setTotalRevenue(orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.amount), 0));
      setLoading(false);
    };
    fetchStats();
  }, [store]);

  const storeUrl = store ? `${window.location.origin}/store/${store.slug}` : "";

  const stats = [
    { label: "Products", value: productCount, icon: Package, color: "#6C5CE7" },
    { label: "Orders", value: orderCount, icon: ShoppingCart, color: "#00B894" },
    { label: "Revenue", value: `$${totalRevenue}`, icon: DollarSign, color: "#E17055" },
  ];

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-5 store-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-sm text-muted-foreground font-body">{s.label}</span>
            </div>
            <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {store && (
        <div className="bg-card rounded-xl p-5 store-shadow">
          <p className="text-sm text-muted-foreground mb-2">Your store URL</p>
          <div className="flex items-center gap-2 min-w-0">
            <code className="flex-1 text-sm bg-background rounded-lg px-3 py-2 text-foreground font-body truncate">{storeUrl}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(storeUrl);
                toast({ title: "Copied!", description: "Store URL copied to clipboard." });
              }}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 text-sm font-heading font-semibold hover:brightness-110 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
