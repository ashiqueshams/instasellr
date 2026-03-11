import { useState, useEffect } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Product } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface ProductQuantityControlProps {
  product: Product;
  accentColor: string;
}

export default function ProductQuantityControl({ product, accentColor }: ProductQuantityControlProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const [expanded, setExpanded] = useState(false);

  // Auto-collapse after 2.5s of no interaction
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 2500);
    return () => clearTimeout(timer);
  }, [expanded, quantity]);

  if (quantity === 0) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          addToCart(product);
          setExpanded(true);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground hover:brightness-110 active:scale-90 transition-all shadow-md animate-scale-in"
        style={{ backgroundColor: accentColor }}
        aria-label={`Add ${product.name} to cart`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(true);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
        style={{ backgroundColor: accentColor }}
        aria-label={`${quantity} in cart, tap to edit`}
      >
        {quantity}
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-0 rounded-full shadow-lg overflow-hidden animate-scale-in"
      style={{ backgroundColor: accentColor }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          if (quantity <= 1) {
            updateQuantity(product.id, 0);
            setExpanded(false);
          } else {
            updateQuantity(product.id, quantity - 1);
          }
        }}
        className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-black/10 active:scale-90 transition-all"
        aria-label="Decrease quantity"
      >
        {quantity <= 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
      </button>
      <span className="w-6 text-center text-primary-foreground font-bold text-xs tabular-nums select-none">
        {quantity}
      </span>
      <button
        onClick={() => {
          addToCart(product);
        }}
        className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-black/10 active:scale-90 transition-all"
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
