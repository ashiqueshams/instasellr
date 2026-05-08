import { Product } from "@/data/sampleData";

export function mapProduct(p: any): Product {
  return {
    id: p.id,
    store_id: p.store_id,
    name: p.name,
    tagline: p.tagline || "",
    description: p.description || "",
    price: p.price,
    emoji: p.emoji || "🎨",
    color: p.color || "#6C5CE7",
    category: p.category || "",
    file_url: p.file_url,
    image_url: p.image_url || null,
    is_active: p.is_active ?? true,
    product_type: (p.product_type || "digital") as "digital" | "physical",
    stock_quantity: p.stock_quantity ?? null,
    compare_at_price: p.compare_at_price ?? null,
    weight: p.weight ?? null,
    material: p.material ?? "",
    care_instructions: p.care_instructions ?? "",
    category_id: p.category_id ?? null,
    position: p.position ?? 0,
    is_popular: p.is_popular ?? false,
    created_at: p.created_at,
  };
}
