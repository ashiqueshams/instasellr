import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Store } from "@/data/sampleData";

interface CartButtonProps {
  store: Store;
}

export default function CartButton({ store }: CartButtonProps) {
  const { totalItems, totalPrice, setIsOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 pointer-events-none">
      <div className="max-w-[480px] mx-auto pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-primary-foreground shadow-xl hover:brightness-105 active:scale-[0.98] transition-all animate-fade-in"
          style={{ backgroundColor: store.accent_color }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs font-bold">{totalItems}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Preview Cart</span>
              <span className="text-[10px] opacity-75">{store.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm">${totalPrice.toFixed(2)}</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </div>
        </button>
      </div>
    </div>
  );
}
