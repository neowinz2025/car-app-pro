import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateAdminRequest {
  username: string;
  password: string;
  role?: string;
  masterKey: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { username, password, role = 'admin', masterKey }: CreateAdminRequest = await req.json();

    const MASTER_KEY = Deno.env.get("ADMIN_MASTER_KEY") || "secure_master_key_change_this";

    if (masterKey !== MASTER_KEY) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid master key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (role && !['admin', 'super_admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'admin' or 'super_admin'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return new Response(
        JSON.stringify({ error: "Username must be between 3 and 50 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: "Username already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { data: newAdmin, error } = await supabase
      .from("admins")
      .insert({
        username,
        password_hash: passwordHash,
        role,
        created_at: new Date().toISOString(),
      })
      .select("id, username, role, created_at")
      .single();

    if (error) {
      console.error("Error creating admin:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create admin", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin: newAdmin,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
