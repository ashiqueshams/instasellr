// Central tracking helper. All ad pixel calls in the storefront must go through here.
// Never call fbq/gtag/ttq directly from page components.

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    ttq?: any;
    TiktokAnalyticsObject?: string;
    __pixelConfig?: PixelConfig;
  }
}

export interface PixelConfig {
  meta_pixel_id?: string | null;
  google_ads_conversion_id?: string | null;
  google_ads_conversion_label?: string | null;
  tiktok_pixel_id?: string | null;
  currency?: string;
}

const CONSENT_KEY = "tracking_consent";
const FBC_KEY = "_fbc";
const TTCLID_KEY = "_ttclid";

export function hasConsent(): boolean {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v !== "false";
  } catch {
    return true;
  }
}

export function getConfig(): PixelConfig | null {
  return (typeof window !== "undefined" ? window.__pixelConfig : null) || null;
}

function isConfigured(cfg: PixelConfig | null): boolean {
  if (!cfg) return false;
  return !!(cfg.meta_pixel_id || cfg.google_ads_conversion_id || cfg.tiktok_pixel_id);
}

/** Capture fbclid / ttclid from URL and persist for later CAPI/server-side use. */
export function captureClickIds() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      localStorage.setItem(FBC_KEY, fbc);
    }
    const ttclid = params.get("ttclid");
    if (ttclid) {
      localStorage.setItem(TTCLID_KEY, ttclid);
    }
  } catch {
    /* ignore */
  }
}

export function getClickIds() {
  try {
    const fbc = localStorage.getItem(FBC_KEY);
    const ttclid = localStorage.getItem(TTCLID_KEY);
    // _fbp is set by Meta pixel base code as a cookie
    const fbp = readCookie("_fbp");
    return { fbc, fbp, ttclid };
  } catch {
    return { fbc: null, fbp: null, ttclid: null };
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/** Generic event dispatcher — fans out to enabled platforms. */
export function trackEvent(eventName: string, payload: Record<string, any> = {}, options?: { eventID?: string }) {
  const cfg = getConfig();
  if (!hasConsent()) return;

  if (!isConfigured(cfg)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[tracking] trackEvent("${eventName}") called but no pixels are configured.`);
    }
    return;
  }

  try {
    if (cfg?.meta_pixel_id && typeof window.fbq === "function") {
      if (options?.eventID) {
        window.fbq("track", eventName, payload, { eventID: options.eventID });
      } else {
        window.fbq("track", eventName, payload);
      }
    }
  } catch {/* swallow */}

  try {
    if (cfg?.tiktok_pixel_id && window.ttq) {
      // TikTok uses its own purchase event name
      const ttEvent = eventName === "Purchase" ? "PlaceAnOrder" : eventName;
      window.ttq.track(ttEvent, payload);
    }
  } catch {/* swallow */}
}

// ---------- Named convenience wrappers ----------

export function trackPageView() {
  const cfg = getConfig();
  if (!hasConsent() || !isConfigured(cfg)) return;
  try { window.fbq?.("track", "PageView"); } catch {}
  try { window.ttq?.track?.("PageView"); } catch {}
  // Google Ads PageView is handled by gtag config call.
}

export function trackViewContent(product: { id: string; name: string; price: number }) {
  const cfg = getConfig();
  trackEvent("ViewContent", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value: product.price,
    currency: cfg?.currency || "USD",
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity: number) {
  const cfg = getConfig();
  trackEvent("AddToCart", {
    content_name: product.name,
    content_ids: [product.id],
    value: product.price * quantity,
    currency: cfg?.currency || "USD",
    quantity,
  });
}

export function trackInitiateCheckout(cart: { totalItems: number; totalValue: number; productIds: string[] }) {
  const cfg = getConfig();
  trackEvent("InitiateCheckout", {
    num_items: cart.totalItems,
    value: cart.totalValue,
    currency: cfg?.currency || "USD",
    content_ids: cart.productIds,
  });
}

export interface PurchaseInfo {
  id: string;
  total: number;
  productIds: string[];
}

export function trackPurchase(order: PurchaseInfo) {
  const cfg = getConfig();
  if (!hasConsent() || !isConfigured(cfg)) return;
  const currency = cfg?.currency || "USD";
  const eventId = `purchase_${order.id}`;

  const payload = {
    value: order.total,
    currency,
    order_id: order.id,
    content_ids: order.productIds,
    contents: order.productIds.map((id) => ({ id, quantity: 1 })),
    num_items: order.productIds.length,
  };

  try {
    if (cfg?.meta_pixel_id && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", payload, { eventID: eventId });
    }
  } catch {}

  try {
    if (cfg?.google_ads_conversion_id && cfg?.google_ads_conversion_label && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: `${cfg.google_ads_conversion_id}/${cfg.google_ads_conversion_label}`,
        transaction_id: order.id,
        value: order.total,
        currency,
      });
    }
  } catch {}

  try {
    if (cfg?.tiktok_pixel_id && window.ttq) {
      window.ttq.track("PlaceAnOrder", payload);
    }
  } catch {}

  return eventId;
}
