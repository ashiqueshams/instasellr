import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderWithProduct {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  created_at: string;
  product_name: string;
}

export default function DashboardOrders() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, amount, status, created_at, products(name)")
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
          }))
        );
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Orders</h1>
      <div className="bg-card rounded-xl store-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Customer</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Product</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Amount</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Status</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">Loading orders…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No orders yet.</td>
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
                    {new Date(order.created_at).toLocaleDateString()}
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
