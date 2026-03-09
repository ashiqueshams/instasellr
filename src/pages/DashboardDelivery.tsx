import { useState, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

interface DeliveryOption {
  id: string;
  store_id: string;
  label: string;
  cost: number;
  is_active: boolean;
  position: number;
}

export default function DashboardDelivery() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCost, setNewCost] = useState("");

  useEffect(() => {
    if (!store) return;
    fetchOptions();
  }, [store]);

  const fetchOptions = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("delivery_options" as any)
      .select("*")
      .eq("store_id", store.id)
      .order("position", { ascending: true });
    setOptions((data as any as DeliveryOption[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!store || !newLabel.trim()) {
      toast({ title: "Label is required", variant: "destructive" });
      return;
    }
    const cost = parseFloat(newCost) || 0;
    setSaving(true);
    const { error } = await supabase.from("delivery_options" as any).insert({
      store_id: store.id,
      label: newLabel.trim(),
      cost,
      position: options.length,
    } as any);
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
    } else {
      setNewLabel("");
      setNewCost("");
      await fetchOptions();
      toast({ title: "Delivery option added!" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("delivery_options" as any).delete().eq("id", id);
    setOptions((prev) => prev.filter((o) => o.id !== id));
    toast({ title: "Delivery option removed" });
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await supabase.from("delivery_options" as any).update({ is_active: !is_active } as any).eq("id", id);
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, is_active: !is_active } : o)));
  };

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Delivery Options</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Add custom delivery options that customers can choose during checkout.
      </p>

      {/* Add new */}
      <div className="bg-card rounded-xl p-5 store-shadow mb-6">
        <p className="font-heading font-semibold text-sm text-foreground mb-4">Add Delivery Option</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="e.g. Inside Dhaka Delivery"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className={inputClass}
          />
          <div className="flex gap-3 sm:w-auto">
            <input
              type="number"
              placeholder="Cost"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              className={`${inputClass} sm:w-28`}
              min="0"
              step="0.01"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-1.5 shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Existing options */}
      {options.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No delivery options yet. Add one above.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`bg-card rounded-xl p-4 store-shadow flex items-center gap-3 transition-opacity ${
                !opt.is_active ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-foreground truncate">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opt.cost > 0 ? `৳${opt.cost.toFixed(2)}` : "Free"}
                </p>
              </div>
              <button
                onClick={() => handleToggle(opt.id, opt.is_active)}
                className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                  opt.is_active
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.is_active ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => handleDelete(opt.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

