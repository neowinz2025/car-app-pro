import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LoginRequest {
  cpf: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cpf, password }: LoginRequest = await req.json();

    if (!cpf || !password) {
      return new Response(
        JSON.stringify({ error: 'CPF e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('cpf', cleanCPF)
      .maybeSingle();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'CPF ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.active) {
      return new Response(
        JSON.stringify({ error: 'Usuário inativo. Contate o administrador.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: passwordData, error: passwordError } = await supabase
      .from('user_passwords')
      .select('password_hash')
      .eq('user_id', user.id)
      .maybeSingle();

    if (passwordError || !passwordData) {
      return new Response(
        JSON.stringify({ error: 'CPF ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, passwordData.password_hash);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'CPF ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          cpf: user.cpf,
          role: user.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in user-login function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
