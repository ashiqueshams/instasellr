import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorPage(title: string, message: string): Response {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 20px rgba(0,0,0,0.08);}
h1{font-size:20px;color:#1a1a1a;margin:0 0 8px;}p{color:#666;font-size:14px;margin:0;}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
  return new Response(html, {
    status: 403,
    headers: { "Content-Type": "text/html", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const token = url.searchParams.get("token");

  if (!orderId || !token) {
    return errorPage("Invalid Link", "This download link is missing required parameters.");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch order with product info
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(file_url, name)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return errorPage("Order Not Found", "We couldn't find this order. Please check your link.");
  }

  // Verify token
  if (order.download_token !== token) {
    return errorPage("Invalid Token", "This download link is not valid.");
  }

  // Verify status
  if (order.status !== "paid") {
    return errorPage("Payment Required", "This order has not been paid yet.");
  }

  // Check expiry
  if (order.download_expires_at && new Date(order.download_expires_at) < new Date()) {
    return errorPage("Link Expired", "This download link has expired. It was valid for 48 hours after purchase.");
  }

  // Check download count
  if ((order.download_count ?? 0) >= 3) {
    return errorPage("Download Limit Reached", "You've reached the maximum of 3 downloads for this order.");
  }

  // Get file URL
  const fileUrl = (order as any).products?.file_url;
  if (!fileUrl) {
    return errorPage("No File Available", "The product file is not available for download.");
  }

  // Generate signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from("product-files")
    .createSignedUrl(fileUrl, 60);

  if (signedError || !signedData?.signedUrl) {
    return errorPage("Download Error", "We couldn't generate your download link. Please try again.");
  }

  // Increment download count
  await supabase
    .from("orders")
    .update({ download_count: (order.download_count ?? 0) + 1 })
    .eq("id", orderId);

  // Redirect to signed URL
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: signedData.signedUrl },
  });
});
