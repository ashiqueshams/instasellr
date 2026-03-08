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
  is_active: boolean;
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
  social_links: {
    x?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: "pending" | "paid" | "delivered";
  stripe_payment_id: string | null;
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
  social_links: {
    x: "https://x.com/janedoe",
    instagram: "https://instagram.com/janedoe",
    youtube: "https://youtube.com/@janedoe",
    tiktok: "https://tiktok.com/@janedoe",
    linkedin: "https://linkedin.com/in/janedoe",
  },
  created_at: "2024-01-15T10:00:00Z",
};

export const sampleProducts: Product[] = [
  {
    id: "prod-1",
    store_id: "store-1",
    name: "UI Design Kit",
    tagline: "200+ premium components for Figma",
    description: "A comprehensive UI design kit with over 200 meticulously crafted components, ready to drag and drop into your Figma projects. Includes buttons, cards, navigation, forms, modals, and much more — all following modern design principles.",
    price: 49,
    emoji: "🎨",
    color: "#6C5CE7",
    category: "Design",
    file_url: null,
    is_active: true,
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "prod-2",
    store_id: "store-1",
    name: "Icon Pack",
    tagline: "500 hand-crafted SVG icons",
    description: "A beautiful collection of 500 hand-crafted SVG icons in multiple styles — outlined, filled, and duotone. Perfect for web apps, mobile apps, and presentations. Fully customizable colors and sizes.",
    price: 24,
    emoji: "✨",
    color: "#00B894",
    category: "Design",
    file_url: null,
    is_active: true,
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "prod-3",
    store_id: "store-1",
    name: "Copywriting Guide",
    tagline: "Write copy that converts",
    description: "Learn the frameworks and techniques used by top copywriters to craft headlines, landing pages, and email sequences that drive conversions. Includes 50+ templates and real-world examples from successful campaigns.",
    price: 19,
    emoji: "📝",
    color: "#E17055",
    category: "Marketing",
    file_url: null,
    is_active: true,
    created_at: "2024-03-01T10:00:00Z",
  },
];

export const sampleOrders: Order[] = [
  {
    id: "order-1",
    store_id: "store-1",
    product_id: "prod-1",
    customer_name: "Alex Rivera",
    customer_email: "alex@example.com",
    amount: 49,
    status: "paid",
    stripe_payment_id: "pi_123",
    created_at: "2024-03-10T14:30:00Z",
  },
  {
    id: "order-2",
    store_id: "store-1",
    product_id: "prod-2",
    customer_name: "Sam Chen",
    customer_email: "sam@example.com",
    amount: 24,
    status: "paid",
    stripe_payment_id: "pi_456",
    created_at: "2024-03-12T09:15:00Z",
  },
  {
    id: "order-3",
    store_id: "store-1",
    product_id: "prod-3",
    customer_name: "Jordan Lee",
    customer_email: "jordan@example.com",
    amount: 19,
    status: "pending",
    stripe_payment_id: null,
    created_at: "2024-03-14T16:45:00Z",
  },
];
