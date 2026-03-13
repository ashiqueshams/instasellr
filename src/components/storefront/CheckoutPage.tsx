import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, ShoppingBag } from "lucide-react";
import { Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryOption {
  id: string;
  label: string;
  cost: number;
}

interface CityZoneArea {
  id: number;
  name: string;
}

interface CheckoutPageProps {
  store: Store;
  onBack: () => void;
}

export default function CheckoutPage({ store, onBack }: CheckoutPageProps) {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
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

  // Pathao location state
  const [hasCourier, setHasCourier] = useState(false);
  const [cities, setCities] = useState<CityZoneArea[]>([]);
  const [zones, setZones] = useState<CityZoneArea[]>([]);
  const [areas, setAreas] = useState<CityZoneArea[]>([]);
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedZone, setSelectedZone] = useState(0);
  const [selectedArea, setSelectedArea] = useState(0);
  const [loadingCities, setLoadingCities] = useState(false);

  const hasPhysical = items.some((i) => i.product.product_type === "physical");

  // Check if store has courier configured & fetch delivery options
  useEffect(() => {
    const init = async () => {
      // Delivery options
      const { data } = await supabase
        .from("delivery_options" as any)
        .select("id, label, cost")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("position", { ascending: true });
      const opts = (data as any as DeliveryOption[]) || [];
      setDeliveryOptions(opts);
      if (opts.length > 0) setSelectedDelivery(opts[0].id);

      // Check courier settings (public can't read, so use edge function)
      if (hasPhysical) {
        try {
          const { data: cityData } = await supabase.functions.invoke("pathao-proxy", {
            body: { action: "get-cities", store_id: store.id },
          });
          if (cityData?.data?.data && Array.isArray(cityData.data.data) && cityData.data.data.length > 0) {
            setHasCourier(true);
            setCities(cityData.data.data.map((c: any) => ({ id: c.city_id, name: c.city_name })));
          }
        } catch {
          // No courier configured — fallback to free text
        }
      }
    };
    init();
  }, [store.id, hasPhysical]);

  const fetchZones = async (cityId: number) => {
    setZones([]);
    setAreas([]);
    setSelectedZone(0);
    setSelectedArea(0);
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-zones", store_id: store.id, city_id: cityId },
    });
    if (data?.data?.data) setZones(data.data.data.map((z: any) => ({ id: z.zone_id, name: z.zone_name })));
  };

  const fetchAreas = async (zoneId: number) => {
    setAreas([]);
    setSelectedArea(0);
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-areas", store_id: store.id, zone_id: zoneId },
    });
    if (data?.data?.data) setAreas(data.data.data.map((a: any) => ({ id: a.area_id, name: a.area_name })));
  };

  const deliveryCost = deliveryOptions.find((d) => d.id === selectedDelivery)?.cost || 0;
  const grandTotal = totalPrice + (hasPhysical ? deliveryCost : 0);

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
      if (!form.address.trim()) {
        toast({ title: "Street address required", variant: "destructive" });
        return;
      }
      if (hasCourier) {
        if (!selectedCity || !selectedZone || !selectedArea) {
          toast({ title: "Please select city, zone, and area", variant: "destructive" });
          return;
        }
      } else {
        if (!form.city.trim() || !form.country.trim()) {
          toast({ title: "Complete shipping address required", variant: "destructive" });
          return;
        }
      }
      if (deliveryOptions.length > 0 && !selectedDelivery) {
        toast({ title: "Please select a delivery option", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const cityName = hasCourier ? cities.find(c => c.id === selectedCity)?.name || "" : form.city;

      for (const item of items) {
        const { error } = await supabase.functions.invoke("create-order", {
          body: {
            product_id: item.product.id,
            store_id: store.id,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
            shipping_address: hasPhysical ? form.address : null,
            shipping_city: hasPhysical ? cityName : null,
            shipping_state: hasPhysical ? form.state : null,
            shipping_zip: hasPhysical ? form.zip : null,
            shipping_country: hasPhysical ? (hasCourier ? "Bangladesh" : form.country) : null,
            recipient_city_id: hasPhysical && hasCourier ? selectedCity : null,
            recipient_zone_id: hasPhysical && hasCourier ? selectedZone : null,
            recipient_area_id: hasPhysical && hasCourier ? selectedArea : null,
            amount: item.product.price * item.quantity + (hasPhysical ? deliveryCost / items.length : 0),
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
  const selectClass =
    "h-11 rounded-xl bg-muted/50 px-4 text-[16px] sm:text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full";

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

        {hasPhysical && deliveryOptions.length > 0 && selectedDelivery && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Delivery</span>
            <span className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>
              {deliveryCost > 0 ? `৳${deliveryCost.toFixed(2)}` : "Free"}
            </span>
          </div>
        )}

        <div className="border-t border-border mt-3 pt-4 flex items-center justify-between">
          <span className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>Total</span>
          <span className="font-heading font-bold text-xl" style={{ color: store.accent_color }}>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Contact */}
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

        {/* Shipping */}
        {hasPhysical && (
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
              Shipping Address
            </h3>
            <div className="flex flex-col gap-3">
              <input placeholder="Street address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />

              {hasCourier ? (
                <>
                  {/* Pathao cascading dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        const cityId = Number(e.target.value);
                        setSelectedCity(cityId);
                        if (cityId) fetchZones(cityId);
                        else { setZones([]); setAreas([]); setSelectedZone(0); setSelectedArea(0); }
                      }}
                      className={selectClass}
                    >
                      <option value={0}>Select City *</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedZone}
                      onChange={(e) => {
                        const zoneId = Number(e.target.value);
                        setSelectedZone(zoneId);
                        if (zoneId) fetchAreas(zoneId);
                        else { setAreas([]); setSelectedArea(0); }
                      }}
                      className={selectClass}
                      disabled={zones.length === 0}
                    >
                      <option value={0}>Select Zone *</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(Number(e.target.value))}
                      className={selectClass}
                      disabled={areas.length === 0}
                    >
                      <option value={0}>Select Area *</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                    <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="ZIP code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputClass} />
                    <input placeholder="Country *" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delivery Options */}
        {hasPhysical && deliveryOptions.length > 0 && (
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
              Delivery Method
            </h3>
            <div className="flex flex-col gap-2.5">
              {deliveryOptions.map((opt) => {
                const isSelected = selectedDelivery === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedDelivery(opt.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: isSelected ? store.accent_color : "hsl(var(--border))",
                      backgroundColor: isSelected ? store.accent_color + "08" : undefined,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: isSelected ? store.accent_color : "hsl(var(--border))",
                      }}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: store.accent_color }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>
                        {opt.label}
                      </p>
                    </div>
                    <span className="font-heading font-bold text-sm" style={{ color: store.accent_color }}>
                      {opt.cost > 0 ? `৳${opt.cost.toFixed(2)}` : "Free"}
                    </span>
                  </button>
                );
              })}
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
            `Place Order — $${grandTotal.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
