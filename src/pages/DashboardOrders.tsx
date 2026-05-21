import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, ChevronDown, Clock, Globe, HelpCircle, CheckCircle2, Truck, Search, X, ChevronUp } from "lucide-react";
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
  payment_method: string | null;
  order_items: any;
}

const STATUS_OPTIONS = ["pending", "approved", "dispatched", "cancelled"];
const PAID_STATUS_OPTIONS = ["paid", "dispatched", "cancelled"];
const ALL_STATUSES = ["pending", "approved", "paid", "dispatched", "cancelled"];
const PAYMENT_METHODS = ["cod", "bkash", "nagad", "stripe"];
const TIME_RANGES = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const shortCode = (id: string, name: string) => {
  const prefix = (name || "ORD").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ORD";
  const num = parseInt(id.replace(/[^0-9]/g, "").slice(0, 3) || "0", 10) % 1000;
  return `${prefix}${num}`;
};

const statusIcon = (status: string) => {
  switch (status) {
    case "paid":
    case "approved":
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
    case "dispatched":
      return <Truck className="w-3.5 h-3.5 text-purple-600" />;
    case "cancelled":
      return <X className="w-3.5 h-3.5 text-red-600" />;
    default:
      return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
  }
};

export default function DashboardOrders() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "amount-high" | "amount-low">("recent");
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const { store } = useStore();

  useEffect(() => {
    if (!store) return;
    fetchOrders();
  }, [store]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_email, customer_phone, amount, status, created_at, download_count, pathao_consignment_id, shipping_address, shipping_city, recipient_city_id, recipient_zone_id, recipient_area_id, payment_method, order_items, products(name)"
      )
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
          payment_method: o.payment_method,
          order_items: o.order_items,
        }))
      );
    }
    setLoading(false);
  };

  const handleStatusChange = async (order: OrderWithProduct, newStatus: string) => {
    if (newStatus === "dispatched") {
      await handleDispatch(order);
      setStatusDropdown(null);
      return;
    }
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      toast({ title: `Order ${newStatus}` });
      setStatusDropdown(null);
    }
  };

  const handleDispatch = async (order: OrderWithProduct) => {
    if (!order.recipient_city_id || !order.recipient_zone_id || !order.recipient_area_id) {
      toast({
        title: "Missing address data",
        description:
          "This order doesn't have Pathao-compatible address data. Cannot dispatch via Pathao.",
        variant: "destructive",
      });
      const { error } = await supabase.from("orders").update({ status: "dispatched" }).eq("id", order.id);
      if (!error)
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "dispatched" } : o)));
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
            ? {
                ...o,
                status: "dispatched",
                pathao_consignment_id: consignmentId ? String(consignmentId) : o.pathao_consignment_id,
              }
            : o
        )
      );
      toast({
        title: "Order dispatched!",
        description: consignmentId ? `Consignment: ${consignmentId}` : undefined,
      });
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

  const toggleExpand = (id: string) => setExpanded(expanded === id ? null : id);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const itemsList = (order: OrderWithProduct) => {
    if (Array.isArray(order.order_items) && order.order_items.length > 0) {
      return order.order_items as Array<{ name: string; quantity?: number; price?: number }>;
    }
    return [{ name: order.product_name, quantity: 1, price: order.amount }];
  };

  // Filter logic
  const getTimeRangeStart = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case "today":
        return new Date(now.setHours(0, 0, 0, 0));
      case "week":
        return new Date(now.setDate(now.getDate() - now.getDay()));
      case "month":
        return new Date(now.setDate(1));
      default:
        return null;
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        shortCode(order.id, order.customer_name).toLowerCase().includes(query) ||
        order.customer_phone?.includes(query);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(order.status);

      // Payment method filter
      const matchesPayment =
        selectedPaymentMethods.length === 0 ||
        (order.payment_method && selectedPaymentMethods.includes(order.payment_method));

      // Time range filter
      const timeStart = getTimeRangeStart();
      const matchesTime = !timeStart || new Date(order.created_at) >= timeStart;

      return matchesSearch && matchesStatus && matchesPayment && matchesTime;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedPaymentMethods([]);
    setSelectedTimeRange("all");
    setSortBy("recent");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedStatuses.length > 0 ||
    selectedPaymentMethods.length > 0 ||
    selectedTimeRange !== "all" ||
    sortBy !== "recent";

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-foreground mb-6">Orders</h1>

      {/* Search & Filter Bar */}
      <div className="relative mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or order ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-border"
        >
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Filters
        </button>
      </div>

      {/* Active Filters Bar */}
      {(selectedStatuses.length > 0 || selectedPaymentMethods.length > 0 || selectedTimeRange !== "all") && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Active filter pills */}
          {selectedStatuses.map((status) => (
            <div key={status} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-foreground">
              <span className="capitalize">{status}</span>
              <button
                onClick={() => toggleStatus(status)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selectedPaymentMethods.map((method) => (
            <div key={method} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-foreground">
              <span className="capitalize">{method}</span>
              <button
                onClick={() => togglePaymentMethod(method)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selectedTimeRange !== "all" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-foreground">
              <span>{TIME_RANGES.find(r => r.id === selectedTimeRange)?.label}</span>
              <button
                onClick={() => setSelectedTimeRange("all")}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all border border-border"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Expandable Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Status Filters */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    selectedStatuses.includes(status)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Filters */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    selectedPaymentMethods.includes(method)
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range & Sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Time
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="recent">Most Recent</option>
                <option value="amount-high">Highest</option>
                <option value="amount-low">Lowest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Counter */}
      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? (
          "Loading…"
        ) : filteredOrders.length === 0 ? (
          <>
            {orders.length === 0
              ? "No orders yet."
              : `No orders match your filters. ${hasActiveFilters ? "Try adjusting them." : ""}`}
          </>
        ) : (
          <>
            {filteredOrders.length} of {orders.length} order{filteredOrders.length !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-12">Loading orders…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12 bg-card rounded-xl border border-border">
            {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isOpen = expanded === order.id;
            const items = itemsList(order);
            const isDropdownOpen = statusDropdown === order.id;
            const availableStatuses = order.status === "paid" ? PAID_STATUS_OPTIONS : STATUS_OPTIONS;
            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border overflow-hidden transition-all"
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Globe className="w-5 h-5 text-foreground/70 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-heading font-bold text-base text-foreground tracking-wide">
                          {shortCode(order.id, order.customer_name)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 truncate">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {items.map((it, i) => (
                            <span key={i}>
                              {i > 0 && ", "}
                              {it.quantity || 1}x {it.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Status Button with Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusDropdown(isDropdownOpen ? null : order.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-semibold capitalize hover:bg-muted/50 transition-colors"
                        >
                          {statusIcon(order.status)}
                          {order.status}
                          <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                          <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                            {availableStatuses.map((status) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order, status);
                                }}
                                disabled={dispatching === order.id}
                                className="w-full text-left px-3 py-2 text-xs font-medium capitalize hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-foreground">
                        <span className="font-heading font-bold text-base">
                          ৳{Number(order.amount).toLocaleString()}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-4 text-sm">
                    {/* Customer */}
                    <div>
                      <div className="font-semibold text-foreground mb-2">Customer</div>
                      <div className="space-y-1.5">
                        <Row label="Name" value={order.customer_name} />
                        <Row label="Email" value={order.customer_email} />
                        {order.customer_phone && <Row label="Phone" value={order.customer_phone} />}
                      </div>
                    </div>

                    {/* Fulfillment */}
                    {(order.shipping_address || order.shipping_city) && (
                      <div>
                        <div className="font-semibold text-foreground mb-2">Fulfillment</div>
                        <div className="space-y-1.5">
                          {order.shipping_city && <Row label="City" value={order.shipping_city} />}
                          {order.shipping_address && <Row label="Address" value={order.shipping_address} />}
                          {order.pathao_consignment_id && (
                            <Row label="Consignment" value={order.pathao_consignment_id} mono />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Receipt */}
                    <div>
                      <div className="font-semibold text-foreground mb-2">Receipt</div>
                      <div className="space-y-1.5">
                        {items.map((it, i) => (
                          <Row
                            key={i}
                            label={`${it.quantity || 1}x ${it.name}`}
                            value={`৳${Number(it.price || 0).toLocaleString()}`}
                          />
                        ))}
                        <div className="border-t border-border pt-1.5 mt-1.5">
                          <Row label="Total" value={`৳${Number(order.amount).toLocaleString()}`} bold />
                        </div>
                      </div>
                    </div>

                    {/* Payment */}
                    {order.payment_method && (
                      <div>
                        <div className="font-semibold text-foreground mb-2">Payment</div>
                        <Row label="Method" value={order.payment_method.toUpperCase()} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {order.status === "paid" && (
                        <button
                          onClick={() => handleResend(order.id)}
                          disabled={resending === order.id}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resending === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Resend Email
                        </button>
                      )}
                      {dispatching === order.id && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching…
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={`text-muted-foreground ${bold ? "font-semibold text-foreground" : ""}`}>
        {label}
      </span>
      <span
        className={`text-right text-foreground ${bold ? "font-bold" : ""} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
