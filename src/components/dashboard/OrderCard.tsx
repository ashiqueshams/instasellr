import { useState } from "react";
import { ChevronDown, Globe, Clock, HelpCircle, CheckCircle2, Truck, Pencil, Copy, Send, Loader2, MessageCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrderRecord {
  id: string;
  short_code?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string | null;
  product_name: string;
  product_quantity?: number;
  download_count: number | null;
  pathao_consignment_id: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  recipient_city_id: number | null;
  recipient_zone_id: number | null;
  recipient_area_id: number | null;
  delivery_label?: string | null;
  delivery_cost?: number | null;
  subtotal?: number | null;
}

interface Props {
  order: OrderRecord;
  onStatusChange: (order: OrderRecord, status: string) => Promise<void>;
  onResend: (id: string) => Promise<void>;
  resending: boolean;
  dispatching: boolean;
  currency?: string;
}

const STATUS_META: Record<string, { label: string; icon: any; cls: string }> = {
  pending: { label: "Pending", icon: HelpCircle, cls: "text-orange-600 bg-orange-50 border-orange-200" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "text-blue-600 bg-blue-50 border-blue-200" },
  paid: { label: "Paid", icon: CheckCircle2, cls: "text-green-600 bg-green-50 border-green-200" },
  dispatched: { label: "Fulfilled", icon: Truck, cls: "text-green-600 bg-green-50 border-green-200" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const shortCode = (order: OrderRecord) => {
  if (order.short_code) return order.short_code;
  const initials = (order.customer_name || "ORD").trim().slice(0, 3).toUpperCase();
  const num = parseInt(order.id.replace(/[^0-9]/g, "").slice(0, 2) || "0", 10) || (order.id.charCodeAt(0) % 99);
  return `${initials}${num}`;
};

export default function OrderCard({ order, onStatusChange, onResend, resending, dispatching, currency = "৳" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const { toast } = useToast();

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  const code = shortCode(order);
  const subtotal = order.subtotal ?? Number(order.amount) - Number(order.delivery_cost ?? 0);

  const copyOrder = () => {
    const text = `Order ${code}\n${order.customer_name}\n${order.product_quantity ?? 1}x ${order.product_name}\nTotal: ${currency}${order.amount}\n${order.shipping_address || ""}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Order copied to clipboard" });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="font-heading font-bold text-base text-foreground tracking-wide">{code}</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.cls}`}>
            <StatusIcon className="w-3 h-3" />
            {meta.label}
          </span>
        </div>
        <div className="mt-2 pl-9.5 text-sm text-muted-foreground space-y-0.5">
          <p>{order.customer_name}</p>
          <p>{order.product_quantity ?? 1}x {order.product_name}</p>
        </div>
        <div className="mt-2 pl-9.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {formatDate(order.created_at)}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            {currency}{Number(order.amount).toLocaleString()}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Action strip */}
          <div className="grid grid-cols-2 bg-muted/40 border-b border-border">
            <button
              onClick={() => setEditingStatus((v) => !v)}
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={copyOrder}
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors border-l border-border"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>

          {editingStatus && (
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {["pending", "approved", "dispatched"].map((s) => (
                  <button
                    key={s}
                    disabled={dispatching}
                    onClick={async () => {
                      await onStatusChange(order, s);
                      setEditingStatus(false);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      order.status === s
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {dispatching && s === "dispatched" ? <Loader2 className="w-3 h-3 animate-spin" /> : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer */}
          <Section title="Customer">
            <Row label="Name" value={order.customer_name} />
            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {order.customer_email}
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
              }
            />
            {order.customer_phone && (
              <Row
                label="Phone"
                value={
                  <a
                    href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    {order.customer_phone}
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  </a>
                }
              />
            )}
          </Section>

          {/* Fulfillment */}
          <Section title="Fulfillment">
            <Row label="Type" value={order.delivery_label || "Standard"} />
            {order.shipping_address && <Row label="Address" value={order.shipping_address} />}
            {order.shipping_city && <Row label="City" value={order.shipping_city} />}
            {order.pathao_consignment_id && (
              <Row label="Consignment" value={<span className="font-mono text-xs">{order.pathao_consignment_id}</span>} />
            )}
          </Section>

          {/* Receipt */}
          <Section title="Receipt">
            <Row label={`${order.product_quantity ?? 1}x ${order.product_name}`} value={`${currency}${subtotal.toLocaleString()}`} />
            <Row label={<span className="font-semibold text-foreground">Subtotal</span>} value={<span className="font-semibold">{currency}{subtotal.toLocaleString()}</span>} />
            {(order.delivery_cost ?? 0) > 0 && (
              <Row label="Fulfillment fee" value={`${currency}${Number(order.delivery_cost).toLocaleString()}`} />
            )}
            <Row
              label={<span className="font-bold text-foreground">Total</span>}
              value={<span className="font-bold">{currency}{Number(order.amount).toLocaleString()}</span>}
            />
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <Row label="Method" value={(order.payment_method || "cod").toUpperCase()} />
          </Section>

          {/* Activity */}
          <Section title="Activity" lastSection>
            <Activity text="Customer completed checkout" date={order.created_at} />
            <Activity text="Customer created order on Online store" date={order.created_at} />
          </Section>

          {/* Resend (digital) */}
          {order.status === "paid" && (
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => onResend(order.id)}
                disabled={resending}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Resend download link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children, lastSection }: { title: string; children: React.ReactNode; lastSection?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={lastSection ? "" : "border-b border-border"}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-heading font-bold text-sm text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function Activity({ text, date }: { text: string; date: string }) {
  const d = new Date(date);
  const time = d.toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
      <div>
        <p className="text-foreground">{text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}
