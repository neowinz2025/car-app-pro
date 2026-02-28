import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  name: string;
  cpf: string;
  role: 'admin' | 'user';
  password: string;
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

    const { name, cpf, role, password, createdBy }: CreateUserRequest = await req.json();

    if (!name || !cpf || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, CPF e senha são obrigatórios' }),
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        cpf,
        role: role || 'user',
        created_by: createdBy,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: passwordError } = await supabase
      .from('user_passwords')
      .insert({
        user_id: userData.id,
        password_hash: hashedPassword,
      });

    if (passwordError) {
      await supabase.from('users').delete().eq('id', userData.id);
      console.error('Error creating password:', passwordError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar senha do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
