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
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "No DB URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect as superuser by replacing the user in the connection string
    const superDbUrl = dbUrl.replace(/\/\/[^:]+:/, "//supabase_admin:");
    
    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1);
    const conn = await pool.connect();

    try {
      // Check current user and available roles
      const userResult = await conn.queryObject(`SELECT current_user, session_user`);
      const rolesResult = await conn.queryObject(`SELECT rolname FROM pg_roles WHERE pg_has_role(current_user, oid, 'member') ORDER BY rolname`);

      return new Response(JSON.stringify({ 
        success: false, 
        current: userResult.rows,
        available_roles: rolesResult.rows 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      conn.release();
      await pool.end();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
