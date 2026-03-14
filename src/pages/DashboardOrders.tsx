import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";

interface OrderWithProduct {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  status: string;
  created_at: string;
  product_name: string;
  download_count: number | null;
  pathao_consignment_id: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  recipient_city_id: number | null;
  recipient_zone_id: number | null;
  recipient_area_id: number | null;
}

const STATUS_OPTIONS = ["pending", "approved", "dispatched"];
const PAID_STATUS_OPTIONS = ["paid", "dispatched"];

export default function DashboardOrders() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const { toast } = useToast();
  const { store } = useStore();

  useEffect(() => {
    if (!store) return;
    fetchOrders();
  }, [store]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, amount, status, created_at, download_count, pathao_consignment_id, shipping_address, shipping_city, recipient_city_id, recipient_zone_id, recipient_area_id, products(name)")
      .eq("store_id", store!.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(
        data.map((o: any) => ({
          id: o.id,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone,
          amount: o.amount,
          status: o.status,
          created_at: o.created_at,
          product_name: o.products?.name ?? "—",
          download_count: o.download_count,
          pathao_consignment_id: o.pathao_consignment_id,
          shipping_address: o.shipping_address,
          shipping_city: o.shipping_city,
          recipient_city_id: o.recipient_city_id,
          recipient_zone_id: o.recipient_zone_id,
          recipient_area_id: o.recipient_area_id,
        }))
      );
    }
    setLoading(false);
  };

  const handleStatusChange = async (order: OrderWithProduct, newStatus: string) => {
    if (newStatus === "dispatched") {
      await handleDispatch(order);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      toast({ title: `Order ${newStatus}` });
    }
  };

  const handleDispatch = async (order: OrderWithProduct) => {
    if (!order.recipient_city_id || !order.recipient_zone_id || !order.recipient_area_id) {
      toast({
        title: "Missing address data",
        description: "This order doesn't have Pathao-compatible address data (city/zone/area). Cannot dispatch via Pathao.",
        variant: "destructive",
      });
      // Still update status locally
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
          item_quantity: 1,
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
      const { error } = await supabase.functions.invoke("resend-order-email", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      toast({ title: "Email sent!", description: "Download link resent to customer." });
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err.message, variant: "destructive" });
    }
    setResending(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "approved": return "bg-blue-100 text-blue-700";
      case "dispatched": return "bg-purple-100 text-purple-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Orders</h1>
      <div className="bg-card rounded-xl store-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Customer</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Product</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Amount</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Status</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Courier</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Date</th>
                <th className="text-right text-xs text-muted-foreground font-body font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">Loading orders…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No orders yet.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-body font-semibold text-sm text-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      {order.customer_phone && <p className="text-xs text-muted-foreground">{order.customer_phone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{order.product_name}</td>
                    <td className="px-5 py-3.5 font-heading font-semibold text-sm text-foreground">${order.amount}</td>
                    <td className="px-5 py-3.5">
                      {order.status === "dispatched" ? (
                        <span className={`inline-block text-xs font-semibold font-body px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={dispatching === order.id}
                          className={`text-xs font-semibold font-body px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColor(order.status)}`}
                        >
                          {(order.status === "paid" ? PAID_STATUS_OPTIONS : STATUS_OPTIONS).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {order.pathao_consignment_id ? (
                        <span className="text-xs font-mono text-primary">{order.pathao_consignment_id}</span>
                      ) : order.status === "dispatched" ? (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1.5">
                      {dispatching === order.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {order.status === "paid" && (
                        <button
                          onClick={() => handleResend(order.id)}
                          disabled={resending === order.id}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {resending === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
