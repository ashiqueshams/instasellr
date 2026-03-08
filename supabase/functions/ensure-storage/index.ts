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

    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1);
    const conn = await pool.connect();

    try {
      // Grant ourselves ownership temporarily
      await conn.queryObject(`GRANT supabase_storage_admin TO postgres`);
      await conn.queryObject(`SET ROLE supabase_storage_admin`);
      
      await conn.queryObject(`ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS public boolean DEFAULT false`);
      await conn.queryObject(`ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false`);
      await conn.queryObject(`ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS file_size_limit bigint DEFAULT NULL`);
      await conn.queryObject(`ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS allowed_mime_types text[] DEFAULT NULL`);

      await conn.queryObject(`INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false) ON CONFLICT (id) DO NOTHING`);

      await conn.queryObject(`RESET ROLE`);

      // Create RLS policies
      await conn.queryObject(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload product files' AND tablename = 'objects') THEN
            CREATE POLICY "Authenticated upload product files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-files');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete product files' AND tablename = 'objects') THEN
            CREATE POLICY "Authenticated delete product files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-files');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated read product files' AND tablename = 'objects') THEN
            CREATE POLICY "Authenticated read product files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-files');
          END IF;
        END $$;
      `);

      return new Response(JSON.stringify({ success: true }), {
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
