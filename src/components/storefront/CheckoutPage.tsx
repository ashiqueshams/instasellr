import { useState } from "react";
import { ArrowLeft, Check, Loader2, ShoppingBag } from "lucide-react";
import { Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutPageProps {
  store: Store;
  onBack: () => void;
}

export default function CheckoutPage({ store, onBack }: CheckoutPageProps) {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const hasPhysical = items.some((i) => i.product.product_type === "physical");

  const handleCheckout = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Valid email required", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "Phone number required", variant: "destructive" });
      return;
    }
    if (hasPhysical) {
      if (!form.address.trim() || !form.city.trim() || !form.zip.trim() || !form.country.trim()) {
        toast({ title: "Complete shipping address required for physical products", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      // Create one order per product in cart
      for (const item of items) {
        const { error } = await supabase.functions.invoke("create-order", {
          body: {
            product_id: item.product.id,
            store_id: store.id,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
            shipping_address: hasPhysical ? form.address : null,
            shipping_city: hasPhysical ? form.city : null,
            shipping_state: hasPhysical ? form.state : null,
            shipping_zip: hasPhysical ? form.zip : null,
            shipping_country: hasPhysical ? form.country : null,
            amount: item.product.price * item.quantity,
            quantity: item.quantity,
          },
        });
        if (error) throw error;
      }
      setPurchased(true);
      clearCart();
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message || "Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const inputClass =
    "h-11 rounded-xl bg-muted/50 px-4 text-[16px] sm:text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground";

  if (purchased) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-popIn">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: store.accent_color + "18" }}>
          <Check className="w-8 h-8" style={{ color: store.accent_color }} />
        </div>
        <h2 className="font-heading font-bold text-xl" style={{ color: store.text_color || undefined }}>Order Placed!</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-[280px]">
          Confirmation sent to <span className="font-semibold" style={{ color: store.text_color || undefined }}>{form.email}</span>
        </p>
        <button
          onClick={onBack}
          className="mt-6 h-10 px-6 rounded-xl bg-muted font-heading font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
          style={{ color: store.text_color || undefined }}
        >
          ← Back to Store
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Your cart is empty</p>
        <button onClick={onBack} className="mt-4 text-sm font-semibold" style={{ color: store.accent_color }}>
          ← Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slideInRight">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Store
      </button>

      <h2 className="font-heading font-bold text-xl mb-6" style={{ color: store.text_color || undefined }}>
        Checkout
      </h2>

      {/* Order Summary */}
      <div className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/50">
        <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: store.text_color || undefined }}>
          Order Summary
        </h3>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg" style={{ backgroundColor: item.product.color + "20" }}>
                    {item.product.emoji}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm truncate" style={{ color: store.text_color || undefined }}>
                  {item.product.name}
                </p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <span className="font-heading font-bold text-sm" style={{ color: store.text_color || undefined }}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
          <span className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>Total</span>
          <span className="font-heading font-bold text-xl" style={{ color: store.accent_color }}>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-5">
        <div>
          <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
            Contact Information
          </h3>
          <div className="flex flex-col gap-3">
            <input placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            <input type="email" placeholder="Email address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            <input type="tel" placeholder="Phone number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Shipping - only if physical products */}
        {hasPhysical && (
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
              Shipping Address
            </h3>
            <div className="flex flex-col gap-3">
              <input placeholder="Street address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="ZIP code *" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputClass} />
                <input placeholder="Country *" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full h-13 py-4 rounded-xl font-heading font-semibold text-sm text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ backgroundColor: store.accent_color }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Place Order — $${totalPrice.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
