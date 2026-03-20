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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log("[create-admin] Resquest Recebido: ", bodyText);
    const body: CreateAdminRequest = JSON.parse(bodyText);
    
    const { username, password, role = 'admin', createdBy, masterKey } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[create-admin] Variáveis de ambiente faltando: URL ou SERVICE_KEY");
      throw new Error("Misconfigured environment");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let authorized = false;

    if (masterKey) {
      const MASTER_KEY = Deno.env.get("ADMIN_MASTER_KEY") || "secure_master_key_change_this";
      if (masterKey === MASTER_KEY) {
        authorized = true;
      }
    }

    if (!authorized && createdBy) {
      const { data: callerAdmin, error: callerError } = await supabase
        .from("admins")
        .select("id, role, active")
        .eq("username", createdBy)
        .eq("active", true)
        .maybeSingle();

      if (callerError) console.error("[create-admin] Erro ao buscar admin criador:", callerError);

      if (callerAdmin && callerAdmin.role === "super_admin") {
        authorized = true;
      }
    }

    if (!authorized) {
      console.error(`[create-admin] Acesso negado para o criador: ${createdBy}`);
      return new Response(
        JSON.stringify({ error: "Sua conta atual não tem permissão para cadastrar administradores." }),
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

    console.log(`[create-admin] Checando duplicidade para usuário: ${username}`);
    const { data: existingAdmin, error: existError } = await supabase
      .from("admins")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existError) console.error("[create-admin] Erro checando duplicidade:", existError);

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: "Este nome de usuário já existe" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-admin] Criptografando senha para: ${username}...`);
    // Usando bcrypt async nativo do deno via url q funciona
    const salt = await bcrypt.genSalt(8);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`[create-admin] Inserindo registro admin no BD...`);
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
      console.error("[create-admin] Erro grave no INSERT do Supabase:", error);
      return new Response(
        JSON.stringify({ error: "Erro interno ao salvar no banco", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[create-admin] Sucesso! Admin criado:", newAdmin.id);
    return new Response(
      JSON.stringify({ success: true, admin: newAdmin }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erros Desconhecidos";
    console.error(`[create-admin] Try/Catch Error:`, errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro de processamento da função Deno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
