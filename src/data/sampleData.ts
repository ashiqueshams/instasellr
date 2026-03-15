export interface Product {
  id: string;
  store_id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  emoji: string;
  color: string;
  category: string;
  file_url: string | null;
  image_url: string | null;
  is_active: boolean;
  product_type: "digital" | "physical";
  stock_quantity: number | null;
  compare_at_price: number | null;
  weight: number | null;
  created_at: string;
}

export interface Bundle {
  id: string;
  store_id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  items?: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  created_at: string;
}

export interface Store {
   id: string;
   user_id: string;
   slug: string;
   name: string;
   bio: string;
   avatar_initials: string;
   accent_color: string;
   font_heading: string;
   font_body: string;
   layout: string;
   logo_url: string | null;
   banner_url: string | null;
   theme: string;
   background_color: string | null;
   banner_mode: string;
   card_style: string;
   social_position: string;
   footer_image_url: string | null;
   text_color: string | null;
   social_links_color?: string | null;
   social_links: {
     x?: string;
     instagram?: string;
     youtube?: string;
     tiktok?: string;
     linkedin?: string;
   };
   created_at: string;
 }

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  store_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  amount: number;
  status: "pending" | "paid" | "delivered";
  stripe_payment_id: string | null;
  order_items?: CartItem[];
  created_at: string;
}

export const sampleStore: Store = {
  id: "store-1",
  user_id: "user-1",
  slug: "jane-doe-digital",
  name: "Jane Doe Digital",
  bio: "Designer & creator sharing premium digital resources for modern creatives.",
  avatar_initials: "JD",
  accent_color: "#ff4545",
  font_heading: "Syne",
  font_body: "Manrope",
  layout: "list",
  logo_url: null,
  banner_url: null,
  theme: "light",
  background_color: null,
  banner_mode: "strip",
  card_style: "card",
  social_position: "header",
  footer_image_url: null,
  text_color: null,
  social_links: {
    x: "https://x.com/janedoe",
    instagram: "https://instagram.com/janedoe",
    youtube: "https://youtube.com/@janedoe",
    tiktok: "https://tiktok.com/@janedoe",
    linkedin: "https://linkedin.com/in/janedoe",
  },
  created_at: "2024-01-15T10:00:00Z",
};

export const sampleProducts: Product[] = [];
export const sampleOrders: Order[] = [];
