import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UpdateUserRequest {
  userId: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
  adminUsername: string;
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

    const { userId, name, role, password }: UpdateUserRequest = await req.json();

    if (!userId || !name) {
      return new Response(
        JSON.stringify({ error: 'ID e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        role: role || 'user',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: existingPassword } = await supabase
        .from('user_passwords')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingPassword) {
        const { error: passwordError } = await supabase
          .from('user_passwords')
          .update({ password_hash: hashedPassword })
          .eq('user_id', userId);

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar senha' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const { error: passwordError } = await supabase
          .from('user_passwords')
          .insert({
            user_id: userId,
            password_hash: hashedPassword,
          });

        if (passwordError) {
          console.error('Error creating password:', passwordError);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar senha' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
