import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateAdminRequest {
  username: string;
  password: string;
  role?: string;
  createdBy?: string;
  masterKey?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { username, password, role = 'admin', createdBy, masterKey }: CreateAdminRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let authorized = false;

    if (masterKey) {
      const MASTER_KEY = Deno.env.get("ADMIN_MASTER_KEY") || "secure_master_key_change_this";
      if (masterKey === MASTER_KEY) {
        authorized = true;
      }
    }

    if (!authorized && createdBy) {
      const { data: callerAdmin } = await supabase
        .from("admins")
        .select("id, role, active")
        .eq("username", createdBy)
        .eq("active", true)
        .maybeSingle();

      if (callerAdmin && callerAdmin.role === "super_admin") {
        authorized = true;
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Usuário e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (role && !['admin', 'super_admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Nível inválido. Deve ser 'admin' ou 'super_admin'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return new Response(
        JSON.stringify({ error: "Usuário deve ter entre 3 e 50 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: "Este nome de usuário já existe" }),
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
        created_by: createdBy || null,
        active: true,
      })
      .select("id, username, role, created_at")
      .single();

    if (error) {
      console.error("Error creating admin:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao criar administrador" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, admin: newAdmin }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
