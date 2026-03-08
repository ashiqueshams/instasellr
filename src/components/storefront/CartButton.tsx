import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Store } from "@/data/sampleData";

interface CartButtonProps {
  store: Store;
}

export default function CartButton({ store }: CartButtonProps) {
  const { totalItems, setIsOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform animate-popIn"
      style={{ backgroundColor: store.accent_color }}
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
        {totalItems}
      </span>
    </button>
  );
}
