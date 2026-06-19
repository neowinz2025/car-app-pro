import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AdminToken {
  username: string;
  token: string;
  timestamp: number;
}

async function validateAdminToken(token: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration");
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("admins")
      .select("id, username")
      .limit(1);

    if (error) {
      console.error("Error querying admins:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

async function listApiKeys(supabase: any) {
  const { data, error } = await supabase
    .from("plate_recognizer_api_keys")
    .select("*")
    .order("priority", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function createApiKey(
  supabase: any,
  name: string,
  api_key: string,
  monthly_limit: number
) {
  const { data, error } = await supabase
    .from("plate_recognizer_api_keys")
    .insert({
      name,
      api_key,
      monthly_limit,
      priority: 0,
      active: true,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

async function updateApiKey(
  supabase: any,
  id: string,
  updates: Record<string, any>
) {
  const { data, error } = await supabase
    .from("plate_recognizer_api_keys")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0];
}

async function deleteApiKey(supabase: any, id: string) {
  const { error } = await supabase
    .from("plate_recognizer_api_keys")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (method === "GET" && action === "list") {
      const keys = await listApiKeys(supabase);
      return new Response(JSON.stringify({ keys }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST" && action === "create") {
      const body = await req.json();
      const { name, api_key, monthly_limit } = body;

      if (!name || !api_key || !monthly_limit) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const key = await createApiKey(supabase, name, api_key, monthly_limit);
      return new Response(JSON.stringify({ key }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT" && action === "update") {
      const body = await req.json();
      const { id, updates } = body;

      if (!id || !updates) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const key = await updateApiKey(supabase, id, updates);
      return new Response(JSON.stringify({ key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE" && action === "delete") {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await deleteApiKey(supabase, id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
