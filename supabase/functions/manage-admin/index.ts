import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ManageAdminRequest {
  action: "toggle_active" | "delete";
  adminId: string;
  callerUsername: string;
  active?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, adminId, callerUsername, active }: ManageAdminRequest = await req.json();

    if (!action || !adminId || !callerUsername) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: caller } = await supabase
      .from("admins")
      .select("id, role, active, username")
      .eq("username", callerUsername)
      .eq("active", true)
      .maybeSingle();

    if (!caller || caller.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: targetAdmin } = await supabase
      .from("admins")
      .select("id, username")
      .eq("id", adminId)
      .maybeSingle();

    if (!targetAdmin) {
      return new Response(
        JSON.stringify({ error: "Administrador não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetAdmin.username === callerUsername) {
      return new Response(
        JSON.stringify({ error: "Você não pode alterar seu próprio usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "toggle_active") {
      const { error } = await supabase
        .from("admins")
        .update({ active: active ?? false })
        .eq("id", adminId);

      if (error) {
        console.error("Error toggling admin:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao alterar status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", adminId);

      if (error) {
        console.error("Error deleting admin:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao excluir administrador" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manage-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
