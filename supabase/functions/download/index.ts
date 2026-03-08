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
    .select("*, products(name)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return errorPage("Order Not Found", "We couldn't find this order. Please check your link.");
  }

  if (order.download_token !== token) {
    return errorPage("Invalid Token", "This download link is not valid.");
  }

  if (order.status !== "paid") {
    return errorPage("Payment Required", "This order has not been paid yet.");
  }

  if (order.download_expires_at && new Date(order.download_expires_at) < new Date()) {
    return errorPage("Link Expired", "This download link has expired. It was valid for 48 hours after purchase.");
  }

  if ((order.download_count ?? 0) >= 10) {
    return errorPage("Download Limit Reached", "You've reached the maximum of 10 downloads for this order.");
  }

  // Get file from product_files table
  const { data: fileRow, error: fileError } = await supabase
    .from("product_files")
    .select("file_name, file_type, file_data")
    .eq("product_id", order.product_id)
    .limit(1)
    .single();

  if (fileError || !fileRow) {
    return errorPage("No File Available", "The product file is not available for download.");
  }

  // Increment download count
  await supabase
    .from("orders")
    .update({ download_count: (order.download_count ?? 0) + 1 })
    .eq("id", orderId);

  // Decode base64 file_data to binary
  const binaryString = atob(fileRow.file_data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": fileRow.file_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileRow.file_name}"`,
    },
  });
});
