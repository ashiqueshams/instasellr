import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Product, Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface ProductDetailProps {
  product: Product;
  store: Store;
  onBack: () => void;
}

export default function ProductDetail({ product, store, onBack }: ProductDetailProps) {
  const { addToCart, items, updateQuantity } = useCart();

  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const included = product.product_type === "digital"
    ? ["Instant digital download", "Lifetime access & updates", "Commercial license included", "Premium support via email"]
    : ["Quality guaranteed", "Secure packaging", "Fast shipping", "Easy returns"];


  const handleAddToCart = () => addToCart(product);

  return (
    <div className="animate-slideInRight">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero image - full width */}
      <div className="rounded-2xl overflow-hidden mb-5">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" />
        ) : (
          <div
            className="w-full aspect-square flex items-center justify-center text-7xl"
            style={{ backgroundColor: product.color + "15" }}
          >
            {product.emoji}
          </div>
        )}
      </div>

      {/* Title & Price */}
      <div className="mb-5">
        <h2
          className="font-heading font-bold text-xl"
          style={{ fontFamily: `'${store.font_heading}', sans-serif`, color: store.text_color || undefined }}
        >
          {product.name}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{product.tagline}</p>
        <p className="font-heading font-bold text-2xl mt-3" style={{ color: store.accent_color }}>
          ${product.price}
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm mb-2" style={{ color: store.text_color || undefined }}>
          About this product
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      {/* What's included */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
          What's included
        </h3>
        <div className="flex flex-col gap-2.5">
          {included.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: store.accent_color + "18" }}
              >
                <Check className="w-3 h-3" style={{ color: store.accent_color }} />
              </div>
              <span className="text-sm" style={{ color: store.text_color || undefined }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add to Cart CTA */}
      <div ref={ctaRef} className="space-y-3">
        {quantity > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-muted rounded-xl flex-1">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="flex-1 h-12 flex items-center justify-center rounded-xl hover:bg-background transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-heading font-bold text-lg">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="flex-1 h-12 flex items-center justify-center rounded-xl hover:bg-background transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="h-12 px-6 rounded-xl font-heading font-semibold text-sm text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
              style={{ backgroundColor: store.accent_color }}
            >
              <ShoppingBag className="w-4 h-4" />
              Add More
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full h-13 py-4 rounded-xl font-heading font-semibold text-sm text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: store.accent_color }}
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart — ${product.price}
          </button>
        )}
      </div>

      {/* Sticky Add to Cart bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
          <div className="max-w-[480px] mx-auto px-4 pb-4">
            {quantity > 0 ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center bg-card rounded-2xl border border-border store-shadow flex-1 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="flex-1 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-heading font-bold text-base tabular-nums">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="flex-1 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="h-12 px-6 rounded-2xl font-heading font-semibold text-sm text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
                  style={{ backgroundColor: store.accent_color }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add More
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full h-12 rounded-2xl font-heading font-semibold text-sm text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: store.accent_color }}
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart — ${product.price}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
