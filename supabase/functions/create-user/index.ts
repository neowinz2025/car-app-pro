import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as bcrypt from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  name: string;
  cpf: string;
  role: 'super_admin' | 'admin' | 'user';
  storeId?: string;
  password?: string;
  createdBy: string;
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

    const { name, cpf, role, storeId, password, createdBy }: CreateUserRequest = await req.json();

    if (!name || !cpf) {
      return new Response(
        JSON.stringify({ error: 'Nome e CPF são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cpf.length !== 11 || !/^\d+$/.test(cpf)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido. Deve conter 11 dígitos numéricos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'CPF já cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let normalizedRole = (role || 'user').toLowerCase();
    if (normalizedRole === 'operador') normalizedRole = 'user';

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        cpf,
        role: normalizedRole,
        store_id: storeId || null,
        created_by: createdBy,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + userError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar senha do usuário (se não fornecida, usa os 4 últimos dígitos do CPF)
    const userPassword = password && password.trim() ? password : cpf.slice(-4);
    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync(userPassword, salt);

    const { error: passwordError } = await supabase
      .from('user_passwords')
      .insert({
        user_id: userData.id,
        password_hash: passwordHash,
      });

    if (passwordError) {
      console.error('Error creating user password:', passwordError);
      // Não falha a criação do usuário, mas loga o erro
    }

    return new Response(
      JSON.stringify({ success: true, userId: userData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
