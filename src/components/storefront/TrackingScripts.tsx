import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { captureClickIds, hasConsent, trackPageView, type PixelConfig } from "@/lib/tracking";

interface TrackingScriptsProps {
  storeId: string;
}

function injectMetaPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if ((window as any).fbq) return;
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  (window as any).fbq("init", pixelId);
  (window as any).fbq("track", "PageView");
}

function injectGoogleAds(conversionId: string) {
  if (typeof window === "undefined") return;
  if ((window as any).gtag) {
    (window as any).gtag("config", conversionId);
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag as any;
  gtag("js", new Date());
  gtag("config", conversionId);
}

function injectTikTokPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if ((window as any).ttq) {
    try { (window as any).ttq.track("PageView"); } catch {}
    return;
  }
  /* eslint-disable */
  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie",
    ];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: any) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: any, n?: any) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var o = document.createElement("script");
      o.type = "text/javascript";
      o.async = !0;
      o.src = r + "?sdkid=" + e + "&lib=" + t;
      var a = document.getElementsByTagName("script")[0];
      a.parentNode!.insertBefore(o, a);
    };
    ttq.load(pixelId);
    ttq.page();
  })(window, document, "ttq");
  /* eslint-enable */
  try { (window as any).ttq.track("PageView"); } catch {}
}

export default function TrackingScripts({ storeId }: TrackingScriptsProps) {
  useEffect(() => {
    if (!storeId) return;

    // Always capture click IDs even if consent denied (no scripts injected).
    captureClickIds();

    if (!hasConsent()) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("store_pixels" as any)
          .select("*")
          .eq("store_id", storeId)
          .maybeSingle();

        if (cancelled || error || !data) return;

        const cfg: PixelConfig = {
          meta_pixel_id: (data as any).meta_pixel_id || null,
          google_ads_conversion_id: (data as any).google_ads_conversion_id || null,
          google_ads_conversion_label: (data as any).google_ads_conversion_label || null,
          tiktok_pixel_id: (data as any).tiktok_pixel_id || null,
          currency: "USD",
        };

        window.__pixelConfig = cfg;

        if (cfg.meta_pixel_id) injectMetaPixel(cfg.meta_pixel_id);
        if (cfg.google_ads_conversion_id) injectGoogleAds(cfg.google_ads_conversion_id);
        if (cfg.tiktok_pixel_id) injectTikTokPixel(cfg.tiktok_pixel_id);

        // Ensure PageView fires for late-arriving config
        trackPageView();
      } catch {
        /* fail silently — tracking must never break the storefront */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return null;
}
