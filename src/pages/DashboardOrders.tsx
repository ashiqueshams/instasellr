import { sampleOrders, sampleProducts } from "@/data/sampleData";

export default function DashboardOrders() {
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
            {sampleOrders.map((order) => {
              const product = sampleProducts.find((p) => p.id === order.product_id);
              return (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-body font-semibold text-sm text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{product?.name ?? "—"}</td>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
