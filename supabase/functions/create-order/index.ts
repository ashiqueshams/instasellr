import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, store_id, customer_name, customer_email, amount } = await req.json();

    if (!product_id || !store_id || !customer_name || !customer_email || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const download_token = crypto.randomUUID();
    const download_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        product_id,
        store_id,
        customer_name,
        customer_email,
        amount,
        status: "paid",
        download_token,
        download_expires_at,
        download_count: 0,
      })
      .select("id")
      .single();

    if (orderError) {
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product and store info for email
    const { data: product } = await supabase
      .from("products")
      .select("name, file_url")
      .eq("id", product_id)
      .single();

    const { data: store } = await supabase
      .from("stores")
      .select("name, user_id")
      .eq("id", store_id)
      .single();

    // Build download URL
    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    const downloadUrl = `https://${projectId}.supabase.co/functions/v1/download?orderId=${order.id}&token=${download_token}`;

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && product) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">Your purchase is ready! 🎉</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Thank you for purchasing from <strong>${store?.name || "our store"}</strong>.</p>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px;">${product.name}</p>
            <p style="color: #666; font-size: 14px; margin: 0;">Amount paid: $${amount}</p>
          </div>
          <a href="${downloadUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Download Your File</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 48 hours and allows up to 3 downloads.</p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "orders@updates.lovable.app",
          to: [customer_email],
          subject: `Your purchase is ready — ${product.name}`,
          html: emailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({ order_id: order.id, download_token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
