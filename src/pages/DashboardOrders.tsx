import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, ChevronDown, Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import OrderCard, { OrderRecord } from "@/components/dashboard/OrderCard";
import { NavLink } from "react-router-dom";

const TABS = [
  { label: "All orders", path: "/dashboard" },
  { label: "Earnings", path: "/dashboard/earnings" },
  { label: "Customers", path: "/dashboard/customers" },
  { label: "Reviews", path: "/dashboard/reviews" },
  { label: "Analytics", path: "/dashboard/overview" },
];

const STATUS_FILTERS = ["all", "pending", "approved", "paid", "dispatched"];

export default function DashboardOrders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();
  const { store } = useStore();

  useEffect(() => {
    if (!store) return;
    fetchOrders();
  }, [store]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, amount, status, created_at, payment_method, download_count, pathao_consignment_id, shipping_address, shipping_city, recipient_city_id, recipient_zone_id, recipient_area_id, order_items, products(name)")
      .eq("store_id", store!.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(
        data.map((o: any) => {
          const items = Array.isArray(o.order_items) ? o.order_items : [];
          const qty = items.reduce((s: number, it: any) => s + Number(it?.quantity || 1), 0) || 1;
          return {
            id: o.id,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            customer_phone: o.customer_phone,
            amount: o.amount,
            status: o.status,
            created_at: o.created_at,
            payment_method: o.payment_method,
            product_name: o.products?.name ?? "—",
            product_quantity: qty,
            download_count: o.download_count,
            pathao_consignment_id: o.pathao_consignment_id,
            shipping_address: o.shipping_address,
            shipping_city: o.shipping_city,
            recipient_city_id: o.recipient_city_id,
            recipient_zone_id: o.recipient_zone_id,
            recipient_area_id: o.recipient_area_id,
          };
        })
      );
    }
    setLoading(false);
  };

  const handleStatusChange = async (order: OrderRecord, newStatus: string) => {
    if (newStatus === "dispatched") {
      await handleDispatch(order);
      return;
    }
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      toast({ title: `Order ${newStatus}` });
    }
  };

  const handleDispatch = async (order: OrderRecord) => {
    if (!order.recipient_city_id || !order.recipient_zone_id || !order.recipient_area_id) {
      toast({
        title: "Missing address data",
        description: "No Pathao-compatible address. Marking as dispatched manually.",
      });
      const { error } = await supabase.from("orders").update({ status: "dispatched" }).eq("id", order.id);
      if (!error) setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "dispatched" } : o)));
      return;
    }

    setDispatching(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("pathao-proxy", {
        body: {
          action: "create-order",
          store_id: store!.id,
          order_id: order.id,
          recipient_name: order.customer_name,
          recipient_phone: order.customer_phone || "",
          recipient_address: order.shipping_address || "",
          recipient_city_id: order.recipient_city_id,
          recipient_zone_id: order.recipient_zone_id,
          recipient_area_id: order.recipient_area_id,
          amount_to_collect: order.amount,
          item_quantity: order.product_quantity || 1,
          item_description: order.product_name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const consignmentId = data?.data?.consignment_id;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status: "dispatched", pathao_consignment_id: consignmentId ? String(consignmentId) : o.pathao_consignment_id }
            : o
        )
      );
      toast({ title: "Order dispatched!", description: consignmentId ? `Consignment: ${consignmentId}` : undefined });
    } catch (err: any) {
      toast({ title: "Dispatch failed", description: err.message, variant: "destructive" });
    }
    setDispatching(null);
  };

  const handleResend = async (orderId: string) => {
    setResending(orderId);
    try {
      const { error } = await supabase.functions.invoke("resend-order-email", { body: { order_id: orderId } });
      if (error) throw error;
      toast({ title: "Email sent!", description: "Download link resent to customer." });
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err.message, variant: "destructive" });
    }
    setResending(null);
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_email.toLowerCase().includes(q) ||
          o.product_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div className="max-w-3xl mx-auto">
      <DashboardTopBar onSearchClick={() => setShowSearch((v) => !v)} />

      {/* Top tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-5 scrollbar-none">
        {TABS.map((tab, i) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/dashboard"}
            className={({ isActive }) =>
              `shrink-0 h-10 px-5 rounded-full text-sm font-heading font-semibold transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-3xl text-foreground">Orders</h1>
        <button
          onClick={() => setShowSearch((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg px-2 py-1.5"
        >
          <Search className="w-4 h-4" />
          <span className="font-semibold">Select</span>
        </button>
      </div>

      {showSearch && (
        <div className="mb-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, email or product…"
            className="w-full h-10 px-4 rounded-full border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {/* Filters / Actions / Add order */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{filter !== "all" ? `: ${filter}` : ""}
          </button>
          {showFilter && (
            <div className="absolute top-12 left-0 z-20 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[160px]">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilter(s);
                    setShowFilter(false);
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg capitalize ${
                    filter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted">
          Actions
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast({ title: "Coming soon", description: "Manual order creation will be available shortly." })}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-yellow-300 hover:bg-yellow-400 text-foreground text-sm font-bold transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add order
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          No orders found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onResend={handleResend}
              resending={resending === order.id}
              dispatching={dispatching === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
