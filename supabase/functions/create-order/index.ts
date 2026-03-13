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
    const {
      product_id, store_id, customer_name, customer_email,
      customer_phone, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
      recipient_city_id, recipient_zone_id, recipient_area_id, quantity
    } = await req.json();

    if (!product_id || !store_id || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate inputs
    if (typeof customer_name !== "string" || customer_name.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid customer name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof customer_email !== "string" || customer_email.length > 255 || !customer_email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Server-side price lookup — never trust client-supplied amount
    const { data: productCheck, error: productCheckErr } = await supabase
      .from("products")
      .select("price, product_type")
      .eq("id", product_id)
      .single();

    if (productCheckErr || !productCheck) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serverAmount = Number(productCheck.price) * qty;

    const download_token = crypto.randomUUID();
    const download_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        product_id,
        store_id,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        shipping_address: shipping_address || null,
        shipping_city: shipping_city || null,
        shipping_state: shipping_state || null,
        shipping_zip: shipping_zip || null,
        shipping_country: shipping_country || null,
        amount: serverAmount,
        status: "paid",
        download_token,
        download_expires_at,
        download_count: 0,
        order_items: [{ quantity: qty }],
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
    
    const isDigital = productCheck.product_type === "digital";

    const { data: store } = await supabase
      .from("stores")
      .select("name, user_id")
      .eq("id", store_id)
      .single();

    // Build download URL (only for digital products)
    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    const downloadUrl = `https://${projectId}.supabase.co/functions/v1/download?orderId=${order.id}&token=${download_token}`;

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && product) {
      // isDigital already determined above from productCheck

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">Your order is confirmed! 🎉</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Thank you for purchasing from <strong>${store?.name || "our store"}</strong>.</p>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px;">${product.name}</p>
            <p style="color: #666; font-size: 14px; margin: 0;">Amount paid: $${serverAmount}</p>
            ${!isDigital && shipping_address ? `<p style="color: #666; font-size: 14px; margin: 8px 0 0;">Ships to: ${shipping_address}, ${shipping_city || ""} ${shipping_state || ""} ${shipping_zip || ""}, ${shipping_country || ""}</p>` : ""}
          </div>
          ${isDigital ? `<a href="${downloadUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Download Your File</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 48 hours and allows up to 10 downloads.</p>` : `<p style="color: #666; font-size: 14px;">Your order will be shipped soon. We'll notify you with tracking details.</p>`}
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [customer_email],
          subject: `Your order is confirmed — ${product.name}`,
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
