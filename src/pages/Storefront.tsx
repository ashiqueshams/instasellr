import { useState, useMemo } from "react";
import { sampleStore, sampleProducts, Product } from "@/data/sampleData";
import StoreHeader from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";

export default function Storefront() {
  const store = sampleStore;
  const products = sampleProducts;
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.is_active &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.tagline.toLowerCase().includes(search.toLowerCase()))
      ),
    [products, search]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-5 py-8 pb-24">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            store={store}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <StoreHeader store={store} />
            <SearchBar value={search} onChange={setSearch} />
            {!search && <BundleCard products={products} onBuyBundle={() => {}} />}
            <ProductList products={filteredProducts} onSelectProduct={setSelectedProduct} />
          </div>
        )}
      </div>
    </div>
  );
}
