// Bilingual copy for the onboarding wizard. Single source of truth for EN / বাংলা.

export type Lang = "en" | "bn";

type CopyValue = { en: string; bn: string };

const dict = {
  // Global
  back: { en: "Back", bn: "পেছনে" },
  next: { en: "Continue", bn: "পরবর্তী" },
  skip: { en: "Skip for now", bn: "এখন স্কিপ করুন" },
  saveExit: { en: "Save & exit", bn: "সেভ করে বের হোন" },
  finish: { en: "Publish my store 🚀", bn: "আমার দোকান চালু করুন 🚀" },
  required: { en: "Required", bn: "আবশ্যক" },
  optional: { en: "Optional", bn: "ঐচ্ছিক" },
  stepOf: { en: "Step", bn: "ধাপ" },
  of: { en: "of", bn: "/" },

  // Step 0 — Welcome
  welcomeTitle: { en: "Welcome to InstaSellr 🎉", bn: "InstaSellr-এ স্বাগতম 🎉" },
  welcomeSubtitle: {
    en: "Let's set up your store in under 2 minutes.",
    bn: "চলুন ২ মিনিটে আপনার দোকান সেট আপ করি।",
  },
  welcomePromise1: {
    en: "📦 Take orders from Instagram & Facebook",
    bn: "📦 Instagram ও Facebook থেকে অর্ডার নিন",
  },
  welcomePromise2: {
    en: "🤖 AI auto-replies to customer DMs in Bangla",
    bn: "🤖 AI বাংলায় কাস্টমার DM-এর উত্তর দেয়",
  },
  welcomePromise3: {
    en: "🚚 Ship anywhere in Bangladesh via Pathao",
    bn: "🚚 Pathao দিয়ে সারা বাংলাদেশে ডেলিভারি",
  },
  welcomeCta: { en: "Let's set up your store →", bn: "চলুন শুরু করি →" },
  langLabel: { en: "Language", bn: "ভাষা" },

  // Step 1 — Store basics
  basicsTitle: { en: "Store basics", bn: "দোকানের মূল তথ্য" },
  basicsSubtitle: {
    en: "Customers will see this on your storefront.",
    bn: "এই তথ্যগুলো কাস্টমাররা দেখবে।",
  },
  storeName: { en: "Store name", bn: "দোকানের নাম" },
  storeNamePh: { en: "e.g. Aarong Boutique", bn: "যেমন: আড়ং বুটিক" },
  storeUrl: { en: "Store URL", bn: "দোকানের লিংক" },
  storeUrlHint: {
    en: "This is the link you'll share. You can change it later.",
    bn: "এই লিংকটি আপনি শেয়ার করবেন। পরে বদলাতে পারবেন।",
  },
  bio: { en: "One-line bio", bn: "এক লাইনে পরিচয়" },
  bioPh: {
    en: "Premium handcrafted kurtis from Dhaka",
    bn: "ঢাকার প্রিমিয়াম হ্যান্ডক্রাফটেড কুর্তি",
  },

  // Step 2 — Branding
  brandingTitle: { en: "Add your brand look", bn: "আপনার ব্র্যান্ড লুক" },
  brandingSubtitle: {
    en: "A logo and color make your store feel professional.",
    bn: "লোগো এবং রঙ দোকানকে প্রফেশনাল করে।",
  },
  logo: { en: "Logo", bn: "লোগো" },
  uploadLogo: { en: "Upload logo (PNG/JPG)", bn: "লোগো আপলোড করুন (PNG/JPG)" },
  noLogoFallback: {
    en: "No logo? We'll use your initials.",
    bn: "লোগো নেই? আমরা আদ্যক্ষর ব্যবহার করব।",
  },
  accentColor: { en: "Accent color", bn: "মূল রঙ" },
  accentColorHint: {
    en: "Used for buttons and highlights on your storefront.",
    bn: "বাটন ও হাইলাইটে ব্যবহৃত হবে।",
  },
  livePreview: { en: "Live preview", bn: "লাইভ প্রিভিউ" },

  // Step 3 — First product
  productTitle: { en: "Add your first product", bn: "প্রথম প্রোডাক্ট যোগ করুন" },
  productSubtitle: {
    en: "You can add more later. We've pre-filled an example you can edit.",
    bn: "পরে আরও যোগ করা যাবে। উদাহরণ দেওয়া আছে — চাইলে এডিট করুন।",
  },
  productName: { en: "Product name", bn: "প্রোডাক্টের নাম" },
  productNamePh: { en: "e.g. Cotton Kurti", bn: "যেমন: কটন কুর্তি" },
  productPrice: { en: "Price (৳)", bn: "দাম (৳)" },
  productPricePh: { en: "1200", bn: "১২০০" },
  productPhoto: { en: "Product photo", bn: "প্রোডাক্টের ছবি" },
  productPhotoHint: {
    en: "💡 Use a clear photo on white background. Material & care info help the AI chatbot answer DMs automatically.",
    bn: "💡 সাদা ব্যাকগ্রাউন্ডে স্পষ্ট ছবি দিন। ম্যাটেরিয়াল ও কেয়ার তথ্য চ্যাটবটকে কাস্টমারের প্রশ্নের উত্তর দিতে সাহায্য করবে।",
  },
  productMaterial: { en: "Material (optional)", bn: "ম্যাটেরিয়াল (ঐচ্ছিক)" },
  productMaterialPh: { en: "100% premium cotton", bn: "১০০% প্রিমিয়াম কটন" },
  productCare: { en: "Care instructions (optional)", bn: "যত্নের নির্দেশনা (ঐচ্ছিক)" },
  productCarePh: { en: "Hand wash only, do not bleach", bn: "শুধু হাতে ধুবেন, ব্লিচ করবেন না" },

  // Step 4 — Delivery
  deliveryTitle: { en: "Set your delivery charges", bn: "ডেলিভারি চার্জ সেট করুন" },
  deliverySubtitle: {
    en: "Customers pick one of these at checkout. We've added Bangladesh defaults — edit or remove.",
    bn: "চেকআউটে কাস্টমার একটি বেছে নেবে। বাংলাদেশের ডিফল্ট দেওয়া আছে — এডিট বা মুছে দিন।",
  },
  deliveryLabel: { en: "Label", bn: "নাম" },
  deliveryCost: { en: "Cost (৳)", bn: "চার্জ (৳)" },
  addDelivery: { en: "+ Add another option", bn: "+ আরেকটি অপশন যোগ করুন" },
  deliveryWhy: {
    en: "Why this matters: without delivery options, checkout won't work.",
    bn: "কেন গুরুত্বপূর্ণ: ডেলিভারি অপশন ছাড়া চেকআউট কাজ করবে না।",
  },

  // Step 5 — Payment
  paymentTitle: { en: "How will you accept payment?", bn: "পেমেন্ট কীভাবে নেবেন?" },
  paymentSubtitle: {
    en: "Most Bangladesh stores start with Cash on Delivery. You can add bKash later.",
    bn: "বাংলাদেশের বেশিরভাগ দোকান Cash on Delivery দিয়ে শুরু করে। পরে bKash যোগ করা যাবে।",
  },
  cod: { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  codDesc: {
    en: "Customer pays the delivery person when they receive the order.",
    bn: "কাস্টমার অর্ডার পেয়ে ডেলিভারি ম্যানকে টাকা দেবে।",
  },
  recommended: { en: "Recommended", bn: "প্রস্তাবিত" },
  bkashSoon: {
    en: "bKash / Nagad — set up later in Settings",
    bn: "bKash / Nagad — পরে Settings থেকে যোগ করুন",
  },

  // Step 6 — Review
  reviewTitle: { en: "Almost done!", bn: "প্রায় শেষ!" },
  reviewSubtitle: {
    en: "Quick check — looks good? Hit publish to take your store live.",
    bn: "একটু চেক করুন — সব ঠিক আছে? Publish দিয়ে দোকান লাইভ করুন।",
  },

  // Success
  successTitle: { en: "Your store is live! 🎉", bn: "আপনার দোকান লাইভ! 🎉" },
  successSubtitle: {
    en: "Share your link to start getting orders.",
    bn: "অর্ডার পেতে লিংক শেয়ার করুন।",
  },
  copyLink: { en: "Copy link", bn: "লিংক কপি করুন" },
  copied: { en: "Copied!", bn: "কপি হয়েছে!" },
  shareWa: { en: "Share on WhatsApp", bn: "WhatsApp-এ শেয়ার" },
  shareFb: { en: "Share on Facebook", bn: "Facebook-এ শেয়ার" },
  goDashboard: { en: "Go to my dashboard →", bn: "ড্যাশবোর্ডে যান →" },
  testOrderNote: {
    en: "We've created a test order so you can see what real orders look like.",
    bn: "আপনাকে দেখানোর জন্য একটি টেস্ট অর্ডার তৈরি করা হয়েছে।",
  },
} satisfies Record<string, CopyValue>;

export type CopyKey = keyof typeof dict;

export function t(key: CopyKey, lang: Lang): string {
  return dict[key][lang];
}
