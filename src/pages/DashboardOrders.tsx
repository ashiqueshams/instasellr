import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";

interface OrderWithProduct {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  created_at: string;
  product_name: string;
  download_count: number | null;
}

export default function DashboardOrders() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const { toast } = useToast();
  const { store } = useStore();

  useEffect(() => {
    if (!store) return;
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, amount, status, created_at, download_count, products(name)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(
          data.map((o: any) => ({
            id: o.id,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            amount: o.amount,
            status: o.status,
            created_at: o.created_at,
            product_name: o.products?.name ?? "—",
            download_count: o.download_count,
          }))
        );
      }
      setLoading(false);
    };
    fetchOrders();
  }, [store]);

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

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Orders</h1>
      <div className="bg-card rounded-xl store-shadow overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Customer</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Product</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Amount</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Status</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Downloads</th>
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
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{order.product_name}</td>
                  <td className="px-5 py-3.5 font-heading font-semibold text-sm text-foreground">${order.amount}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block text-xs font-semibold font-body px-2.5 py-1 rounded-full ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "delivered"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {order.download_count ?? 0} / 3
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
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
  );
}
